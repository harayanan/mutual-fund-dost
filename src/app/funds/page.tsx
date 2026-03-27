'use client';

import FundScreener from '@/components/funds/FundScreener';
import { BarChart3 } from 'lucide-react';

export default function FundsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Fund Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              All 60 HDFC mutual fund schemes — screen and compare
            </p>
          </div>
        </div>
      </div>

      <FundScreener />
    </div>
  );
}
