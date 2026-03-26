'use client';

import { useState, useCallback } from 'react';
import { track } from '@vercel/analytics';
import { IndianRupee, TrendingUp, Info, BarChart3, PlusCircle, Trash2 } from 'lucide-react';

// ─── Trail commission rates by category (AMFI/industry standard) ─────────────
// These are approximate distributor trail commissions for HDFC regular plans.
// Source: SEBI-mandated TER disclosures + AMFI distribution commission norms.

const CATEGORIES = [
  { id: 'equity-large', label: 'Equity — Large Cap', trail: 0.75, color: 'bg-red-500' },
  { id: 'equity-flexi', label: 'Equity — Flexi / Multi Cap', trail: 0.85, color: 'bg-red-600' },
  { id: 'equity-mid', label: 'Equity — Mid Cap', trail: 0.90, color: 'bg-orange-500' },
  { id: 'equity-small', label: 'Equity — Small Cap', trail: 0.95, color: 'bg-orange-600' },
  { id: 'equity-elss', label: 'Equity — ELSS (Tax Saver)', trail: 0.75, color: 'bg-amber-500' },
  { id: 'equity-thematic', label: 'Equity — Sectoral / Thematic', trail: 0.90, color: 'bg-amber-600' },
  { id: 'hybrid-aggressive', label: 'Hybrid — Aggressive (65%+ equity)', trail: 0.75, color: 'bg-blue-500' },
  { id: 'hybrid-balanced', label: 'Hybrid — Balanced / Conservative', trail: 0.50, color: 'bg-blue-400' },
  { id: 'hybrid-arbitrage', label: 'Hybrid — Arbitrage', trail: 0.25, color: 'bg-sky-400' },
  { id: 'debt-liquid', label: 'Debt — Liquid / Overnight', trail: 0.05, color: 'bg-emerald-400' },
  { id: 'debt-shortterm', label: 'Debt — Short Duration / UST', trail: 0.15, color: 'bg-emerald-500' },
  { id: 'debt-medium', label: 'Debt — Medium / Dynamic Bond', trail: 0.30, color: 'bg-teal-500' },
  { id: 'debt-credit', label: 'Debt — Credit Risk', trail: 0.40, color: 'bg-teal-600' },
  { id: 'index', label: 'Index / ETF (Passives)', trail: 0.10, color: 'bg-gray-400' },
  { id: 'fof', label: 'Fund of Funds', trail: 0.25, color: 'bg-purple-400' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)} K`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function parseL(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n * 1_00_000; // input in Lakhs
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AUMRow {
  id: string;
  categoryId: CategoryId;
  aum: string; // in Lakhs
}

function emptyRow(): AUMRow {
  return { id: Math.random().toString(36).slice(2), categoryId: 'equity-flexi', aum: '' };
}

// ─── Growth projection ───────────────────────────────────────────────────────

function projectedAUM(baseAUM: number, monthlyNetSIP: number, growthYears: number): number {
  // Compound AUM assuming: base AUM grows at 12% p.a. + SIP additions accumulate at 12% p.a.
  const annualRate = 0.12;
  const months = growthYears * 12;
  const monthlyRate = annualRate / 12;
  const grownBase = baseAUM * Math.pow(1 + annualRate, growthYears);
  const sipCorpus =
    monthlyRate > 0
      ? monthlyNetSIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : monthlyNetSIP * months;
  return grownBase + sipCorpus;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommissionEstimatorPage() {
  const [rows, setRows] = useState<AUMRow[]>([emptyRow()]);
  const [monthlySIP, setMonthlySIP] = useState('');
  const [projYears, setProjYears] = useState('5');

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }
  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }
  function updateRow(id: string, patch: Partial<AUMRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const calculate = useCallback(() => {
    track('commission_estimator_used', { rows: rows.length });
  }, [rows]);

  // ─── Current income ───────────────────────────────────────────────────────
  const breakdown = rows
    .filter((r) => parseFloat(r.aum) > 0)
    .map((r) => {
      const cat = CATEGORIES.find((c) => c.id === r.categoryId)!;
      const aum = parseL(r.aum);
      const annualIncome = (aum * cat.trail) / 100;
      return { cat, aum, annualIncome };
    });

  const totalAUM = breakdown.reduce((s, b) => s + b.aum, 0);
  const totalAnnualIncome = breakdown.reduce((s, b) => s + b.annualIncome, 0);
  const monthlyIncome = totalAnnualIncome / 12;

  // Blended trail rate
  const blendedTrail = totalAUM > 0 ? (totalAnnualIncome / totalAUM) * 100 : 0;

  // ─── Growth projection ────────────────────────────────────────────────────
  const years = parseInt(projYears, 10) || 5;
  const monthlySIPVal = parseFloat(monthlySIP) * 1_00_000 || 0; // in Lakhs, converted
  const projectedTotalAUM = projectedAUM(totalAUM, monthlySIPVal, years);
  const projectedAnnualIncome = (projectedTotalAUM * blendedTrail) / 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-700 via-red-800 to-red-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-8 h-8 text-yellow-300" />
            <h1 className="text-3xl font-bold">Trail Commission Estimator</h1>
          </div>
          <p className="text-red-100 max-w-2xl">
            Model your annual trail commission income from your HDFC MF AUM. Enter your AUM
            by category and see your current income — plus a 5/10-year growth projection.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* AUM Input */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Your AUM by Category</h2>
          <p className="text-sm text-gray-500 mb-5">
            Enter AUM in Lakhs (₹ L). Trail rates are approximate industry norms for regular plans.
          </p>

          <div className="space-y-3 mb-4">
            {rows.map((row, idx) => (
              <div key={row.id} className="grid grid-cols-12 gap-3 items-start">
                {/* Category */}
                <div className="col-span-12 sm:col-span-8">
                  {idx === 0 && (
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Fund Category
                    </label>
                  )}
                  <select
                    value={row.categoryId}
                    onChange={(e) => updateRow(row.id, { categoryId: e.target.value as CategoryId })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} — {c.trail}% trail
                      </option>
                    ))}
                  </select>
                </div>

                {/* AUM */}
                <div className="col-span-10 sm:col-span-3">
                  {idx === 0 && (
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      AUM (₹ Lakhs)
                    </label>
                  )}
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00 L"
                    value={row.aum}
                    onChange={(e) => updateRow(row.id, { aum: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Delete */}
                <div className={`col-span-2 sm:col-span-1 flex ${idx === 0 ? 'sm:mt-6' : ''} justify-center`}>
                  <button
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add another category
          </button>
        </div>

        {/* Summary Cards */}
        {totalAUM > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs font-medium text-gray-500 mb-1">Total AUM</div>
                <div className="text-xl font-bold text-gray-900">{fmt(totalAUM)}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs font-medium text-gray-500 mb-1">Blended Trail Rate</div>
                <div className="text-xl font-bold text-gray-900">{blendedTrail.toFixed(2)}%</div>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                <div className="text-xs font-medium text-gray-500 mb-1">Annual Trail Income</div>
                <div className="text-xl font-bold text-emerald-700">{fmt(totalAnnualIncome)}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                <div className="text-xs font-medium text-gray-500 mb-1">Monthly Income</div>
                <div className="text-xl font-bold text-emerald-700">{fmt(monthlyIncome)}</div>
              </div>
            </div>

            {/* Category Breakdown Bar */}
            {breakdown.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">AUM Mix</h3>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
                  {breakdown.map((b) => (
                    <div
                      key={b.cat.id}
                      className={`${b.cat.color} transition-all`}
                      style={{ width: `${(b.aum / totalAUM) * 100}%` }}
                      title={`${b.cat.label}: ${fmt(b.aum)}`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {breakdown.map((b) => (
                    <div key={b.cat.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${b.cat.color}`} />
                        <span className="text-gray-700">{b.cat.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">{fmt(b.aum)}</span>
                        <span className="text-gray-400 ml-2 text-xs">
                          → {fmt(b.annualIncome)}/yr
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Growth Projection */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Income Growth Projection</h3>
              <p className="text-sm text-gray-500 mb-5">
                Assumes 12% p.a. market appreciation on existing AUM plus compounding SIP
                additions. Blended trail rate held constant.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Monthly net new SIP additions (₹ Lakhs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 0.50 for ₹50,000/month"
                    value={monthlySIP}
                    onChange={(e) => setMonthlySIP(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Projection horizon
                  </label>
                  <select
                    value={projYears}
                    onChange={(e) => setProjYears(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {[1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
                      <option key={y} value={y}>
                        {y} year{y > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Milestones Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-2 font-semibold text-gray-700">Year</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-700">
                        Projected AUM
                      </th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-700">
                        Annual Trail Income
                      </th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-700">
                        Monthly Income
                      </th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-700">
                        Growth vs Today
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[1, 2, 3, 5, 7, 10].filter((y) => y <= (parseInt(projYears, 10) || 5) + 1 || y === 10).map((y) => {
                      const projAUM = projectedAUM(totalAUM, monthlySIPVal, y);
                      const projIncome = (projAUM * blendedTrail) / 100;
                      const growth = ((projIncome - totalAnnualIncome) / totalAnnualIncome) * 100;
                      return (
                        <tr key={y} className={y === years ? 'bg-emerald-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            Year {y}
                            {y === years && (
                              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                target
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700 tabular-nums">
                            {fmt(projAUM)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 tabular-nums">
                            {fmt(projIncome)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700 tabular-nums">
                            {fmt(projIncome / 12)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            <span
                              className={`font-semibold ${
                                growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              +{growth.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span>
                Trail commission rates shown are approximate industry norms for HDFC regular plans as per SEBI/AMFI guidelines.
                Actual commissions depend on your ARN agreement, AUM slab, and fund-level TER. Projection assumes 12% p.a.
                market return — actual returns will vary. This is for illustrative purposes only and is not financial advice.
              </span>
            </div>
          </>
        )}

        {/* Empty state */}
        {totalAUM === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">Enter your AUM to see your income</p>
            <p className="text-sm text-gray-400">
              Add one or more categories above with your AUM in Lakhs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
