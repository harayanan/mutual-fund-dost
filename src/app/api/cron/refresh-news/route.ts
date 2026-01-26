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
    // Fetch fresh news
    const newsItems = await fetchLatestNews(12);

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

    // Insert into Supabase
    const supabase = getSupabase();
    const { error: insertError } = await supabase.from('news_cache').insert(enrichedNews);

    if (insertError) {
      errors.push(`Cache insert failed: ${insertError.message}`);
    }

    // Update metadata
    const duration = Date.now() - startTime;
    await supabase.from('data_metadata').upsert(
      {
        key: 'news_data',
        last_updated: new Date().toISOString(),
        status: errors.length === 0 ? 'success' : 'partial',
        details: {
          newsCount: enrichedNews.length,
          analyzedCount: analyses.length,
          errors: errors.slice(0, 5),
          durationMs: duration,
        },
      },
      { onConflict: 'key' }
    );

    return NextResponse.json({
      success: true,
      newsCount: enrichedNews.length,
      analyzedCount: analyses.length,
      errors: errors.slice(0, 5),
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    try {
      await getSupabase().from('data_metadata').upsert(
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
