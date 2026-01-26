'use client';

import { Fund } from '@/data/hdfc-funds';
import { TrendingUp, TrendingDown, Clock, Shield, IndianRupee } from 'lucide-react';

interface FundCardProps {
  fund: Fund;
  allocation?: number;
  role?: string;
  rationale?: string;
  compact?: boolean;
}

const riskColors: Record<string, string> = {
  Low: 'bg-green-100 text-green-800',
  'Low to Moderate': 'bg-lime-100 text-lime-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  'Moderately High': 'bg-orange-100 text-orange-800',
  High: 'bg-red-100 text-red-800',
  'Very High': 'bg-red-200 text-red-900',
};

const categoryColors: Record<string, string> = {
  equity: 'bg-blue-50 text-blue-700 border-blue-200',
  debt: 'bg-green-50 text-green-700 border-green-200',
  hybrid: 'bg-purple-50 text-purple-700 border-purple-200',
  solution: 'bg-amber-50 text-amber-700 border-amber-200',
  index: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  fof: 'bg-pink-50 text-pink-700 border-pink-200',
};

export default function FundCard({
  fund,
  allocation,
  role,
  rationale,
  compact = false,
}: FundCardProps) {
  const formatReturn = (ret: number | null) => {
    if (ret === null) return 'N/A';
    return (
      <span className={ret >= 0 ? 'text-green-600' : 'text-red-600'}>
        {ret >= 0 ? '+' : ''}
        {ret.toFixed(2)}%
      </span>
    );
  };

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900">{fund.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColors[fund.category]}`}
              >
                {fund.subCategory}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${riskColors[fund.riskLevel]}`}
              >
                {fund.riskLevel}
              </span>
            </div>
          </div>
          {allocation !== undefined && (
            <div className="text-right ml-3">
              <span className="text-2xl font-bold text-blue-600">
                {allocation}%
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-600">
          <span>1Y: {formatReturn(fund.return1y)}</span>
          <span>3Y: {formatReturn(fund.return3y)}</span>
          <span>5Y: {formatReturn(fund.return5y)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-base text-gray-900 leading-tight">
            {fund.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border ${categoryColors[fund.category]}`}
            >
              {fund.subCategory}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full ${riskColors[fund.riskLevel]}`}
            >
              {fund.riskLevel} Risk
            </span>
          </div>
        </div>
        {allocation !== undefined && (
          <div className="text-right ml-4 flex-shrink-0">
            <div className="text-3xl font-bold text-blue-600">
              {allocation}%
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">
              allocation
            </div>
          </div>
        )}
      </div>

      {/* Role & Rationale */}
      {role && (
        <div className="mb-3">
          <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            {role}
          </span>
        </div>
      )}
      {rationale && (
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {rationale}
        </p>
      )}

      {/* Returns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <ReturnBlock label="1 Year" value={fund.return1y} />
        <ReturnBlock label="3 Year" value={fund.return3y} />
        <ReturnBlock label="5 Year" value={fund.return5y} />
        <ReturnBlock label="Since Inception" value={fund.returnSinceInception} />
      </div>

      {/* Fund Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <IndianRupee className="w-3 h-3" />
          <span>AUM: {(fund.aumCrores / 1000).toFixed(1)}K Cr</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>TER: {fund.expenseRatio}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Min: {fund.minHorizonMonths}mo+</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <IndianRupee className="w-3 h-3" />
          <span>Min Invest: {fund.minInvestment}</span>
        </div>
      </div>

      {/* Data date */}
      <div className="mt-3 text-[10px] text-gray-400">
        Returns as of {fund.asOfDate}. Past performance is not indicative of
        future results.
      </div>
    </div>
  );
}

function ReturnBlock({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value === null) {
    return (
      <div className="bg-gray-50 rounded-lg p-2 text-center">
        <div className="text-[10px] text-gray-400 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-sm font-medium text-gray-400 mt-0.5">N/A</div>
      </div>
    );
  }

  const isPositive = value >= 0;
  return (
    <div
      className={`rounded-lg p-2 text-center ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}
    >
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="flex items-center justify-center gap-0.5 mt-0.5">
        {isPositive ? (
          <TrendingUp className="w-3 h-3 text-green-600" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-600" />
        )}
        <span
          className={`text-sm font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}
        >
          {isPositive ? '+' : ''}
          {value.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
