'use client';

import { useState, useCallback } from 'react';
import RiskProfiler from '@/components/discover/RiskProfiler';
import RiskSliderControl from '@/components/discover/RiskSliderControl';
import FundBasket from '@/components/discover/FundBasket';
import {
  type SEBIRiskLevel,
  type FundBasket as FundBasketType,
  recommendFundBasket,
} from '@/lib/advisor-engine';
import { Search, RotateCcw } from 'lucide-react';

type Stage = 'profiler' | 'results';

export default function DiscoverPage() {
  const [stage, setStage] = useState<Stage>('profiler');
  const [riskLevel, setRiskLevel] = useState<SEBIRiskLevel>('Very High');
  const [basket, setBasket] = useState<FundBasketType | null>(null);

  const generateBasket = useCallback((level: SEBIRiskLevel) => {
    setRiskLevel(level);
    const result = recommendFundBasket(level);
    setBasket(result);
    setStage('results');
  }, []);

  const handleProfilerComplete = useCallback(
    (level: SEBIRiskLevel) => {
      generateBasket(level);
    },
    [generateBasket]
  );

  const handleSkipToSlider = useCallback(() => {
    generateBasket('Very High');
  }, [generateBasket]);

  const handleSliderChange = useCallback(
    (level: SEBIRiskLevel) => {
      generateBasket(level);
    },
    [generateBasket]
  );

  const handleStartOver = useCallback(() => {
    setStage('profiler');
    setBasket(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Discover Your Funds
            </h1>
            <p className="text-sm text-gray-500">
              Find the HDFC fund basket matched to your risk profile
            </p>
          </div>
        </div>
      </div>

      {/* Profiler Stage */}
      {stage === 'profiler' && (
        <RiskProfiler
          onComplete={handleProfilerComplete}
          onSkip={handleSkipToSlider}
        />
      )}

      {/* Results Stage */}
      {stage === 'results' && basket && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Recommendations for{' '}
                <span className="text-indigo-600">{riskLevel}</span> risk
                profile
              </h2>
              <p className="text-sm text-gray-500">
                Adjust the slider to see different fund baskets
              </p>
            </div>
            <button
              onClick={handleStartOver}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </button>
          </div>

          {/* Risk Slider */}
          <RiskSliderControl value={riskLevel} onChange={handleSliderChange} />

          {/* Fund Basket */}
          <FundBasket basket={basket} />
        </div>
      )}
    </div>
  );
}
