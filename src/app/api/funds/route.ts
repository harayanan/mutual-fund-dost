import { NextRequest, NextResponse } from 'next/server';
import { HDFC_FUNDS } from '@/data/hdfc-funds';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const riskLevel = searchParams.get('riskLevel');
  const search = searchParams.get('search');

  let lastUpdated: string | null = null;

  // Try Supabase first
  try {
    const supabase = getSupabase();

    // Get last updated timestamp
    const { data: meta } = await supabase
      .from('data_metadata')
      .select('last_updated')
      .eq('key', 'fund_data')
      .single();

    if (meta) {
      lastUpdated = meta.last_updated;
    }
  } catch {
    // Supabase unavailable, will use static data
  }

  // Use static data (always available, updated by cron via refreshAllFunds)
  let funds = [...HDFC_FUNDS];

  if (category) {
    funds = funds.filter((f) => f.category === category);
  }

  if (riskLevel) {
    funds = funds.filter((f) => f.riskLevel === riskLevel);
  }

  if (search) {
    const q = search.toLowerCase();
    funds = funds.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.subCategory.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    funds,
    total: funds.length,
    lastUpdated,
  });
}
