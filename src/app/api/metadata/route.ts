import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('mfd_data_metadata')
      .select('*');

    if (error) {
      return NextResponse.json({ metadata: {} });
    }

    const metadata: Record<string, { lastUpdated: string; status: string; details: unknown }> = {};
    for (const row of data || []) {
      metadata[row.key] = {
        lastUpdated: row.last_updated,
        status: row.status,
        details: row.details,
      };
    }

    return NextResponse.json({ metadata });
  } catch {
    return NextResponse.json({ metadata: {} });
  }
}
