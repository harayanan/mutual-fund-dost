'use client';

import { useMemo, useState } from 'react';
import { HDFC_FUNDS, Fund } from '@/data/hdfc-funds';

const PERIODS: { key: keyof Fund; label: string }[] = [
  { key: 'return1y', label: '1Y' },
  { key: 'return3y', label: '3Y' },
  { key: 'return5y', label: '5Y' },
  { key: 'returnSinceInception', label: 'Since Inc.' },
];

const CATEGORY_LABELS: Record<string, string> = {
  equity: 'Equity',
  debt: 'Debt',
  hybrid: 'Hybrid',
  index: 'Index',
  solution: 'Solution-Oriented',
  fof: 'Fund of Funds',
};

const CATEGORY_ORDER = ['equity', 'hybrid', 'index', 'debt', 'solution', 'fof'];

const CATEGORY_COLORS: Record<string, string> = {
  equity: 'bg-blue-100 text-blue-700 border-blue-200',
  debt: 'bg-green-100 text-green-700 border-green-200',
  hybrid: 'bg-purple-100 text-purple-700 border-purple-200',
  index: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  solution: 'bg-amber-100 text-amber-700 border-amber-200',
  fof: 'bg-pink-100 text-pink-700 border-pink-200',
};

function computeQuartiles(values: (number | null)[]): number[] {
  const nums = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (nums.length === 0) return [0, 0, 0];
  const q1 = nums[Math.floor(nums.length * 0.25)];
  const q2 = nums[Math.floor(nums.length * 0.5)];
  const q3 = nums[Math.floor(nums.length * 0.75)];
  return [q1, q2, q3];
}

function getCellColor(value: number | null, quartiles: number[]): string {
  if (value === null) return 'bg-gray-50 text-gray-300';
  const [q1, q2, q3] = quartiles;
  if (value >= q3) return 'bg-emerald-100 text-emerald-800 font-semibold';
  if (value >= q2) return 'bg-green-50 text-green-700';
  if (value >= q1) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
}

function formatReturn(val: number | null): string {
  if (val === null) return '--';
  return (val >= 0 ? '+' : '') + val.toFixed(1) + '%';
}

export default function PerformanceHeatmap() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const quartilesByPeriod = useMemo(() => {
    return Object.fromEntries(
      PERIODS.map(({ key }) => [
        key,
        computeQuartiles(HDFC_FUNDS.map((f) => f[key] as number | null)),
      ])
    );
  }, []);

  const grouped = useMemo(() => {
    const funds = selectedCategory
      ? HDFC_FUNDS.filter((f) => f.category === selectedCategory)
      : HDFC_FUNDS;

    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      funds: funds.filter((f) => f.category === cat).sort((a, b) => (b.aumCrores ?? 0) - (a.aumCrores ?? 0)),
    })).filter((g) => g.funds.length > 0);
  }, [selectedCategory]);

  return (
    <div>
      {/* Legend + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              selectedCategory === ''
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                selectedCategory === cat
                  ? 'bg-gray-800 text-white border-gray-800'
                  : `bg-white border-gray-200 hover:bg-gray-50 ${CATEGORY_COLORS[cat]}`
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
          <span className="font-medium text-gray-600">Returns vs peers:</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
            Top 25%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-green-50 border border-green-200" />
            Above median
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-orange-50 border border-orange-200" />
            Below median
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-200" />
            Bottom 25%
          </span>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[280px]">
                  Fund
                </th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  Client Profile
                </th>
                {PERIODS.map(({ key, label }) => (
                  <th
                    key={key as string}
                    className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {label}
                    <div className="text-[10px] font-normal text-gray-400">CAGR</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ category, funds }) => (
                <>
                  {/* Category header row */}
                  <tr key={`header-${category}`} className="bg-gray-50/70 border-b border-t border-gray-100">
                    <td
                      colSpan={2 + PERIODS.length}
                      className="px-4 py-2"
                    >
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[category]}`}>
                        {CATEGORY_LABELS[category]} — {funds.length} fund{funds.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                  {/* Fund rows */}
                  {funds.map((fund) => (
                    <tr
                      key={fund.id}
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm leading-tight">
                          {fund.name}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {fund.fundManager} &middot; AUM ₹{(fund.aumCrores / 1000).toFixed(0)}K Cr
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[11px] text-gray-600 max-w-[140px] leading-snug">
                          {fund.suitableFor}
                        </div>
                      </td>
                      {PERIODS.map(({ key }) => {
                        const val = fund[key] as number | null;
                        const cellClass = getCellColor(val, quartilesByPeriod[key as string]);
                        return (
                          <td
                            key={key as string}
                            className={`px-4 py-3 text-right text-sm ${cellClass}`}
                          >
                            <span className="tabular-nums">{formatReturn(val)}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-[11px] text-gray-400">
            Returns as of {HDFC_FUNDS[0]?.asOfDate ?? 'Dec 2025'}. Color coding compares each fund against all 60 HDFC schemes across time periods. Top 25% = dark green. Data refreshed daily at 7:30 PM IST via AMFI.
          </p>
        </div>
      </div>
    </div>
  );
}
