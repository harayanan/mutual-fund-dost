'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RiskProfiler from '@/components/discover/RiskProfiler';
import RiskSliderControl from '@/components/discover/RiskSliderControl';
import FundBasket from '@/components/discover/FundBasket';
import {
  SEBI_RISK_LEVELS,
  type SEBIRiskLevel,
  recommendFundBasket,
} from '@/lib/advisor-engine';
import { buildRecommendation, type RecommendationResult } from '@/lib/recommendation';
import { Search, RotateCcw, Share2, FileDown, Check } from 'lucide-react';

const STORAGE_KEY = 'mfd_risk_profile';

type Stage = 'loading' | 'profiler' | 'results';

function loadSavedProfile(): { riskLevel: SEBIRiskLevel; answers?: Record<string, number> } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.riskLevel) return { riskLevel: data.riskLevel, answers: data.answers };
  } catch {}
  return null;
}

function saveProfile(riskLevel: SEBIRiskLevel, answers?: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ riskLevel, answers }));
  } catch {}
}

function clearProfile() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function isValidRiskLevel(value: string): value is SEBIRiskLevel {
  return (SEBI_RISK_LEVELS as readonly string[]).includes(value);
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
              Find the XYZ fund basket matched to your risk profile
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
          <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto mb-8" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>('loading');
  const [riskLevel, setRiskLevel] = useState<SEBIRiskLevel>('Very High');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [basket, setBasket] = useState<RecommendationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generateBasket = useCallback((level: SEBIRiskLevel, ans?: Record<string, number>) => {
    setRiskLevel(level);
    if (ans) setAnswers(ans);
    const result = ans && Object.keys(ans).length > 0
      ? buildRecommendation(ans, level)
      : buildRecommendation({}, level);
    setBasket(result);
    setStage('results');
    saveProfile(level, ans);
  }, []);

  // On mount, check URL params first, then localStorage
  useEffect(() => {
    const riskParam = searchParams.get('risk');
    if (riskParam && isValidRiskLevel(riskParam)) {
      generateBasket(riskParam);
      return;
    }

    const saved = loadSavedProfile();
    if (saved) {
      generateBasket(saved.riskLevel, saved.answers);
    } else {
      setStage('profiler');
    }
  }, [generateBasket, searchParams]);

  const handleProfilerComplete = useCallback(
    (level: SEBIRiskLevel, ans: Record<string, number>) => {
      generateBasket(level, ans);
    },
    [generateBasket]
  );

  const handleSkipToSlider = useCallback(() => {
    generateBasket('Very High');
  }, [generateBasket]);

  const handleSliderChange = useCallback(
    (level: SEBIRiskLevel) => {
      generateBasket(level, answers);
    },
    [generateBasket, answers]
  );

  const handleStartOver = useCallback(() => {
    clearProfile();
    setStage('profiler');
    setBasket(null);
  }, []);

  const handleShare = useCallback(async () => {
    const params = new URLSearchParams({ risk: riskLevel });
    if (basket?.personalization.goalLabel) params.set('goal', basket.personalization.goalLabel);
    if (basket?.personalization.horizonLabel) params.set('horizon', basket.personalization.horizonLabel);
    const url = `${window.location.origin}/discover?${params.toString()}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Mutual Fund Dost — ${riskLevel} Risk Profile`,
          text: `Check out my personalized XYZ fund basket for a ${riskLevel} risk profile!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard not available
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  }, [riskLevel, basket]);

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8 print:mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Discover Your Funds
            </h1>
            <p className="text-sm text-gray-500">
              Find the XYZ fund basket matched to your risk profile
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {stage === 'loading' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
            <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto mb-8" />
            <div className="space-y-3">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>
      )}

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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={handleStartOver}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh Profile
              </button>
            </div>
          </div>

          {/* Risk Slider */}
          <div className="print:hidden">
            <RiskSliderControl value={riskLevel} onChange={handleSliderChange} />
          </div>

          {/* Fund Basket */}
          <FundBasket key={basket.riskLevel} basket={basket} />
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DiscoverContent />
    </Suspense>
  );
}
