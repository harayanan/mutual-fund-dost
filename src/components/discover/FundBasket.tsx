'use client';

import { type FundBasket as FundBasketType } from '@/lib/advisor-engine';
import FundCard from '@/components/ui/FundCard';
import FundAllocation from './FundAllocation';
import { Sparkles, Quote } from 'lucide-react';

interface FundBasketProps {
  basket: FundBasketType;
}

export default function FundBasket({ basket }: FundBasketProps) {
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-xl font-bold">
            Your Personalized Fund Basket
          </h2>
        </div>
        <p className="text-blue-100 text-sm leading-relaxed mb-4">
          {basket.assetAllocation.description}
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-xs text-blue-200">Risk Level</div>
            <div className="font-bold">{basket.riskLevel}</div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-xs text-blue-200">Equity</div>
            <div className="font-bold">{basket.assetAllocation.equity}%</div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-xs text-blue-200">Debt</div>
            <div className="font-bold">{basket.assetAllocation.debt}%</div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-xs text-blue-200">Hybrid</div>
            <div className="font-bold">{basket.assetAllocation.hybrid}%</div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-xs text-blue-200">Total Funds</div>
            <div className="font-bold">{basket.totalFunds}</div>
          </div>
        </div>
      </div>

      {/* Investor Profile */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-indigo-800 mb-2">
          Your Investor Profile
        </h3>
        <p className="text-sm text-indigo-700 leading-relaxed">
          {basket.assetAllocation.investorProfile}
        </p>
      </div>

      {/* Allocation Chart */}
      <FundAllocation recommendations={basket.recommendations} />

      {/* Fund Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">
          Recommended Funds ({basket.totalFunds})
        </h3>
        {basket.recommendations.map((rec) => (
          <FundCard
            key={rec.fund.id}
            fund={rec.fund}
            allocation={rec.allocation}
            role={rec.role}
            rationale={rec.rationale}
          />
        ))}
      </div>

      {/* Wisdom Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Quote className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800 mb-2">
              Dost&apos;s Wisdom
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed italic">
              {basket.wisdomNote}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <strong>Disclaimer:</strong> The above recommendations are for
          educational purposes only and do not constitute investment advice.
          Mutual fund investments are subject to market risks. Read all
          scheme-related documents carefully before investing. Past performance
          is not indicative of future returns. Please consult a SEBI-registered
          investment advisor before making investment decisions. The allocations
          shown are suggestive and should be adjusted based on your individual
          financial situation, goals, and tax planning needs.
        </p>
      </div>
    </div>
  );
}
