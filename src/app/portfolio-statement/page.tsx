'use client';

import { useState, useRef } from 'react';
import { track } from '@vercel/analytics';
import { HDFC_FUNDS, Fund } from '@/data/hdfc-funds';
import {
  PlusCircle,
  Trash2,
  Printer,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Loader2,
  Info,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// Annualised return using (current/invested)^(1/years) - 1
function annualisedReturn(invested: number, current: number, years: number): number | null {
  if (invested <= 0 || current <= 0 || years <= 0) return null;
  return (Math.pow(current / invested, 1 / years) - 1) * 100;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Holding {
  id: string;
  fundId: string;
  units: string;
  purchaseNav: string;
  purchaseDate: string;
}

interface CalculatedHolding {
  fund: Fund;
  units: number;
  purchaseNav: number | null;
  purchaseDate: string;
  currentNav: number;
  navDate: string;
  investedValue: number | null;
  currentValue: number;
  gainLoss: number | null;
  gainLossPct: number | null;
  annualisedPct: number | null;
}

function emptyHolding(): Holding {
  return {
    id: Math.random().toString(36).slice(2),
    fundId: '',
    units: '',
    purchaseNav: '',
    purchaseDate: '',
  };
}

// ─── Fund Autocomplete ────────────────────────────────────────────────────────

function FundSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selected = HDFC_FUNDS.find((f) => f.id === value);
  const filtered = query
    ? HDFC_FUNDS.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : HDFC_FUNDS.slice(0, 8);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search fund…"
        value={open ? query : (selected?.name ?? '')}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setQuery(e.target.value)}
      />
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-400">No funds found</li>
          )}
          {filtered.map((f) => (
            <li
              key={f.id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-red-50 hover:text-red-700"
              onMouseDown={() => {
                onChange(f.id);
                setOpen(false);
                setQuery('');
              }}
            >
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-gray-400">{f.subCategory}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortfolioStatementPage() {
  const [holdings, setHoldings] = useState<Holding[]>([emptyHolding()]);
  const [results, setResults] = useState<CalculatedHolding[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  function addHolding() {
    setHoldings((prev) => [...prev, emptyHolding()]);
  }

  function removeHolding(id: string) {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }

  function updateHolding(id: string, patch: Partial<Holding>) {
    setHoldings((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  async function calculate() {
    const valid = holdings.filter((h) => h.fundId && parseFloat(h.units) > 0);
    if (valid.length === 0) {
      setError('Add at least one holding with a fund selected and units entered.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/nav-lookup');
      if (!res.ok) throw new Error('Failed to fetch live NAV data. Please try again.');
      const navMap: Record<string, { nav: number; date: string }> = await res.json();

      const calc: CalculatedHolding[] = [];

      for (const h of valid) {
        const fund = HDFC_FUNDS.find((f) => f.id === h.fundId)!;
        const liveEntry = navMap[fund.amfiSchemeCode];

        if (!liveEntry) {
          throw new Error(`Live NAV not found for ${fund.name}. AMFI may not have today's data yet.`);
        }

        const units = parseFloat(h.units);
        const purchaseNav = h.purchaseNav ? parseFloat(h.purchaseNav) : null;
        const currentValue = units * liveEntry.nav;
        const investedValue = purchaseNav ? units * purchaseNav : null;
        const gainLoss = investedValue != null ? currentValue - investedValue : null;
        const gainLossPct = investedValue != null && investedValue > 0
          ? ((currentValue - investedValue) / investedValue) * 100
          : null;

        let annualisedPct: number | null = null;
        if (investedValue != null && h.purchaseDate) {
          const days = (Date.now() - new Date(h.purchaseDate).getTime()) / 86400000;
          const years = days / 365.25;
          annualisedPct = annualisedReturn(investedValue, currentValue, years);
        }

        calc.push({
          fund,
          units,
          purchaseNav,
          purchaseDate: h.purchaseDate,
          currentNav: liveEntry.nav,
          navDate: liveEntry.date,
          investedValue,
          currentValue,
          gainLoss,
          gainLossPct,
          annualisedPct,
        });
      }

      setResults(calc);
      track('portfolio_statement_generated', { holdings_count: calc.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    track('portfolio_statement_printed');
    window.print();
  }

  // ─── Totals ───────────────────────────────────────────────────────────────
  const totalCurrentValue = results?.reduce((s, r) => s + r.currentValue, 0) ?? 0;
  const totalInvested = results
    ?.filter((r) => r.investedValue != null)
    .reduce((s, r) => s + r.investedValue!, 0) ?? 0;
  const totalGainLoss = totalInvested > 0 ? totalCurrentValue - totalInvested : null;
  const totalGainLossPct =
    totalInvested > 0 && totalGainLoss != null
      ? (totalGainLoss / totalInvested) * 100
      : null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #portfolio-print, #portfolio-print * { visibility: visible !important; }
          #portfolio-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-700 via-red-800 to-red-900 text-white py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <IndianRupee className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl font-bold">Portfolio Statement Generator</h1>
            </div>
            <p className="text-red-100 max-w-2xl">
              Enter client holdings → get live NAV from AMFI → generate a clean, printable
              portfolio statement. No signup, no storage — all client-side.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Input Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 no-print">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Client Holdings</h2>

            <div className="space-y-3 mb-4">
              {holdings.map((h, idx) => (
                <div
                  key={h.id}
                  className="grid grid-cols-12 gap-2 items-start"
                >
                  {/* Fund selector — 5 cols */}
                  <div className="col-span-12 sm:col-span-5">
                    {idx === 0 && (
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Fund
                      </label>
                    )}
                    <FundSelect
                      value={h.fundId}
                      onChange={(id) => updateHolding(h.id, { fundId: id })}
                    />
                  </div>

                  {/* Units — 2 cols */}
                  <div className="col-span-4 sm:col-span-2">
                    {idx === 0 && (
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Units
                      </label>
                    )}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.000"
                      value={h.units}
                      onChange={(e) => updateHolding(h.id, { units: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Purchase NAV — 2 cols */}
                  <div className="col-span-4 sm:col-span-2">
                    {idx === 0 && (
                      <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        Purchase NAV
                        <span className="text-gray-400 font-normal">(opt)</span>
                      </label>
                    )}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="₹0.00"
                      value={h.purchaseNav}
                      onChange={(e) => updateHolding(h.id, { purchaseNav: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Purchase Date — 2 cols */}
                  <div className="col-span-4 sm:col-span-2">
                    {idx === 0 && (
                      <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        Purchase Date
                        <span className="text-gray-400 font-normal">(opt)</span>
                      </label>
                    )}
                    <input
                      type="date"
                      value={h.purchaseDate}
                      onChange={(e) => updateHolding(h.id, { purchaseDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Delete */}
                  <div className={`col-span-12 sm:col-span-1 flex ${idx === 0 ? 'sm:mt-6' : ''} justify-end sm:justify-center`}>
                    <button
                      onClick={() => removeHolding(h.id)}
                      disabled={holdings.length === 1}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <button
                onClick={addHolding}
                className="flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Add another fund
              </button>

              <div className="flex-1" />

              <button
                onClick={calculate}
                disabled={loading}
                className="flex items-center gap-2 bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {loading ? 'Fetching live NAVs…' : 'Generate Portfolio Statement'}
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          {results && (
            <div id="portfolio-print" ref={printRef}>
              {/* Print header */}
              <div className="hidden print:block mb-6 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-red-700">HDFC Mutual Fund</div>
                    <div className="text-sm text-gray-500">Portfolio Statement — For Distributor Reference Only</div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    Generated: {new Date().toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Print button */}
              <div className="flex items-center justify-between mb-4 no-print">
                <h2 className="text-lg font-bold text-gray-900">Portfolio Statement</h2>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
              </div>

              {/* Holdings table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Fund</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">Units</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Purchase NAV
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Current NAV
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Invested
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Current Value
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Gain / Loss
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">
                          Returns p.a.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {results.map((r) => {
                        const isGain = (r.gainLoss ?? 0) >= 0;
                        return (
                          <tr key={r.fund.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{r.fund.name}</div>
                              <div className="text-xs text-gray-400">{r.fund.subCategory}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                              {r.units.toFixed(3)}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                              {r.purchaseNav != null ? `₹${r.purchaseNav.toFixed(4)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                              <div>₹{r.currentNav.toFixed(4)}</div>
                              <div className="text-xs text-gray-400">{r.navDate}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                              {r.investedValue != null ? fmt(r.investedValue) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                              {fmt(r.currentValue)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {r.gainLoss != null ? (
                                <div
                                  className={
                                    isGain ? 'text-emerald-600' : 'text-red-600'
                                  }
                                >
                                  <div className="flex items-center justify-end gap-1">
                                    {isGain ? (
                                      <TrendingUp className="w-3 h-3" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3" />
                                    )}
                                    {fmt(Math.abs(r.gainLoss))}
                                  </div>
                                  <div className="text-xs">{fmtPct(r.gainLossPct!)}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {r.annualisedPct != null ? (
                                <span
                                  className={
                                    r.annualisedPct >= 0
                                      ? 'text-emerald-600 font-semibold'
                                      : 'text-red-600 font-semibold'
                                  }
                                >
                                  {fmtPct(r.annualisedPct)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs font-medium text-gray-500 mb-1">Total Invested</div>
                  <div className="text-lg font-bold text-gray-900">
                    {totalInvested > 0 ? fmt(totalInvested) : '—'}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs font-medium text-gray-500 mb-1">Current Value</div>
                  <div className="text-lg font-bold text-gray-900">
                    {fmt(totalCurrentValue)}
                  </div>
                </div>

                <div
                  className={`bg-white rounded-xl border p-4 ${
                    (totalGainLoss ?? 0) >= 0
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-1">Total Gain / Loss</div>
                  <div
                    className={`text-lg font-bold ${
                      (totalGainLoss ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {totalGainLoss != null ? fmt(Math.abs(totalGainLoss)) : '—'}
                  </div>
                </div>

                <div
                  className={`bg-white rounded-xl border p-4 ${
                    (totalGainLossPct ?? 0) >= 0
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-1">Overall Return</div>
                  <div
                    className={`text-lg font-bold ${
                      (totalGainLossPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {totalGainLossPct != null ? fmtPct(totalGainLossPct) : '—'}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-xs text-gray-400 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                <strong>Disclaimer:</strong> NAV sourced from AMFI India (www.amfiindia.com). Returns
                are calculated based on NAV changes only and do not account for dividends, STT, exit
                loads, or tax implications. Past performance is not indicative of future results. This
                statement is for distributor reference only — not an official account statement.
                HDFC Direct Growth plans.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
