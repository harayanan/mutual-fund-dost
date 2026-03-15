'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Calendar, AlertTriangle } from 'lucide-react';
import type {
  MondayBrief,
  MarketMetric,
  WeeklyStory,
  ClientActionItem,
  ConversationScript,
  FundSpotlight,
  FundHeatmapRow,
  WeekAheadEvent,
} from '@/lib/gemini';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dirColor(direction: MarketMetric['direction']) {
  if (direction === 'up') return 'text-green-600';
  if (direction === 'down') return 'text-red-600';
  return 'text-gray-600';
}

function dirBg(direction: MarketMetric['direction']) {
  if (direction === 'up') return 'bg-green-50';
  if (direction === 'down') return 'bg-red-50';
  return 'bg-gray-50';
}

function urgencyBadge(urgency: 'high' | 'medium' | 'low') {
  if (urgency === 'high')
    return (
      <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 px-2 py-0.5 rounded">
        Call Today
      </span>
    );
  if (urgency === 'medium')
    return (
      <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
        This Week
      </span>
    );
  return (
    <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
      FYI
    </span>
  );
}

function priorityBadge(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high')
    return (
      <span className="inline-block text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">
        High
      </span>
    );
  if (priority === 'medium')
    return (
      <span className="inline-block text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
        Medium
      </span>
    );
  return (
    <span className="inline-block text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
      Low
    </span>
  );
}

function heatmapColor(val: string) {
  if (!val) return {};
  const num = parseFloat(val);
  if (isNaN(num)) return {};
  if (num > 0)
    return {
      color: '#15803d',
      backgroundColor: 'rgba(22,163,74,0.08)',
    };
  if (num < 0)
    return {
      color: '#dc2626',
      backgroundColor: 'rgba(220,38,38,0.08)',
    };
  return {};
}

function formatWeekRange(weekOf: string): string {
  const monday = new Date(weekOf + 'T00:00:00');
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
  return `${fmt(monday)} - ${fmt(friday)}, ${friday.getFullYear()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MondayBriefDocument() {
  const [brief, setBrief] = useState<MondayBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/monday-brief');
      const data = await res.json();
      if (data.error && !data.brief) {
        setError(data.error);
      } else {
        setBrief(data.brief);
        setLastUpdated(data.lastUpdated);
        setIsStale(data.isStale || false);
      }
    } catch {
      setError('Failed to load Monday brief. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/monday-brief/refresh', { method: 'POST' });
    } catch {
      // Still try to re-fetch cached data even if refresh fails
    }
    await fetchBrief();
    setRefreshing(false);
  };

  // ─── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 no-print">
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-3 bg-gray-200 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500">Loading your Monday Morning Brief...</p>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────
  if (error && !brief) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center no-print">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Monday Brief</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Generating...' : 'Generate Monday Brief'}
        </button>
      </div>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────────────────
  if (!brief) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center no-print">
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-4">No Monday brief available yet.</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Generating...' : 'Generate Monday Brief'}
        </button>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────
  const weekRange = formatWeekRange(brief.weekOf);

  return (
    <div className="monday-brief-page">
      {/* Stale warning */}
      {isStale && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-center gap-3 no-print">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            This brief is from a previous week (Week of {brief.weekOf}). Click refresh to generate
            this week&apos;s brief.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="text-sm text-gray-600">Week of {weekRange}</div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Generated:{' '}
              {new Date(lastUpdated).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 1 — Market Context
         ═══════════════════════════════════════════════════════════════════ */}

      {/* Document Header */}
      <div className="bg-blue-600 text-white rounded-t-xl px-6 py-4 mb-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-wide uppercase">
          Monday Morning Brief
        </h1>
        <div className="flex items-center justify-between mt-1">
          <p className="text-blue-100 text-xs sm:text-sm">Week of {weekRange}</p>
          <p className="text-blue-200 text-xs font-medium">Mutual Fund Dost</p>
        </div>
      </div>

      {/* Market Pulse Strip */}
      <div className="bg-white border border-t-0 border-gray-200 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">
          Market Pulse
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(brief.marketPulse || []).map((m: MarketMetric, idx: number) => (
            <div
              key={idx}
              className={`rounded-lg px-2.5 py-2 border border-gray-100 ${dirBg(m.direction)}`}
            >
              <p className="text-[9px] text-gray-500 uppercase tracking-wide leading-tight">
                {m.label}
              </p>
              <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">{m.value}</p>
              {m.change && (
                <p className={`text-[10px] font-semibold leading-tight ${dirColor(m.direction)}`}>
                  {m.change}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nifty Week Summary */}
      {brief.niftyWeekSummary && (
        <div className="bg-gray-50 border border-t-0 border-gray-200 px-6 py-2">
          <p className="text-xs text-gray-600 italic">{brief.niftyWeekSummary}</p>
        </div>
      )}

      {/* The Big Picture */}
      {brief.bigPicture && (
        <div className="bg-white border border-t-0 border-gray-200 px-6 py-4">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">
            The Big Picture
          </h2>
          <div className="space-y-3">
            {brief.bigPicture.split('\n\n').map((para: string, idx: number) => (
              <p key={idx} className="text-sm text-gray-800 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Top Stories */}
      {brief.topStories && brief.topStories.length > 0 && (
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-6 py-4">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">
            Top Stories
          </h2>
          <div className="space-y-3">
            {brief.topStories.map((story: WeeklyStory, idx: number) => (
              <div
                key={idx}
                className="border border-gray-100 rounded-lg p-3 bg-white"
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {urgencyBadge(story.urgency)}
                  <span className="text-[9px] uppercase tracking-wide bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                    {story.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{story.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">
                  {story.clientImplication}
                </p>
                {story.talkingPoints && story.talkingPoints.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 mb-2">
                    {story.talkingPoints.map((pt: string, j: number) => (
                      <li key={j} className="text-xs text-gray-700">
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
                {story.affectedClientSegments && story.affectedClientSegments.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {story.affectedClientSegments.map((seg: string, j: number) => (
                      <span
                        key={j}
                        className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                      >
                        {seg}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page break after Page 1 */}
      <div className="page-break my-8" />

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 2 — Distributor Playbook
         ═══════════════════════════════════════════════════════════════════ */}

      {/* Section header */}
      <div className="bg-blue-600 text-white rounded-t-xl px-6 py-3">
        <h2 className="text-base font-bold uppercase tracking-wide">
          Your Action Plan This Week
        </h2>
      </div>

      {/* Action Plan Table */}
      {brief.actionPlan && brief.actionPlan.length > 0 && (
        <div className="bg-white border border-t-0 border-gray-200 px-4 py-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                  Priority
                </th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                  Task
                </th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                  Client Segment
                </th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                  Timing
                </th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                  Context
                </th>
              </tr>
            </thead>
            <tbody>
              {brief.actionPlan.map((item: ClientActionItem, idx: number) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}
                >
                  <td className="py-2 px-2">{priorityBadge(item.priority)}</td>
                  <td className="py-2 px-2 font-medium text-gray-900">{item.task}</td>
                  <td className="py-2 px-2 text-gray-600">{item.clientSegment}</td>
                  <td className="py-2 px-2 text-gray-600">{item.timing}</td>
                  <td className="py-2 px-2 text-gray-500">{item.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SIP Wins Stat */}
      {brief.sipWinsStat && (
        <div className="border border-t-0 border-gray-200 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50">
          <p className="text-[10px] uppercase tracking-wide text-amber-700 font-bold mb-1.5">
            SIP Wins — Your Ammunition
          </p>
          <p className="text-sm text-amber-900 font-semibold leading-relaxed">
            {brief.sipWinsStat}
          </p>
        </div>
      )}

      {/* Conversation Playbook */}
      {brief.conversationScripts && brief.conversationScripts.length > 0 && (
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-6 py-4">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">
            Conversation Playbook
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brief.conversationScripts.map((script: ConversationScript, idx: number) => (
              <div
                key={idx}
                className="border border-gray-100 rounded-lg overflow-hidden"
              >
                <div className="bg-blue-50 px-3 py-2">
                  <h3 className="text-xs font-bold text-blue-800">{script.persona}</h3>
                </div>
                <div className="px-3 py-2.5 space-y-2">
                  <p className="text-xs text-gray-700 italic">
                    &ldquo;{script.opener}&rdquo;
                  </p>
                  {script.talkingPoints && script.talkingPoints.length > 0 && (
                    <ol className="list-decimal list-inside space-y-0.5">
                      {script.talkingPoints.map((pt: string, j: number) => (
                        <li key={j} className="text-xs text-gray-700">
                          {pt}
                        </li>
                      ))}
                    </ol>
                  )}
                  {script.objectionHandler && (
                    <div className="bg-amber-50 rounded px-2.5 py-2 mt-1.5">
                      <p className="text-[10px] font-semibold text-amber-700 mb-0.5">
                        When they say...
                      </p>
                      <p className="text-xs text-amber-800">{script.objectionHandler}</p>
                    </div>
                  )}
                  {script.suggestedFund && (
                    <div className="mt-1.5">
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                        {script.suggestedFund}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page break after Page 2 */}
      <div className="page-break my-8" />

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 3 — Intelligence & Opportunities
         ═══════════════════════════════════════════════════════════════════ */}

      {/* Star Performers */}
      {brief.fundSpotlights && brief.fundSpotlights.length > 0 && (
        <div className="mb-4">
          <div className="bg-blue-600 text-white rounded-t-xl px-6 py-3">
            <h2 className="text-base font-bold uppercase tracking-wide">
              Star Performers
            </h2>
          </div>
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brief.fundSpotlights.map((fund: FundSpotlight, idx: number) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl overflow-hidden hero-card"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
                    <h3 className="text-sm font-bold text-blue-900">{fund.fundName}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">AUM: {fund.aum}</p>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {/* Returns mini table */}
                    <div>
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-1 text-[10px] text-gray-400 font-medium">
                              1Y Return
                            </th>
                            <th className="text-left py-1 text-[10px] text-gray-400 font-medium">
                              3Y Return
                            </th>
                            <th className="text-left py-1 text-[10px] text-gray-400 font-medium">
                              5Y Return
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1 font-bold text-gray-900">{fund.return1Y}</td>
                            <td className="py-1 font-bold text-gray-900">{fund.return3Y}</td>
                            <td className="py-1 font-bold text-gray-900">{fund.return5Y}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {fund.categoryRank && (
                      <p className="text-[10px] text-gray-500">{fund.categoryRank}</p>
                    )}
                    {fund.whyThisWeek && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">
                          Why This Week
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {fund.whyThisWeek}
                        </p>
                      </div>
                    )}
                    {fund.elevatorPitch && (
                      <div className="bg-blue-50 border-l-2 border-blue-400 px-3 py-2 rounded-r">
                        <p className="text-[10px] font-semibold text-blue-600 mb-0.5">
                          Elevator Pitch
                        </p>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          {fund.elevatorPitch}
                        </p>
                      </div>
                    )}
                    {fund.sipStory && (
                      <div className="bg-green-50 border-l-2 border-green-400 px-3 py-2 rounded-r">
                        <p className="text-[10px] font-semibold text-green-600 mb-0.5">
                          SIP Story
                        </p>
                        <p className="text-xs text-green-800 leading-relaxed">{fund.sipStory}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fund Performance Heatmap */}
      {brief.fundHeatmap && brief.fundHeatmap.length > 0 && (
        <div className="mb-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                Fund Performance Heatmap
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                      Category
                    </th>
                    <th className="text-right py-2 px-3 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                      1 Week
                    </th>
                    <th className="text-right py-2 px-3 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                      1 Month
                    </th>
                    <th className="text-right py-2 px-3 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                      3 Months
                    </th>
                    <th className="text-right py-2 px-3 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                      1 Year
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {brief.fundHeatmap.map((row: FundHeatmapRow, idx: number) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                    >
                      <td className="py-2 px-3 font-medium text-gray-900">{row.category}</td>
                      <td
                        className="py-2 px-3 text-right font-semibold"
                        style={heatmapColor(row.return1W)}
                      >
                        {row.return1W}
                      </td>
                      <td
                        className="py-2 px-3 text-right font-semibold"
                        style={heatmapColor(row.return1M)}
                      >
                        {row.return1M}
                      </td>
                      <td
                        className="py-2 px-3 text-right font-semibold"
                        style={heatmapColor(row.return3M)}
                      >
                        {row.return3M}
                      </td>
                      <td
                        className="py-2 px-3 text-right font-semibold"
                        style={heatmapColor(row.return1Y)}
                      >
                        {row.return1Y}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Week Ahead Radar */}
      {brief.weekAhead && brief.weekAhead.length > 0 && (
        <div className="mb-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                Week Ahead Radar
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {brief.weekAhead.map((event: WeekAheadEvent, idx: number) => (
                <div key={idx} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap min-w-[80px]">
                    {event.date}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs text-gray-800 font-medium">{event.event}</span>
                    {event.impact && (
                      <span className="text-xs text-gray-500"> — {event.impact}</span>
                    )}
                    {event.actionTrigger && (
                      <p className="text-[10px] text-blue-600 italic mt-0.5">
                        {event.actionTrigger}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Regulatory Corner */}
      <div className="mb-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide">
              Regulatory Corner
            </h2>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-gray-700 leading-relaxed">
              {brief.regulatoryCorner || 'No major regulatory updates this week.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Weekly Wisdom */}
        {brief.weeklyWisdom && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-b border-gray-200">
            <p className="text-xs text-blue-800 italic text-center leading-relaxed">
              &ldquo;{brief.weeklyWisdom}&rdquo;
            </p>
          </div>
        )}

        {/* SEBI Disclaimer */}
        <div className="bg-gray-50 px-6 py-3">
          <p className="text-[9px] text-gray-400 leading-relaxed">
            <strong>Disclaimer:</strong> This document is generated by AI for informational purposes
            only and is intended for mutual fund distributors as a preparatory tool. It does not
            constitute investment advice, recommendations, or an offer to buy or sell securities.
            Mutual fund investments are subject to market risks. Please read all scheme-related
            documents carefully. Past performance is not indicative of future results. All data
            shown may be approximate and AI-generated. Distributors must exercise their own judgment
            and comply with SEBI/AMFI regulations when advising clients. AMFI Registration required
            for distribution.
          </p>
          <p className="text-[9px] text-gray-400 text-right mt-2 font-medium">
            Powered by Mutual Fund Dost AI
          </p>
        </div>
      </div>
    </div>
  );
}
