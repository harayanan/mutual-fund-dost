import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { fetchLatestNews } from '@/lib/news-fetcher';
import { analyzeNewsForInvestors } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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
      .from('news_cache')
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

/** Manual refresh: fetch fresh news from RSS, analyze with Gemini, store in cache. */
export async function POST() {
  const startTime = Date.now();

  try {
    const newsItems = await fetchLatestNews(20);

    if (newsItems.length === 0) {
      return NextResponse.json({ success: true, refreshed: 0, message: 'No news sources available' });
    }

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
        newsItems.map((n) => ({ title: n.title, summary: n.summary, source: n.source }))
      );
    } catch (aiError) {
      console.error('Gemini analysis failed during manual refresh:', aiError);
    }

    const enrichedNews = newsItems
      .map((news, index) => {
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
          relevance_score: analysis?.relevance_score || 0,
          skip: analysis?.skip || false,
        };
      })
      .filter((item) => !item.skip && item.ai_analysis !== null)
      .map(({ skip, relevance_score, ...rest }) => rest);

    const supabase = getSupabase();
    const { error: insertError } = await supabase.from('news_cache').insert(enrichedNews);

    if (insertError) {
      console.error('Cache insert failed during manual refresh:', insertError.message);
    }

    const duration = Date.now() - startTime;
    await supabase.from('data_metadata').upsert(
      {
        key: 'news_data',
        last_updated: new Date().toISOString(),
        status: 'success',
        details: {
          fetchedCount: newsItems.length,
          analyzedCount: analyses.length,
          qualityCount: enrichedNews.length,
          skippedCount: newsItems.length - enrichedNews.length,
          durationMs: duration,
          trigger: 'manual',
        },
      },
      { onConflict: 'key' }
    );

    return NextResponse.json({
      success: true,
      refreshed: enrichedNews.length,
      durationMs: duration,
    });
  } catch (error) {
    console.error('Manual news refresh error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
