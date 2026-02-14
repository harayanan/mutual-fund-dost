import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const significanceOrder: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

interface NewsRow {
  ai_analysis: string | null;
  investor_action: string | null;
  category: string;
  significance: string;
  published_at: string;
  [key: string]: unknown;
}

function sortBySignificanceThenDate(a: NewsRow, b: NewsRow): number {
  const sigA = significanceOrder[a.significance] ?? 2;
  const sigB = significanceOrder[b.significance] ?? 2;
  if (sigA !== sigB) return sigA - sigB;
  return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const category = searchParams.get('category') || 'all';

  try {
    // Serve only from pre-computed cache (populated by cron job)
    let query = getSupabase()
      .from('mfd_news_cache')
      .select('*')
      .not('ai_analysis', 'is', null)
      .not('investor_action', 'is', null);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: cachedNews } = await query.order('created_at', { ascending: false });

    if (!cachedNews || cachedNews.length === 0) {
      return NextResponse.json({
        news: [],
        total: 0,
        page: 1,
        totalPages: 0,
        cached: true,
        lastUpdated: null,
      });
    }

    const allItems = cachedNews as NewsRow[];
    allItems.sort(sortBySignificanceThenDate);

    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedNews = allItems.slice(start, start + limit);

    return NextResponse.json({
      news: paginatedNews,
      total,
      page,
      totalPages,
      cached: true,
      lastUpdated: cachedNews[0].created_at,
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      {
        news: [],
        total: 0,
        page: 1,
        totalPages: 0,
        error: 'Failed to fetch news. Please try again.',
      },
      { status: 500 }
    );
  }
}
