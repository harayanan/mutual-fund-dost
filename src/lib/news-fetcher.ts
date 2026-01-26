import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'MutualFundDost/1.0',
  },
});

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

export async function fetchLatestNews(limit: number = 20): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items || []).slice(0, 8).map((item) => ({
        title: item.title || 'Untitled',
        summary: stripHtml(item.contentSnippet || item.content || item.title || '').slice(0, 300),
        source: feed.source,
        url: item.link || '',
        publishedAt: item.pubDate || new Date().toISOString(),
      }));
    } catch (error) {
      console.error(`Failed to fetch RSS from ${feed.source}:`, error);
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
