import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateDistributorBrief } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST() {
  const startTime = Date.now();

  try {
    const supabase = getSupabase();
    const today = new Date().toISOString().split('T')[0];

    // Fetch recent news from news_cache (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: newsItems, error: newsError } = await supabase
      .from('mfd_news_cache')
      .select('title, summary, source')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20);

    if (newsError) {
      console.error('Failed to fetch news for daily brief:', newsError.message);
    }

    if (!newsItems || newsItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No recent news available to generate brief',
        durationMs: Date.now() - startTime,
      });
    }

    const brief = await generateDistributorBrief(
      newsItems.map((n) => ({
        title: n.title,
        summary: n.summary || '',
        source: n.source,
      }))
    );

    // Upsert into daily_briefs table
    const { error: upsertError } = await supabase
      .from('mfd_daily_briefs')
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
      console.error('Database insert failed:', upsertError.message);
    }

    const duration = Date.now() - startTime;
    await supabase.from('mfd_data_metadata').upsert(
      {
        key: 'daily_brief_data',
        last_updated: new Date().toISOString(),
        status: 'success',
        details: {
          newsCount: newsItems.length,
          topStoriesCount: brief.topStories.length,
          conversationStartersCount: brief.conversationStarters.length,
          actionItemsCount: brief.actionItems.length,
          durationMs: duration,
          trigger: 'manual',
        },
      },
      { onConflict: 'key' }
    );

    return NextResponse.json({
      success: true,
      newsCount: newsItems.length,
      topStoriesCount: brief.topStories.length,
      durationMs: duration,
    });
  } catch (error) {
    console.error('Manual daily brief refresh error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
