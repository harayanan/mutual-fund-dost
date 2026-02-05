'use client';

import { AlertTriangle, Clock, Users, MessageSquare } from 'lucide-react';
import type { DistributorNewsInsight } from '@/lib/gemini';

interface TopStoryCardProps {
  story: DistributorNewsInsight;
}

const urgencyConfig: Record<string, { color: string; label: string; bgColor: string }> = {
  high: {
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
    label: 'Contact Today',
  },
  medium: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 border-amber-200',
    label: 'This Week',
  },
  low: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 border-gray-200',
    label: 'Good to Know',
  },
};

const categoryLabels: Record<string, string> = {
  macro: 'Macroeconomic',
  geopolitical: 'Geopolitical',
  company: 'Company News',
  sector: 'Sector Update',
  regulatory: 'Regulatory',
  market: 'Market',
};

export default function TopStoryCard({ story }: TopStoryCardProps) {
  const urgency = urgencyConfig[story.urgency] || urgencyConfig.medium;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {categoryLabels[story.category] || story.category}
        </span>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${urgency.bgColor} ${urgency.color}`}>
          {story.urgency === 'high' && <AlertTriangle className="w-3 h-3" />}
          {story.urgency === 'medium' && <Clock className="w-3 h-3" />}
          {urgency.label}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-base text-gray-900 leading-snug mb-2">
        {story.title}
      </h3>

      {/* Source */}
      <p className="text-xs text-gray-500 mb-3">
        Source: {story.source}
      </p>

      {/* Client Implication */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
            What This Means for Clients
          </span>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">
          {story.clientImplication}
        </p>
      </div>

      {/* Talking Points */}
      {story.talkingPoints && story.talkingPoints.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              Talking Points
            </span>
          </div>
          <ul className="space-y-1.5">
            {story.talkingPoints.map((point, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex gap-2">
                <span className="text-emerald-500 font-bold">&bull;</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected Client Segments */}
      {story.affectedClientSegments && story.affectedClientSegments.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
            Relevant Client Segments
          </p>
          <div className="flex flex-wrap gap-1.5">
            {story.affectedClientSegments.map((segment) => (
              <span
                key={segment}
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100"
              >
                {segment}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
