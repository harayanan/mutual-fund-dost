import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateMondayBrief } from '@/lib/gemini';
import type { MondayBrief } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

async function generateBriefInline(supabase: ReturnType<typeof getSupabase>, weekOf: string): Promise<void> {
  // Get last 7 days of news
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: newsItems } = await supabase
    .from('mfd_news_cache')
    .select('title, summary, source')
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(40);

  // Get fund data with performance
  const { data: funds } = await supabase
    .from('mfd_funds')
    .select('name, sub_category, aum_crores');

  const { data: performance } = await supabase
    .from('mfd_fund_performance')
    .select('fund_id, return_1y, return_3y, return_5y, return_10y');

  const perfMap = new Map((performance || []).map((p) => [p.fund_id, p]));

  const fundData = (funds || []).map((f) => {
    const slug = f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const perf = perfMap.get(slug) || perfMap.get(slug.replace('-fund', ''));
    return {
      name: f.name,
      subCategory: f.sub_category,
      aumCrores: f.aum_crores,
      return1Y: perf?.return_1y ?? null,
      return3Y: perf?.return_3y ?? null,
      return5Y: perf?.return_5y ?? null,
      return10Y: perf?.return_10y ?? null,
    };
  });

  if (!newsItems || newsItems.length === 0) return;

  const brief = await generateMondayBrief(newsItems, fundData);

  await supabase.from('mfd_monday_briefs').upsert(
    {
      week_of: weekOf,
      brief_data: brief,
      generated_at: brief.generatedAt,
    },
    { onConflict: 'week_of' }
  );

  await supabase.from('mfd_data_metadata').upsert(
    {
      key: 'monday_brief_data',
      last_updated: new Date().toISOString(),
      status: 'success',
      details: { trigger: 'auto-refresh-on-visit', weekOf },
    },
    { onConflict: 'key' }
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const weekOf = getCurrentWeekMonday();

    // Try this week's brief
    const { data: existing } = await supabase
      .from('mfd_monday_briefs')
      .select('*')
      .eq('week_of', weekOf)
      .single();

    if (existing) {
      return NextResponse.json({
        brief: existing.brief_data as MondayBrief,
        lastUpdated: existing.generated_at,
      });
    }

    // Auto-generate
    try {
      await generateBriefInline(supabase, weekOf);
    } catch (genErr) {
      console.error('Auto-generate Monday brief failed:', genErr);
    }

    // Re-fetch (this week or latest)
    const { data: row } = await supabase
      .from('mfd_monday_briefs')
      .select('*')
      .order('week_of', { ascending: false })
      .limit(1)
      .single();

    if (!row) {
      return NextResponse.json({
        brief: null,
        error: 'No Monday brief available. News data may be missing.',
      });
    }

    return NextResponse.json({
      brief: row.brief_data as MondayBrief,
      lastUpdated: row.generated_at,
      isStale: row.week_of !== weekOf,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Monday brief' },
      { status: 500 }
    );
  }
}
