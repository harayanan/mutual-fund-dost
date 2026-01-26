import { NextResponse } from 'next/server';
import { fetchLatestNews } from '@/lib/news-fetcher';
import { analyzeNewsForInvestors } from '@/lib/gemini';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Cache duration: 4 hours
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export async function GET() {
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
      // Return cached news from the last 4 hours
      const { data: cachedNews } = await getSupabase()
        .from('news_cache')
        .select('*')
        .gte(
          'created_at',
          new Date(Date.now() - CACHE_TTL_MS).toISOString()
        )
        .order('created_at', { ascending: false })
        .limit(15);

      return NextResponse.json({
        news: cachedNews || [],
        cached: true,
        lastUpdated: cached[0].created_at,
      });
    }

    // Fetch fresh news
    const newsItems = await fetchLatestNews(12);

    if (newsItems.length === 0) {
      return NextResponse.json({
        news: [],
        cached: false,
        error: 'No news sources available at the moment',
      });
    }

    // Analyze with Gemini
    let analyses: Array<{
      news_index: number;
      category: string;
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
      // Continue without AI analysis
    }

    // Combine news with analysis
    const enrichedNews = newsItems.map((news, index) => {
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

    // Cache in Supabase (best effort)
    try {
      await getSupabase().from('news_cache').insert(enrichedNews);
    } catch (cacheError) {
      console.error('Cache insert failed:', cacheError);
    }

    return NextResponse.json({
      news: enrichedNews,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      {
        news: [],
        error: 'Failed to fetch news. Please try again.',
      },
      { status: 500 }
    );
  }
}
