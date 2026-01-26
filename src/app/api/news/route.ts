import { NextRequest, NextResponse } from 'next/server';
import { fetchLatestNews } from '@/lib/news-fetcher';
import { analyzeNewsForInvestors } from '@/lib/gemini';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Cache duration: 4 hours
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

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
    // Check cache first
    const { data: cached } = await getSupabase()
      .from('news_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (
      cached &&
      cached.length > 0 &&
      new Date().getTime() - new Date(cached[0].created_at).getTime() < CACHE_TTL_MS
    ) {
      // Build query for cached news from the last 4 hours
      let query = getSupabase()
        .from('news_cache')
        .select('*')
        .gte(
          'created_at',
          new Date(Date.now() - CACHE_TTL_MS).toISOString()
        )
        .not('ai_analysis', 'is', null)
        .not('investor_action', 'is', null);

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data: cachedNews } = await query.order('created_at', { ascending: false });

      const allItems = (cachedNews || []) as NewsRow[];
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
        lastUpdated: cached[0].created_at,
      });
    }

    // Fetch fresh news
    const newsItems = await fetchLatestNews(20);

    if (newsItems.length === 0) {
      return NextResponse.json({
        news: [],
        total: 0,
        page: 1,
        totalPages: 0,
        cached: false,
        error: 'No news sources available at the moment',
      });
    }

    // Analyze with Gemini
    let analyses: Array<{
      news_index: number;
      category: string;
      relevance_score: number;
      skip: boolean;
      impact: string;
      significance: string;
      affected_funds: string[];
      insight: string;
      investor_action: string;
    }> = [];

    try {
      analyses = await analyzeNewsForInvestors(
        newsItems.map((n) => ({
          title: n.title,
          summary: n.summary,
          source: n.source,
        }))
      );
    } catch (aiError) {
      console.error('Gemini analysis failed:', aiError);
    }

    // Combine news with analysis
    const allEnriched = newsItems.map((news, index) => {
      const analysis = analyses.find((a) => a.news_index === index + 1);
      return {
        title: news.title,
        source: news.source,
        url: news.url,
        published_at: news.publishedAt,
        summary: news.summary,
        ai_analysis: analysis?.insight || null,
        category: analysis?.category || 'general',
        impact: analysis?.impact || 'neutral',
        significance: analysis?.significance || 'medium',
        impacted_funds: analysis?.affected_funds || [],
        investor_action: analysis?.investor_action || null,
      };
    });

    // Filter quality items (not skipped by Gemini, has analysis)
    const qualityItems = allEnriched.filter(
      (item) => {
        const analysis = analyses.find((a) => a.news_index === newsItems.findIndex(
          (n) => n.title === item.title
        ) + 1);
        const skipped = analysis?.skip === true;
        return !skipped && item.ai_analysis !== null && item.investor_action !== null;
      }
    );

    // Cache quality items in Supabase (best effort)
    try {
      if (qualityItems.length > 0) {
        await getSupabase().from('news_cache').insert(qualityItems);
      }
    } catch (cacheError) {
      console.error('Cache insert failed:', cacheError);
    }

    // Apply category filter, sort, and paginate
    let filtered = category === 'all'
      ? qualityItems
      : qualityItems.filter((item) => item.category === category);

    filtered.sort(sortBySignificanceThenDate);

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedNews = filtered.slice(start, start + limit);

    return NextResponse.json({
      news: paginatedNews,
      total,
      page,
      totalPages,
      cached: false,
      lastUpdated: new Date().toISOString(),
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
