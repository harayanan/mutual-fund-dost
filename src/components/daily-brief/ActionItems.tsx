'use client';

import { CheckSquare, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { ActionItem } from '@/lib/gemini';

interface ActionItemsProps {
  items: ActionItem[];
}

const priorityConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  high: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  medium: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  low: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
};

export default function ActionItems({ items }: ActionItemsProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  if (!items || items.length === 0) return null;

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  // Sort by priority: high first, then medium, then low
  const sortedItems = [...items].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
  });

  const completedCount = checkedItems.size;
  const totalCount = items.length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Today&apos;s Action Items</h2>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {completedCount} / {totalCount} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {sortedItems.map((item, idx) => {
          const priority = priorityConfig[item.priority] || priorityConfig.medium;
          const isChecked = checkedItems.has(idx);

          return (
            <div
              key={idx}
              className={`border rounded-xl p-4 transition-all cursor-pointer ${
                isChecked
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : `${priority.bgColor} ${priority.borderColor}`
              }`}
              onClick={() => toggleItem(idx)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    isChecked
                      ? 'bg-green-500 border-green-500'
                      : `border-gray-300 ${priority.bgColor}`
                  }`}
                >
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={priority.color}>{priority.icon}</span>
                    <span className={`text-xs font-medium uppercase ${priority.color}`}>
                      {item.priority} Priority
                    </span>
                    {item.deadline && (
                      <span className="text-xs text-gray-400">
                        &bull; {item.deadline}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm font-medium ${isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {item.task}
                  </p>

                  {item.clientSegment && (
                    <span className="inline-block mt-2 text-xs bg-white/80 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                      {item.clientSegment}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
