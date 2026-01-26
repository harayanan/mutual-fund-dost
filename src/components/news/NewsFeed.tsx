'use client';

import { useState, useEffect } from 'react';
import NewsCard, { type NewsInsightData } from '@/components/ui/NewsCard';
import { RefreshCw, AlertCircle, Newspaper } from 'lucide-react';

export default function NewsFeed() {
  const [news, setNews] = useState<NewsInsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.error && (!data.news || data.news.length === 0)) {
        setError(data.error);
      } else {
        setNews(data.news || []);
        setLastUpdated(data.lastUpdated);
      }
    } catch {
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const categories = ['all', ...new Set(news.map((n) => n.category))];
  const filteredNews =
    filter === 'all' ? news : news.filter((n) => n.category === filter);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-20 bg-gray-100 rounded mb-3" />
            <div className="flex gap-2">
              <div className="h-5 bg-gray-200 rounded-full w-24" />
              <div className="h-5 bg-gray-200 rounded-full w-32" />
            </div>
          </div>
        ))}
        <p className="text-center text-sm text-gray-500">
          Fetching latest news and generating AI insights... This may take a
          moment.
        </p>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Unable to Load News
        </h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchNews}
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all'
                ? 'All'
                : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Last refreshed:{' '}
              {new Date(lastUpdated).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            onClick={fetchNews}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* News Grid */}
      {filteredNews.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            No news found for this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredNews.map((item, i) => (
            <NewsCard key={`${item.title}-${i}`} news={item} />
          ))}
        </div>
      )}
    </div>
  );
}
