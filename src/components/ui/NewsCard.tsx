'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';

export interface NewsInsightData {
  title: string;
  source: string;
  url: string;
  published_at: string;
  summary: string;
  ai_analysis: string | null;
  category: string;
  impact: string;
  significance: string;
  impacted_funds: string[];
  investor_action: string | null;
}

interface NewsCardProps {
  news: NewsInsightData;
}

const impactConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  positive: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'bg-green-100 text-green-700 border-green-200',
    label: 'Positive',
  },
  negative: {
    icon: <TrendingDown className="w-4 h-4" />,
    color: 'bg-red-100 text-red-700 border-red-200',
    label: 'Negative',
  },
  neutral: {
    icon: <Minus className="w-4 h-4" />,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    label: 'Neutral',
  },
};

const significanceColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
};

const categoryLabels: Record<string, string> = {
  macro: 'Macroeconomic',
  geopolitical: 'Geopolitical',
  company: 'Company News',
  sector: 'Sector Update',
  regulatory: 'Regulatory',
  market: 'Market',
  general: 'General',
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NewsCard({ news }: NewsCardProps) {
  const impact = impactConfig[news.impact] || impactConfig.neutral;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {categoryLabels[news.category] || news.category}
          </span>
          <div
            className={`w-2 h-2 rounded-full ${significanceColors[news.significance] || significanceColors.medium}`}
            title={`${news.significance} significance`}
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(news.published_at)}</span>
        </div>
      </div>

      {/* Headline */}
      <h3 className="font-bold text-base text-gray-900 leading-snug mb-2">
        {news.title}
      </h3>

      {/* Source */}
      <p className="text-xs text-gray-500 mb-3">
        Source: {news.source}
        {news.url && (
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 ml-2 text-blue-500 hover:text-blue-700"
          >
            Read original <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </p>

      {/* Impact Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium mb-3 ${impact.color}`}
      >
        {impact.icon}
        <span>Impact: {impact.label}</span>
      </div>

      {/* AI Analysis - Primary insight section */}
      {news.ai_analysis && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
              Why This Matters
            </span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            {news.ai_analysis}
          </p>
        </div>
      )}

      {/* Investor Action - Distinct callout */}
      {news.investor_action && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex gap-3">
          <span className="text-amber-600 font-bold text-sm mt-0.5 shrink-0">Action:</span>
          <p className="text-sm text-gray-700 leading-relaxed">
            {news.investor_action}
          </p>
        </div>
      )}

      {/* Affected Funds */}
      {news.impacted_funds && news.impacted_funds.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
            Affected HDFC Funds
          </p>
          <div className="flex flex-wrap gap-1.5">
            {news.impacted_funds.map((fund) => (
              <span
                key={fund}
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100"
              >
                {fund}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
