/**
 * VPS-side news refresh script.
 * Fetches RSS feeds (accessible from VPS, blocked from Vercel),
 * calls Gemini for analysis, and upserts into Supabase.
 * Also generates the daily brief after news is refreshed.
 */

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Config ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const RSS_FEEDS = [
  { url: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms', source: 'Economic Times - Markets' },
  { url: 'https://www.moneycontrol.com/rss/MCtopnews.xml', source: 'Moneycontrol' },
  { url: 'https://www.livemint.com/rss/markets', source: 'Livemint - Markets' },
  { url: 'https://economictimes.indiatimes.com/markets/mutual-funds/rssfeeds/62689456.cms', source: 'Economic Times - Mutual Funds' },
];

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// --- Step 1: Fetch RSS ---
async function fetchRss() {
  const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MutualFundDost/1.0)' } });
  const allNews = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items || []).slice(0, 8).map((item) => ({
        title: item.title || 'Untitled',
        summary: stripHtml(item.contentSnippet || item.content || item.title || '').slice(0, 300),
        source: feed.source,
        url: item.link || '',
        publishedAt: item.pubDate || new Date().toISOString(),
      }));
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') allNews.push(...r.value);
    else console.error('RSS feed failed:', r.reason?.message || r.reason);
  }

  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return allNews.slice(0, 20);
}

// --- Step 2: Analyze with Gemini ---
async function analyzeNews(newsItems) {
  const prompt = `You are a financial news analyst for Indian mutual fund investors. Analyze these news items and return a JSON array.

For each item, return:
- news_index (1-based)
- category: one of "macro", "geopolitical", "company", "sector", "regulatory", "market"
- relevance_score: 1-10 (10=most relevant to Indian mutual fund investors)
- skip: true if irrelevant (score < 4)
- impact: "positive", "negative", or "neutral"
- significance: "high", "medium", or "low"
- affected_funds: array of XYZ mutual fund categories potentially affected (e.g., "Large Cap", "Flexi Cap", "Debt Short Term")
- insight: 1-2 sentence explanation of why this matters to Indian mutual fund investors
- investor_action: specific actionable advice for long-term investors

NEWS ITEMS:
${newsItems.map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   ${n.summary}`).join('\n\n')}

Return ONLY a JSON array, no markdown.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
}

// --- Step 3: Generate Daily Brief ---
async function generateBrief(newsItems) {
  const prompt = `You are a daily briefing assistant for Indian mutual fund distributors. Generate a comprehensive daily brief.

Return a JSON object with:
- topStories: array of 4-6 objects, each with: title, source, category, urgency ("high"/"medium"/"low"), clientImplication (2-3 sentences), talkingPoints (2 bullet points), affectedClientSegments (array like "retirees", "HNI clients", "SIP investors")
- conversationStarters: array of 4 objects with: topic, opener (a "try saying" phrase), keyPoint, clientBenefit
- actionItems: array of 3-5 objects with: task, priority ("high"/"medium"/"low"), clientSegment (optional), deadline (optional)
- dailyWisdom: one inspiring quote about investing or wealth management

NEWS ITEMS:
${newsItems.map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   ${n.summary}`).join('\n\n')}

Return ONLY a JSON object, no markdown.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
}

// --- Main ---
async function main() {
  console.log('Fetching RSS feeds...');
  const newsItems = await fetchRss();
  console.log(`Fetched ${newsItems.length} news items`);

  if (newsItems.length === 0) {
    console.log('No news items found, exiting.');
    return;
  }

  // Analyze news
  console.log('Analyzing with Gemini...');
  let analyses = [];
  try {
    analyses = await analyzeNews(newsItems);
  } catch (err) {
    console.error('Gemini analysis failed:', err.message);
  }

  // Build enriched news
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
      };
    })
    .filter((item) => item.ai_analysis !== null);

  console.log(`${enrichedNews.length} quality items after filtering`);

  // Insert into Supabase
  if (enrichedNews.length > 0) {
    const { error: insertErr } = await supabase.from('mfd_news_cache').insert(enrichedNews);
    if (insertErr) console.error('News insert error:', insertErr.message);
    else console.log('News inserted into Supabase');
  }

  // Update metadata
  await supabase.from('mfd_data_metadata').upsert(
    { key: 'news_data', last_updated: new Date().toISOString(), status: 'success', details: { trigger: 'vps-cron', count: enrichedNews.length } },
    { onConflict: 'key' }
  );

  // Generate daily brief
  console.log('Generating daily brief...');
  try {
    const brief = await generateBrief(newsItems);
    const today = new Date().toISOString().split('T')[0];

    const { error: briefErr } = await supabase.from('mfd_daily_briefs').upsert(
      {
        brief_date: today,
        top_stories: brief.topStories,
        conversation_starters: brief.conversationStarters,
        action_items: brief.actionItems,
        daily_wisdom: brief.dailyWisdom,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'brief_date' }
    );
    if (briefErr) console.error('Brief insert error:', briefErr.message);
    else console.log('Daily brief generated and saved');

    await supabase.from('mfd_data_metadata').upsert(
      { key: 'daily_brief_data', last_updated: new Date().toISOString(), status: 'success', details: { trigger: 'vps-cron' } },
      { onConflict: 'key' }
    );
  } catch (err) {
    console.error('Brief generation failed:', err.message);
  }

  console.log('Done!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
