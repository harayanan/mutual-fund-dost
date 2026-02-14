'use client';

import { useMemo } from 'react';
import { type FundRecommendation } from '@/lib/advisor-engine';

interface FundAllocationProps {
  recommendations: FundRecommendation[];
}

const COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
];

export default function FundAllocation({ recommendations }: FundAllocationProps) {
  const segments = useMemo(() =>
    recommendations.map((rec, i) => {
      const startPercent = recommendations.slice(0, i).reduce((sum, r) => sum + r.allocation, 0);
      return {
        ...rec,
        color: COLORS[i % COLORS.length],
        startPercent,
        endPercent: startPercent + rec.allocation,
      };
    }),
    [recommendations]
  );

  // Build SVG donut chart
  const size = 200;
  const strokeWidth = 40;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">
        Portfolio Allocation
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {segments.map((seg, i) => {
              const dashLength = (seg.allocation / 100) * circumference;
              const dashOffset =
                -(seg.startPercent / 100) * circumference;
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {recommendations.length}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                Funds
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 w-full">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">
                  {seg.fund.name}
                </div>
                <div className="text-[10px] text-gray-400">{seg.role}</div>
              </div>
              <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                {seg.allocation}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
