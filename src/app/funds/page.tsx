'use client';

import FundScreener from '@/components/funds/FundScreener';
import { BarChart3, Info } from 'lucide-react';

export default function FundsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Fund Screener
            </h1>
            <p className="text-sm text-gray-500">
              All 60 HDFC mutual fund schemes with detailed performance data
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-800 font-medium mb-1">
                How to Use the Screener
              </p>
              <p className="text-xs text-emerald-600 leading-relaxed">
                Search, filter, and sort all HDFC funds by returns, AUM, expense
                ratio, risk level, and more. Select up to 4 funds to compare
                them side-by-side with automatic best-in-class highlighting. Click
                any column header to sort, or use the quick-sort chips. Data is
                auto-refreshed daily from AMFI.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fund Screener */}
      <FundScreener />
    </div>
  );
}
