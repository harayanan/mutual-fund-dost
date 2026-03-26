import { NextRequest, NextResponse } from 'next/server';

// Proxy to mfapi.in to avoid CORS in client
// GET /api/planner/nav?code=118955&date=2024-01-15
// GET /api/planner/nav?code=118955  → latest NAV
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const date = searchParams.get('date'); // YYYY-MM-DD

  if (!code || !/^\d+$/.test(code)) {
    return NextResponse.json({ error: 'Invalid scheme code' }, { status: 400 });
  }

  try {
    // mfapi.in returns all historical NAVs for a scheme
    const res = await fetch(`https://api.mfapi.in/mf/${code}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Fund data not available' }, { status: 502 });
    }

    const data = await res.json();

    if (!date) {
      // Return latest NAV only
      const latest = data.data?.[0];
      return NextResponse.json({
        nav: latest?.nav ? parseFloat(latest.nav) : null,
        date: latest?.date ?? null,
        fundName: data.meta?.scheme_name ?? null,
      });
    }

    // Find NAV for the requested date (mfapi format: DD-MM-YYYY)
    const [y, m, d] = date.split('-');
    const mfapiDate = `${d}-${m}-${y}`;
    const entry = data.data?.find((e: { date: string; nav: string }) => e.date === mfapiDate);

    if (!entry) {
      // Return closest available date
      return NextResponse.json({ error: `NAV not found for ${date}`, fundName: data.meta?.scheme_name ?? null }, { status: 404 });
    }

    return NextResponse.json({
      nav: parseFloat(entry.nav),
      date: entry.date,
      fundName: data.meta?.scheme_name ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch NAV data' }, { status: 500 });
  }
}
