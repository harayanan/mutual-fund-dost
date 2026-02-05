'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Calendar, Lightbulb, AlertTriangle } from 'lucide-react';
import type { DailyBrief } from '@/lib/gemini';
import TopStoryCard from './TopStoryCard';
import ConversationStarters from './ConversationStarters';
import ActionItems from './ActionItems';

export default function DailyBriefContent() {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-brief');
      const data = await res.json();
      if (data.error && !data.brief) {
        setError(data.error);
      } else {
        setBrief(data.brief);
        setLastUpdated(data.lastUpdated);
        setIsStale(data.isStale || false);
      }
    } catch {
      setError('Failed to load daily brief. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/daily-brief/refresh', { method: 'POST' });
    } catch {
      // Still try to re-fetch cached data even if refresh fails
    }
    await fetchBrief();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for top stories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-24 bg-gray-100 rounded mb-3" />
              <div className="flex gap-2">
                <div className="h-5 bg-gray-200 rounded-full w-20" />
                <div className="h-5 bg-gray-200 rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500">
          Loading your daily brief...
        </p>
      </div>
    );
  }

  if (error && !brief) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Unable to Load Daily Brief
        </h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Generating...' : 'Generate Daily Brief'}
        </button>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-4">
          No daily brief available yet.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Generating...' : 'Generate Today\'s Brief'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stale warning */}
      {isStale && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            This brief is from a previous day ({new Date(brief.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}).
            Click refresh to generate today&apos;s brief.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Brief for {new Date(brief.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Generated:{' '}
              {new Date(lastUpdated).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Daily Wisdom */}
      {brief.dailyWisdom && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">
                Daily Wisdom
              </p>
              <p className="text-sm text-gray-800 italic leading-relaxed">
                &ldquo;{brief.dailyWisdom}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Stories */}
      {brief.topStories && brief.topStories.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">{brief.topStories.length}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Top Stories for Today</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {brief.topStories.map((story, idx) => (
              <TopStoryCard key={idx} story={story} />
            ))}
          </div>
        </div>
      )}

      {/* Conversation Starters */}
      <ConversationStarters starters={brief.conversationStarters} />

      {/* Action Items */}
      <ActionItems items={brief.actionItems} />
    </div>
  );
}
