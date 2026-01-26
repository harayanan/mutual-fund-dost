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
  const supabaseManagers = new Map<string, string>();

  // Try Supabase for metadata and fund managers
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

    // Get latest fund managers from Supabase (scraped from hdfcfund.com)
    const { data: dbFunds } = await supabase
      .from('funds')
      .select('id, fund_manager');

    if (dbFunds) {
      for (const f of dbFunds) {
        if (f.fund_manager) {
          supabaseManagers.set(f.id, f.fund_manager);
        }
      }
    }
  } catch {
    // Supabase unavailable, will use static data entirely
  }

  // Use static data with Supabase manager overrides
  let funds = HDFC_FUNDS.map((f) => {
    const dbManager = supabaseManagers.get(f.id);
    return dbManager ? { ...f, fundManager: dbManager } : f;
  });

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
