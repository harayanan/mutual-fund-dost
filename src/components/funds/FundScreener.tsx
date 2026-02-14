'use client';

import { useState, useMemo, useEffect } from 'react';
import { HDFC_FUNDS } from '@/data/hdfc-funds';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  X,
  GitCompareArrows,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Shield,
  Clock,
} from 'lucide-react';
import FundComparison from './FundComparison';

type SortField =
  | 'name'
  | 'category'
  | 'subCategory'
  | 'riskLevel'
  | 'aumCrores'
  | 'expenseRatio'
  | 'return1y'
  | 'return3y'
  | 'return5y'
  | 'return10y'
  | 'returnSinceInception';

type SortDir = 'asc' | 'desc';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'equity', label: 'Equity' },
  { value: 'debt', label: 'Debt' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'index', label: 'Index' },
  { value: 'solution', label: 'Solution-Oriented' },
  { value: 'fof', label: 'Fund of Funds' },
];

const RISK_LEVELS = [
  { value: '', label: 'All Risk Levels' },
  { value: 'Low', label: 'Low' },
  { value: 'Low to Moderate', label: 'Low to Moderate' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Moderately High', label: 'Moderately High' },
  { value: 'High', label: 'High' },
  { value: 'Very High', label: 'Very High' },
];

const riskColors: Record<string, string> = {
  Low: 'bg-green-100 text-green-800',
  'Low to Moderate': 'bg-lime-100 text-lime-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  'Moderately High': 'bg-orange-100 text-orange-800',
  High: 'bg-red-100 text-red-800',
  'Very High': 'bg-red-200 text-red-900',
};

const categoryColors: Record<string, string> = {
  equity: 'bg-blue-100 text-blue-700',
  debt: 'bg-green-100 text-green-700',
  hybrid: 'bg-purple-100 text-purple-700',
  solution: 'bg-amber-100 text-amber-700',
  index: 'bg-cyan-100 text-cyan-700',
  fof: 'bg-pink-100 text-pink-700',
};

const RISK_SORT_ORDER: Record<string, number> = {
  Low: 1,
  'Low to Moderate': 2,
  Moderate: 3,
  'Moderately High': 4,
  High: 5,
  'Very High': 6,
};

function formatReturn(val: number | null): React.ReactNode {
  if (val === null) return <span className="text-gray-300">--</span>;
  const positive = val >= 0;
  return (
    <span className={positive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
      {positive ? '+' : ''}
      {val.toFixed(2)}%
    </span>
  );
}

export default function FundScreener() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [riskLevel, setRiskLevel] = useState('');
  const [sortField, setSortField] = useState<SortField>('aumCrores');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedFund, setExpandedFund] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/metadata')
      .then((r) => r.json())
      .then((data) => {
        if (data.metadata?.fund_data?.lastUpdated) {
          setLastUpdated(data.metadata.fund_data.lastUpdated);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let funds = [...HDFC_FUNDS];

    if (search) {
      const q = search.toLowerCase();
      funds = funds.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.subCategory.toLowerCase().includes(q) ||
          f.fundManager.toLowerCase().includes(q)
      );
    }

    if (selectedCategories.size > 0) {
      funds = funds.filter((f) => selectedCategories.has(f.category));
    }

    if (riskLevel) {
      funds = funds.filter((f) => f.riskLevel === riskLevel);
    }

    funds.sort((a, b) => {
      let aVal: number | string | null;
      let bVal: number | string | null;

      if (sortField === 'riskLevel') {
        aVal = RISK_SORT_ORDER[a.riskLevel] || 0;
        bVal = RISK_SORT_ORDER[b.riskLevel] || 0;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return funds;
  }, [search, selectedCategories, riskLevel, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const toggleCompare = (fundId: string) => {
    setCompareList((prev) =>
      prev.includes(fundId)
        ? prev.filter((id) => id !== fundId)
        : prev.length < 4
          ? [...prev, fundId]
          : prev
    );
  };

  const compareFunds = HDFC_FUNDS.filter((f) => compareList.includes(f.id));

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600" />
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const activeFilters = (selectedCategories.size > 0 ? 1 : 0) + (riskLevel ? 1 : 0);

  return (
    <div>
      {/* Controls Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-4">
        {/* Search + Filter Toggle + Compare */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by fund name, category, or manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || activeFilters > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>

          {compareList.length > 0 && (
            <button
              onClick={() => setShowCompare(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <GitCompareArrows className="w-4 h-4" />
              Compare ({compareList.length})
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Category</div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <button
                    key={c.value}
                    onClick={() => toggleCategory(c.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      selectedCategories.has(c.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Risk Level</div>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setSelectedCategories(new Set());
                  setRiskLevel('');
                }}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-gray-900">{filtered.length}</strong>{' '}
              of {HDFC_FUNDS.length} funds
            </span>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Direct Plans
            </span>
            {lastUpdated && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Clock className="w-3 h-3" />
                Updated {new Date(lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          <span>
            Sorted by{' '}
            <strong className="text-gray-700">
              {sortField === 'aumCrores'
                ? 'AUM'
                : sortField === 'return1y'
                  ? '1Y Return'
                  : sortField === 'return3y'
                    ? '3Y Return'
                    : sortField === 'return5y'
                      ? '5Y Return'
                      : sortField === 'expenseRatio'
                        ? 'Expense Ratio'
                        : sortField}
            </strong>{' '}
            ({sortDir === 'desc' ? 'high to low' : 'low to high'})
          </span>
        </div>
      </div>

      {/* Quick Sort Chips (Mobile-friendly) */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(
          [
            ['aumCrores', 'AUM'],
            ['return1y', '1Y Return'],
            ['return3y', '3Y Return'],
            ['return5y', '5Y Return'],
            ['return10y', '10Y Return'],
            ['expenseRatio', 'Expense Ratio'],
            ['riskLevel', 'Risk Level'],
          ] as [SortField, string][]
        ).map(([field, label]) => (
          <button
            key={field}
            onClick={() => toggleSort(field)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              sortField === field
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
            <SortIcon field={field} />
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-3 py-3">
                  <GitCompareArrows className="w-4 h-4 text-gray-400 mx-auto" />
                </th>
                <ThSort field="name" label="Fund Name" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <ThSort field="category" label="Sub-category" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <ThSort field="riskLevel" label="Risk" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <ThSort field="aumCrores" label="AUM (Cr)" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
                <ThSort field="expenseRatio" label="TER %" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
                <ThSort field="return1y" label="1Y" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
                <ThSort field="return3y" label="3Y" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
                <ThSort field="return5y" label="5Y" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
                <ThSort field="return10y" label="10Y" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
                <ThSort field="returnSinceInception" label="Since Inc." sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((fund) => (
                <tr
                  key={fund.id}
                  className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={compareList.includes(fund.id)}
                      onChange={() => toggleCompare(fund.id)}
                      disabled={!compareList.includes(fund.id) && compareList.length >= 4}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-900 leading-tight">
                      {fund.name}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {fund.fundManager} &middot; Min {fund.minHorizonMonths}mo
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[fund.category]}`}>
                      {fund.subCategory}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${riskColors[fund.riskLevel]}`}>
                      {fund.riskLevel}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-gray-700">
                    {(fund.aumCrores / 1000).toFixed(1)}K
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {fund.expenseRatio.toFixed(2)}%
                  </td>
                  <td className="px-3 py-3 text-right">{formatReturn(fund.return1y)}</td>
                  <td className="px-3 py-3 text-right">{formatReturn(fund.return3y)}</td>
                  <td className="px-3 py-3 text-right">{formatReturn(fund.return5y)}</td>
                  <td className="px-3 py-3 text-right">{formatReturn(fund.return10y)}</td>
                  <td className="px-3 py-3 text-right">{formatReturn(fund.returnSinceInception)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((fund) => {
          const isExpanded = expandedFund === fund.id;
          return (
            <div
              key={fund.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="checkbox"
                        checked={compareList.includes(fund.id)}
                        onChange={() => toggleCompare(fund.id)}
                        disabled={!compareList.includes(fund.id) && compareList.length >= 4}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30 flex-shrink-0"
                      />
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {fund.name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[fund.category]}`}>
                        {fund.subCategory}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${riskColors[fund.riskLevel]}`}>
                        {fund.riskLevel}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedFund(isExpanded ? null : fund.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Key Returns Row */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <ReturnCell label="1Y" value={fund.return1y} />
                  <ReturnCell label="3Y" value={fund.return3y} />
                  <ReturnCell label="5Y" value={fund.return5y} />
                  <ReturnCell label="Since Inc." value={fund.returnSinceInception} />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailRow icon={IndianRupee} label="AUM" value={`${(fund.aumCrores / 1000).toFixed(1)}K Cr`} />
                    <DetailRow icon={Shield} label="Expense Ratio" value={`${fund.expenseRatio}%`} />
                    <DetailRow icon={Clock} label="Min Horizon" value={`${fund.minHorizonMonths} months`} />
                    <DetailRow icon={IndianRupee} label="Min Investment" value={`Rs.${fund.minInvestment}`} />
                  </div>

                  {fund.return10y !== null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                        10 Year Return
                      </div>
                      <div className="text-lg font-bold">
                        {formatReturn(fund.return10y)}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                      Fund Manager
                    </div>
                    <div className="text-sm text-gray-800">{fund.fundManager}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                      Benchmark
                    </div>
                    <div className="text-xs text-gray-600">{fund.benchmark}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                      Objective
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {fund.investmentObjective}
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400">
                    Data as of {fund.asOfDate}. Past performance is not indicative of future results.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No funds match your filters
          </h3>
          <p className="text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Compare Floating Bar */}
      {compareList.length > 0 && !showCompare && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm">
            <strong>{compareList.length}</strong> fund{compareList.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setShowCompare(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Compare Now
          </button>
          <button
            onClick={() => setCompareList([])}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompare && (
        <FundComparison
          funds={compareFunds}
          onClose={() => setShowCompare(false)}
          onRemove={(id) => toggleCompare(id)}
        />
      )}

      {/* Bottom Disclaimer */}
      <div className="mt-6 text-[10px] text-gray-400 text-center">
        All data shown is for <strong>Direct Growth</strong> plans. Return data is CAGR as of {HDFC_FUNDS[0]?.asOfDate}.
        Past performance is not indicative of future results. Mutual fund investments are subject to market risks.
      </div>
    </div>
  );
}

// ---- Sub-components ----

function ThSort({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  align = 'left',
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  align?: 'left' | 'right';
}) {
  const active = sortField === field;
  return (
    <th
      className={`px-3 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(field)}
    >
      <div
        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${active ? 'text-blue-600' : 'text-gray-500'}`}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-300" />
        )}
      </div>
    </th>
  );
}

function ReturnCell({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="bg-gray-50 rounded-lg p-2 text-center">
        <div className="text-[9px] text-gray-400 uppercase">{label}</div>
        <div className="text-xs text-gray-300 mt-0.5">--</div>
      </div>
    );
  }
  const positive = value >= 0;
  return (
    <div className={`rounded-lg p-2 text-center ${positive ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className="text-[9px] text-gray-400 uppercase">{label}</div>
      <div className="flex items-center justify-center gap-0.5 mt-0.5">
        {positive ? (
          <TrendingUp className="w-2.5 h-2.5 text-green-600" />
        ) : (
          <TrendingDown className="w-2.5 h-2.5 text-red-600" />
        )}
        <span className={`text-xs font-bold ${positive ? 'text-green-700' : 'text-red-700'}`}>
          {positive ? '+' : ''}
          {value.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <div>
        <div className="text-[10px] text-gray-400">{label}</div>
        <div className="text-xs font-medium text-gray-800">{value}</div>
      </div>
    </div>
  );
}
