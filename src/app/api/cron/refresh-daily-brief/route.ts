import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateDistributorBrief } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const supabase = getSupabase();
    const today = new Date().toISOString().split('T')[0];

    // Fetch recent news from news_cache (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: newsItems, error: newsError } = await supabase
      .from('news_cache')
      .select('title, summary, source')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20);

    if (newsError) {
      errors.push(`Failed to fetch news: ${newsError.message}`);
    }

    if (!newsItems || newsItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No recent news available to generate brief',
        durationMs: Date.now() - startTime,
      });
    }

    // Generate the distributor brief using Gemini
    let brief;
    try {
      brief = await generateDistributorBrief(
        newsItems.map((n) => ({
          title: n.title,
          summary: n.summary || '',
          source: n.source,
        }))
      );
    } catch (aiError) {
      errors.push(`Gemini generation failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
      return NextResponse.json({
        success: false,
        error: 'AI generation failed',
        errors,
        durationMs: Date.now() - startTime,
      }, { status: 500 });
    }

    // Upsert into daily_briefs table (replace if exists for today)
    const { error: upsertError } = await supabase
      .from('daily_briefs')
      .upsert(
        {
          brief_date: today,
          top_stories: brief.topStories,
          conversation_starters: brief.conversationStarters,
          action_items: brief.actionItems,
          daily_wisdom: brief.dailyWisdom,
          generated_at: brief.generatedAt,
        },
        { onConflict: 'brief_date' }
      );

    if (upsertError) {
      errors.push(`Database insert failed: ${upsertError.message}`);
    }

    // Update metadata
    const duration = Date.now() - startTime;
    await supabase.from('data_metadata').upsert(
      {
        key: 'daily_brief_data',
        last_updated: new Date().toISOString(),
        status: errors.length === 0 ? 'success' : 'partial',
        details: {
          newsCount: newsItems.length,
          topStoriesCount: brief.topStories.length,
          conversationStartersCount: brief.conversationStarters.length,
          actionItemsCount: brief.actionItems.length,
          errors: errors.slice(0, 5),
          durationMs: duration,
        },
      },
      { onConflict: 'key' }
    );

    return NextResponse.json({
      success: true,
      newsCount: newsItems.length,
      topStoriesCount: brief.topStories.length,
      conversationStartersCount: brief.conversationStarters.length,
      actionItemsCount: brief.actionItems.length,
      errors: errors.slice(0, 5),
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    try {
      await getSupabase().from('data_metadata').upsert(
        {
          key: 'daily_brief_data',
          last_updated: new Date().toISOString(),
          status: 'error',
          details: {
            error: error instanceof Error ? error.message : String(error),
            durationMs: duration,
          },
        },
        { onConflict: 'key' }
      );
    } catch {
      // Ignore metadata update failure
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}
