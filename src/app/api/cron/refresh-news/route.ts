import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { fetchLatestNews } from '@/lib/news-fetcher';
import { analyzeNewsForInvestors } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Fetch fresh news (more items to give Gemini more to rank and filter)
    const newsItems = await fetchLatestNews(20);

    if (newsItems.length === 0) {
      return NextResponse.json({
        success: true,
        newsCount: 0,
        message: 'No news sources available',
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
      errors.push(`Gemini analysis failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
    }

    // Combine news with analysis, then filter out skipped/empty items
    const allNews = newsItems.map((news, index) => {
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
    });

    // Only keep quality items: not skipped, has AI analysis
    const enrichedNews = allNews.filter(
      (item) => !item.skip && item.ai_analysis !== null
    ).map(({ skip: _, relevance_score: __, ...rest }) => rest);

    // Insert into Supabase
    const supabase = getSupabase();
    const { error: insertError } = await supabase.from('mfd_news_cache').insert(enrichedNews);

    if (insertError) {
      errors.push(`Cache insert failed: ${insertError.message}`);
    }

    // Update metadata
    const duration = Date.now() - startTime;
    await supabase.from('mfd_data_metadata').upsert(
      {
        key: 'news_data',
        last_updated: new Date().toISOString(),
        status: errors.length === 0 ? 'success' : 'partial',
        details: {
          fetchedCount: newsItems.length,
          analyzedCount: analyses.length,
          qualityCount: enrichedNews.length,
          skippedCount: newsItems.length - enrichedNews.length,
          errors: errors.slice(0, 5),
          durationMs: duration,
        },
      },
      { onConflict: 'key' }
    );

    return NextResponse.json({
      success: true,
      fetchedCount: newsItems.length,
      qualityCount: enrichedNews.length,
      analyzedCount: analyses.length,
      skippedCount: newsItems.length - enrichedNews.length,
      errors: errors.slice(0, 5),
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    try {
      await getSupabase().from('mfd_data_metadata').upsert(
        {
          key: 'news_data',
          last_updated: new Date().toISOString(),
          status: 'error',
          details: {
            error: error instanceof Error ? error.message : String(error),
            durationMs: duration,
          },
        },
        { onConflict: 'key' }
      );
    } catch {
      // Ignore
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}
