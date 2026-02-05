import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { DailyBrief } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabase();
    const today = new Date().toISOString().split('T')[0];

    // Try to get today's brief first
    const { data: todayBrief, error: todayError } = await supabase
      .from('daily_briefs')
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

    // If no today's brief, get the most recent one
    const { data: latestBrief, error: latestError } = await supabase
      .from('daily_briefs')
      .select('*')
      .order('brief_date', { ascending: false })
      .limit(1)
      .single();

    if (latestError || !latestBrief) {
      return NextResponse.json({
        brief: null,
        error: 'No daily brief available. Please trigger a refresh.',
      });
    }

    const brief: DailyBrief = {
      date: latestBrief.brief_date,
      generatedAt: latestBrief.generated_at,
      topStories: latestBrief.top_stories || [],
      conversationStarters: latestBrief.conversation_starters || [],
      actionItems: latestBrief.action_items || [],
      dailyWisdom: latestBrief.daily_wisdom || '',
    };

    return NextResponse.json({
      brief,
      lastUpdated: latestBrief.generated_at,
      isStale: true, // Indicate this is not today's brief
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
