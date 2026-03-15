import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateMondayBrief } from '@/lib/gemini';

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

export async function POST() {
  const startTime = Date.now();

  try {
    const supabase = getSupabase();
    const weekOf = getCurrentWeekMonday();

    // Get last 7 days of news
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newsItems } = await supabase
      .from('mfd_news_cache')
      .select('title, summary, source')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(40);

    if (!newsItems || newsItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No recent news available to generate brief',
        durationMs: Date.now() - startTime,
      });
    }

    // Get fund data
    const { data: funds } = await supabase.from('mfd_funds').select('name, sub_category, aum_crores');
    const { data: performance } = await supabase.from('mfd_fund_performance').select('fund_id, return_1y, return_3y, return_5y, return_10y');

    const perfMap = new Map((performance || []).map((p) => [p.fund_id, p]));
    const fundData = (funds || []).map((f) => {
      const slug = f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const perf = perfMap.get(slug) || perfMap.get(slug.replace('-fund', ''));
      return {
        name: f.name, subCategory: f.sub_category, aumCrores: f.aum_crores,
        return1Y: perf?.return_1y ?? null, return3Y: perf?.return_3y ?? null,
        return5Y: perf?.return_5y ?? null, return10Y: perf?.return_10y ?? null,
      };
    });

    const brief = await generateMondayBrief(newsItems, fundData);

    await supabase.from('mfd_monday_briefs').upsert(
      { week_of: weekOf, brief_data: brief, generated_at: brief.generatedAt },
      { onConflict: 'week_of' }
    );

    await supabase.from('mfd_data_metadata').upsert(
      { key: 'monday_brief_data', last_updated: new Date().toISOString(), status: 'success', details: { trigger: 'manual', weekOf, newsCount: newsItems.length } },
      { onConflict: 'key' }
    );

    return NextResponse.json({
      success: true,
      weekOf,
      newsCount: newsItems.length,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
