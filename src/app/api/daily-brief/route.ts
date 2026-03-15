import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateDistributorBrief } from '@/lib/gemini';
import type { DailyBrief } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function generateBriefInline(supabase: ReturnType<typeof getSupabase>, today: string): Promise<void> {
  // Need news to generate a brief — check news_cache
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: newsItems } = await supabase
    .from('mfd_news_cache')
    .select('title, summary, source')
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!newsItems || newsItems.length === 0) return;

  const brief = await generateDistributorBrief(
    newsItems.map((n) => ({
      title: n.title,
      summary: n.summary || '',
      source: n.source,
    }))
  );

  await supabase.from('mfd_daily_briefs').upsert(
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

  await supabase.from('mfd_data_metadata').upsert(
    {
      key: 'daily_brief_data',
      last_updated: new Date().toISOString(),
      status: 'success',
      details: { trigger: 'auto-refresh-on-visit' },
    },
    { onConflict: 'key' }
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const today = new Date().toISOString().split('T')[0];

    // Try to get today's brief first
    const { data: todayBrief, error: todayError } = await supabase
      .from('mfd_daily_briefs')
      .select('*')
      .eq('brief_date', today)
      .single();

    if (todayBrief && !todayError) {
      const brief: DailyBrief = {
        date: todayBrief.brief_date,
        generatedAt: todayBrief.generated_at,
        topStories: todayBrief.top_stories || [],
        conversationStarters: todayBrief.conversation_starters || [],
        actionItems: todayBrief.action_items || [],
        dailyWisdom: todayBrief.daily_wisdom || '',
      };

      return NextResponse.json({
        brief,
        lastUpdated: todayBrief.generated_at,
      });
    }

    // No today's brief — auto-generate it
    try {
      await generateBriefInline(supabase, today);
    } catch (genErr) {
      console.error('Auto-generate daily brief failed:', genErr);
    }

    // Re-fetch — either freshly generated or latest available
    const { data: brief_row } = await supabase
      .from('mfd_daily_briefs')
      .select('*')
      .order('brief_date', { ascending: false })
      .limit(1)
      .single();

    if (!brief_row) {
      return NextResponse.json({
        brief: null,
        error: 'No daily brief available. News data may be missing — try refreshing the News page first.',
      });
    }

    const brief: DailyBrief = {
      date: brief_row.brief_date,
      generatedAt: brief_row.generated_at,
      topStories: brief_row.top_stories || [],
      conversationStarters: brief_row.conversation_starters || [],
      actionItems: brief_row.action_items || [],
      dailyWisdom: brief_row.daily_wisdom || '',
    };

    return NextResponse.json({
      brief,
      lastUpdated: brief_row.generated_at,
      isStale: brief_row.brief_date !== today,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch daily brief',
      },
      { status: 500 }
    );
  }
}
