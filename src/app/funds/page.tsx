'use client';

import { useState } from 'react';
import FundScreener from '@/components/funds/FundScreener';
import PerformanceHeatmap from '@/components/funds/PerformanceHeatmap';
import { BarChart3, Flame, Search } from 'lucide-react';

type Tab = 'screener' | 'heatmap';

export default function FundsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('screener');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Fund Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              All 60 HDFC mutual fund schemes — screener and performance heatmap
            </p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('screener')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'screener'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-4 h-4" />
          Fund Screener
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'heatmap'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Flame className="w-4 h-4" />
          Performance Heatmap
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'screener' ? <FundScreener /> : <PerformanceHeatmap />}
    </div>
  );
}
