import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
}

const RSS_FEEDS = [
  {
    url: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
    source: 'Economic Times - Markets',
  },
  {
    url: 'https://www.moneycontrol.com/rss/MCtopnews.xml',
    source: 'Moneycontrol',
  },
  {
    url: 'https://www.livemint.com/rss/markets',
    source: 'Livemint - Markets',
  },
  {
    url: 'https://economictimes.indiatimes.com/markets/mutual-funds/rssfeeds/62689456.cms',
    source: 'Economic Times - Mutual Funds',
  },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

async function fetchRssXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MutualFundDost/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchLatestNews(limit: number = 20): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];
  const parser = new Parser();

  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      // Use global fetch (works on Vercel Edge/Serverless) instead of rss-parser's http module
      const xml = await fetchRssXml(feed.url);
      const parsed = await parser.parseString(xml);
      return (parsed.items || []).slice(0, 8).map((item) => ({
        title: item.title || 'Untitled',
        summary: stripHtml(item.contentSnippet || item.content || item.title || '').slice(0, 300),
        source: feed.source,
        url: item.link || '',
        publishedAt: item.pubDate || new Date().toISOString(),
      }));
    } catch (error) {
      console.error(`Failed to fetch RSS from ${feed.source}:`, error instanceof Error ? error.message : error);
      return [];
    }
  });

  const results = await Promise.allSettled(feedPromises);
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
    }
  }

  // Sort by date, newest first
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return allNews.slice(0, limit);
}
