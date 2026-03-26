import { NextResponse } from 'next/server';
import { HDFC_FUNDS } from '@/data/hdfc-funds';

// Build a set of HDFC scheme codes for fast lookup
const HDFC_CODES = new Set(HDFC_FUNDS.map((f) => f.amfiSchemeCode));

export async function GET() {
  try {
    const res = await fetch('https://www.amfiindia.com/spages/NAVAll.txt', {
      signal: AbortSignal.timeout(20000),
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'AMFI fetch failed' }, { status: 502 });
    }

    const text = await res.text();
    const navMap: Record<number, { nav: number; date: string }> = {};

    for (const line of text.split('\n')) {
      const parts = line.split(';');
      if (parts.length >= 6) {
        const code = parseInt(parts[0].trim(), 10);
        if (!HDFC_CODES.has(code)) continue;
        const nav = parseFloat(parts[4].trim());
        const date = parts[5].trim();
        if (!isNaN(code) && !isNaN(nav) && date) {
          navMap[code] = { nav, date };
        }
      }
    }

    return NextResponse.json(navMap);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch NAV data' }, { status: 500 });
  }
}
