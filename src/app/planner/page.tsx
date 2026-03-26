'use client';

import { useState, useCallback } from 'react';
import { track } from '@vercel/analytics';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Calculator, TrendingUp, IndianRupee, Info, ChevronDown } from 'lucide-react';
import { HDFC_FUNDS } from '@/data/hdfc-funds';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  // DD-MM-YYYY → YYYY-MM-DD
  const parts = d.split('-');
  if (parts.length === 3 && parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

function toISODate(d: string) {
  // YYYY-MM-DD passthrough or DD-MM-YYYY convert
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const [dd, mm, yyyy] = d.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

function diffDays(from: string, to: string) {
  return (new Date(to).getTime() - new Date(from).getTime()) / 86400000;
}

// ─── SIP Goal Planner ────────────────────────────────────────────────────────

interface SIPResult {
  monthlySIP: number;
  totalInvested: number;
  totalCorpus: number;
  totalReturns: number;
  chartData: { year: number; invested: number; corpus: number }[];
}

function calcSIP(target: number, years: number, annualRate: number): SIPResult {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const monthlySIP = r === 0 ? target / n : (target * r) / (Math.pow(1 + r, n) - 1);

  const chartData = [];
  for (let yr = 1; yr <= years; yr++) {
    const months = yr * 12;
    const corpus = r === 0
      ? monthlySIP * months
      : monthlySIP * ((Math.pow(1 + r, months) - 1) / r);
    chartData.push({
      year: yr,
      invested: Math.round(monthlySIP * months),
      corpus: Math.round(corpus),
    });
  }

  return {
    monthlySIP: Math.ceil(monthlySIP / 100) * 100,
    totalInvested: Math.round(monthlySIP * n),
    totalCorpus: target,
    totalReturns: Math.round(target - monthlySIP * n),
    chartData,
  };
}

const RETURN_PRESETS: { label: string; value: number; hint: string }[] = [
  { label: 'Conservative (Debt)', value: 7, hint: 'Liquid / Short Duration funds' },
  { label: 'Moderate (Hybrid)', value: 11, hint: 'Balanced Advantage funds' },
  { label: 'Growth (Large Cap)', value: 13, hint: 'HDFC Top 100 category avg.' },
  { label: 'Aggressive (Mid Cap)', value: 16, hint: 'HDFC Mid Cap category avg.' },
];

function SIPPlanner() {
  const [targetRaw, setTargetRaw] = useState('50,00,000');
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(13);
  const [result, setResult] = useState<SIPResult | null>(null);

  const target = parseInt(targetRaw.replace(/[^0-9]/g, ''), 10) || 0;

  const calculate = useCallback(() => {
    if (target <= 0 || years <= 0 || rate <= 0) return;
    track('sip_calculation_run', { target_corpus: target, years, expected_rate: rate });
    setResult(calcSIP(target, years, rate));
  }, [target, years, rate]);

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#e31e24]" />
          Plan Your Investment Goal
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Target Corpus */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Target Corpus
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="text"
                value={targetRaw}
                onChange={e => setTargetRaw(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e31e24]/30 focus:border-[#e31e24]"
                placeholder="50,00,000"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{target > 0 ? fmt(target) : 'Enter amount'}</p>
          </div>

          {/* Time Horizon */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Time Horizon
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1} max={30}
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="flex-1 h-2 rounded accent-[#e31e24]"
              />
              <span className="text-sm font-bold text-gray-800 w-16 text-right">
                {years} yr{years > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Drag to set 1–30 years</p>
          </div>

          {/* Expected Return */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Expected Return (% p.a.)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={4} max={24} step={0.5}
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="flex-1 h-2 rounded accent-[#e31e24]"
              />
              <span className="text-sm font-bold text-gray-800 w-12 text-right">
                {rate}%
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">4% – 24%</p>
          </div>
        </div>

        {/* Quick preset buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {RETURN_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setRate(p.value)}
              title={p.hint}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                rate === p.value
                  ? 'bg-[#e31e24] text-white border-[#e31e24]'
                  : 'border-gray-200 text-gray-600 hover:border-[#e31e24] hover:text-[#e31e24]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          onClick={calculate}
          disabled={target <= 0}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#e31e24] text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-40"
        >
          <Calculator className="w-4 h-4" />
          Calculate Monthly SIP
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Monthly SIP', value: fmt(result.monthlySIP), accent: true },
              { label: 'Total Invested', value: fmt(result.totalInvested), accent: false },
              { label: 'Estimated Returns', value: fmt(result.totalReturns), accent: false },
              { label: 'Total Corpus', value: fmt(result.totalCorpus), accent: false },
            ].map(card => (
              <div
                key={card.label}
                className={`rounded-xl p-4 border ${card.accent ? 'bg-[#e31e24] border-[#e31e24] text-white' : 'bg-white border-gray-200'}`}
              >
                <p className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${card.accent ? 'text-red-100' : 'text-gray-500'}`}>
                  {card.label}
                </p>
                <p className={`text-lg font-bold ${card.accent ? 'text-white' : 'text-gray-900'}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Corpus Growth Over Time
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={result.chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e31e24" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e31e24" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickFormatter={v => `Yr ${v}`}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickFormatter={v => fmt(v).replace('₹', '')}
                  width={56}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any, name: any) => [fmt(typeof v === 'number' ? v : parseFloat(String(v))), name === 'corpus' ? 'Corpus' : 'Invested'] as [string, string]}
                  labelFormatter={v => `Year ${v}`}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="invested" stroke="#9ca3af" fill="url(#investedGrad)" strokeWidth={1.5} name="invested" />
                <Area type="monotone" dataKey="corpus" stroke="#e31e24" fill="url(#corpusGrad)" strokeWidth={2} name="corpus" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Assumes constant {rate}% p.a. return. Actual returns may vary. Not investment advice.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Capital Gains Tax Calculator ─────────────────────────────────────────────

const EQUITY_FUNDS = HDFC_FUNDS.filter(f => ['equity', 'index', 'hybrid'].includes(f.category));
const DEBT_FUNDS = HDFC_FUNDS.filter(f => ['debt', 'fof', 'solution'].includes(f.category));

interface CGResult {
  purchaseNAV: number;
  redemptionNAV: number;
  purchaseValue: number;
  redemptionValue: number;
  gain: number;
  holdingDays: number;
  isLongTerm: boolean;
  isEquity: boolean;
  taxableGain: number;
  taxRate: number;
  taxLiability: number;
  regime: string;
  note: string;
}

function calcTax(
  units: number,
  buyNAV: number,
  sellNAV: number,
  buyDate: string,
  sellDate: string,
  isEquity: boolean,
): CGResult {
  const holdingDays = diffDays(buyDate, sellDate);
  const isLongTerm = isEquity ? holdingDays >= 365 : holdingDays >= 36500; // debt: always STCG now
  const purchaseValue = units * buyNAV;
  const redemptionValue = units * sellNAV;
  const gain = redemptionValue - purchaseValue;

  let taxableGain = gain;
  let taxRate = 0;
  let regime = '';
  let note = '';

  if (gain <= 0) {
    regime = 'Capital Loss';
    note = 'Loss can be carried forward for 8 years.';
    return {
      purchaseNAV: buyNAV, redemptionNAV: sellNAV, purchaseValue, redemptionValue,
      gain, holdingDays, isLongTerm, isEquity, taxableGain: 0, taxRate: 0, taxLiability: 0,
      regime, note,
    };
  }

  if (isEquity) {
    if (isLongTerm) {
      // LTCG equity: 12.5% over ₹1.25L exemption (Finance Act 2024)
      const exemption = 125000;
      taxableGain = Math.max(0, gain - exemption);
      taxRate = 12.5;
      regime = 'LTCG (Equity)';
      note = `First ₹1.25L of LTCG is exempt. Holding: ${Math.round(holdingDays / 30)} months.`;
    } else {
      // STCG equity: 20% flat (Finance Act 2024, earlier 15%)
      taxableGain = gain;
      taxRate = 20;
      regime = 'STCG (Equity)';
      note = `Holding under 1 year. STCG taxed at 20%. Holding: ${holdingDays} days.`;
    }
  } else {
    // Debt funds: no indexation, gains added to income (slab rate post Apr 2023)
    taxableGain = gain;
    taxRate = 0; // slab rate — we show as "as per slab"
    regime = holdingDays >= 365 ? 'Debt LTCG (Slab Rate)' : 'Debt STCG (Slab Rate)';
    note = 'Debt fund gains are taxed at your income tax slab rate (no indexation benefit post April 2023).';
  }

  const taxLiability = isEquity ? (taxableGain * taxRate) / 100 : 0;

  return {
    purchaseNAV: buyNAV, redemptionNAV: sellNAV, purchaseValue, redemptionValue,
    gain, holdingDays, isLongTerm, isEquity, taxableGain, taxRate, taxLiability,
    regime, note,
  };
}

function CGTaxCalc() {
  const allFunds = [...EQUITY_FUNDS, ...DEBT_FUNDS];
  const [selectedFundId, setSelectedFundId] = useState(allFunds[0]?.id ?? '');
  const [units, setUnits] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [sellDate, setSellDate] = useState(new Date().toISOString().slice(0, 10));
  const [buyNAVInput, setBuyNAVInput] = useState('');
  const [fetchingNAV, setFetchingNAV] = useState(false);
  const [fetchedSellNAV, setFetchedSellNAV] = useState<number | null>(null);
  const [navError, setNavError] = useState('');
  const [result, setResult] = useState<CGResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const selectedFund = allFunds.find(f => f.id === selectedFundId);
  const isEquity = selectedFund ? ['equity', 'index'].includes(selectedFund.category) : true;

  const fetchSellNAV = useCallback(async () => {
    if (!selectedFund || !sellDate) return;
    setFetchingNAV(true);
    setNavError('');
    setFetchedSellNAV(null);
    try {
      const res = await fetch(`/api/planner/nav?code=${selectedFund.amfiSchemeCode}&date=${sellDate}`);
      const data = await res.json();
      if (data.nav) {
        setFetchedSellNAV(data.nav);
      } else {
        // fallback: fetch latest
        const res2 = await fetch(`/api/planner/nav?code=${selectedFund.amfiSchemeCode}`);
        const d2 = await res2.json();
        if (d2.nav) setFetchedSellNAV(d2.nav);
        else setNavError(data.error || 'NAV not found for this date. Enter manually.');
      }
    } catch {
      setNavError('Could not fetch NAV. Enter redemption NAV manually.');
    } finally {
      setFetchingNAV(false);
    }
  }, [selectedFund, sellDate]);

  const [sellNAVInput, setSellNAVInput] = useState('');
  const sellNAV = fetchedSellNAV ?? (parseFloat(sellNAVInput) || 0);

  const calculate = () => {
    const u = parseFloat(units);
    const buyNAV = parseFloat(buyNAVInput);
    if (!u || !buyNAV || !sellNAV || !buyDate || !sellDate) return;
    if (new Date(buyDate) >= new Date(sellDate)) return;
    track('capital_gains_calculation_run', { fund_type: isEquity ? 'equity' : 'debt' });
    setCalculating(true);
    setTimeout(() => {
      setResult(calcTax(u, buyNAV, sellNAV, buyDate, sellDate, isEquity));
      setCalculating(false);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-[#e31e24]" />
          Capital Gains Tax Calculator
        </h2>

        {/* Info note */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 mb-5 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Based on Finance Act 2024 rates: STCG equity 20%, LTCG equity 12.5% (₹1.25L exempt), debt funds at slab rate.
            Last updated: Finance Act 2024. Consult your tax advisor for current rates and individual liability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fund selector */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Fund
            </label>
            <div className="relative">
              <select
                value={selectedFundId}
                onChange={e => { setSelectedFundId(e.target.value); setFetchedSellNAV(null); setNavError(''); setResult(null); }}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31e24]/30 focus:border-[#e31e24] bg-white"
              >
                <optgroup label="Equity Funds">
                  {EQUITY_FUNDS.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Debt / Other Funds">
                  {DEBT_FUNDS.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {selectedFund && (
              <p className="text-[10px] text-gray-400 mt-1">
                {selectedFund.subCategory} · {isEquity ? 'Equity taxation' : 'Debt taxation (slab rate)'}
              </p>
            )}
          </div>

          {/* Units */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Units Redeemed
            </label>
            <input
              type="number"
              value={units}
              onChange={e => setUnits(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31e24]/30 focus:border-[#e31e24]"
              placeholder="e.g. 500"
              min={0.001}
              step={0.001}
            />
          </div>

          {/* Purchase NAV */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Purchase NAV (₹)
            </label>
            <input
              type="number"
              value={buyNAVInput}
              onChange={e => setBuyNAVInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31e24]/30 focus:border-[#e31e24]"
              placeholder="From your contract note"
              min={0}
              step={0.01}
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Purchase Date
            </label>
            <input
              type="date"
              value={buyDate}
              onChange={e => setBuyDate(e.target.value)}
              max={sellDate}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31e24]/30 focus:border-[#e31e24]"
            />
          </div>

          {/* Redemption Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Redemption Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={sellDate}
                onChange={e => { setSellDate(e.target.value); setFetchedSellNAV(null); setNavError(''); }}
                min={buyDate || undefined}
                max={new Date().toISOString().slice(0, 10)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31e24]/30 focus:border-[#e31e24]"
              />
              <button
                onClick={fetchSellNAV}
                disabled={fetchingNAV || !selectedFund || !sellDate}
                className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-40 whitespace-nowrap"
              >
                {fetchingNAV ? '…' : 'Fetch NAV'}
              </button>
            </div>
          </div>

          {/* Redemption NAV */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Redemption NAV (₹)
              {fetchedSellNAV && (
                <span className="ml-2 text-green-600 normal-case font-normal text-[10px]">
                  ✓ Fetched from mfapi.in
                </span>
              )}
            </label>
            <input
              type="number"
              value={fetchedSellNAV !== null ? fetchedSellNAV.toString() : sellNAVInput}
              onChange={e => { setFetchedSellNAV(null); setSellNAVInput(e.target.value); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31e24]/30 focus:border-[#e31e24]"
              placeholder="Click 'Fetch NAV' or enter manually"
              min={0}
              step={0.01}
            />
            {navError && <p className="text-[10px] text-red-500 mt-1">{navError}</p>}
          </div>
        </div>

        <button
          onClick={calculate}
          disabled={calculating || !units || !buyNAVInput || !sellNAV || !buyDate || !sellDate}
          className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#e31e24] text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-40"
        >
          <Calculator className="w-4 h-4" />
          {calculating ? 'Calculating...' : 'Calculate Tax'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Tax Breakdown</h3>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                result.gain < 0
                  ? 'bg-blue-50 text-blue-700'
                  : result.isLongTerm
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {result.regime}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { label: 'Purchase Value', value: fmt(result.purchaseValue), sub: `${result.purchaseNAV.toFixed(4)} × ${parseFloat(units || '0')} units` },
              { label: 'Redemption Value', value: fmt(result.redemptionValue), sub: `${result.redemptionNAV.toFixed(4)} × ${parseFloat(units || '0')} units` },
              { label: result.gain >= 0 ? 'Capital Gain' : 'Capital Loss', value: fmt(Math.abs(result.gain)), sub: `Holding: ${result.holdingDays} days`, accent: result.gain >= 0 },
              ...(result.isEquity && result.gain > 0 ? [{ label: 'Taxable Gain', value: fmt(result.taxableGain), sub: result.isLongTerm ? '₹1.25L exemption applied' : 'No exemption for STCG', accent: false }] : []),
              { label: 'Applicable Tax Rate', value: result.isEquity ? `${result.taxRate}%` : 'As per slab', sub: result.regime, accent: false },
              { label: 'Estimated Tax Liability', value: result.isEquity ? fmt(result.taxLiability) : 'Depends on your slab', sub: result.note, accent: result.taxLiability > 0 },
            ].map((row, i) => (
              <div key={i} className="px-6 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{row.label}</p>
                  {row.sub && <p className="text-[10px] text-gray-400 mt-0.5">{row.sub}</p>}
                </div>
                <p className={`text-sm font-bold whitespace-nowrap ${row.accent ? 'text-[#e31e24]' : 'text-gray-900'}`}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              This is an estimate based on Finance Act 2024 rates. Consult a tax advisor for your exact liability.
              Surcharge and cess (4% health & education cess) not included.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'sip', label: 'SIP Goal Planner', icon: TrendingUp },
  { id: 'cg', label: 'Capital Gains Tax', icon: IndianRupee },
] as const;

type TabId = typeof TABS[number]['id'];

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<TabId>('sip');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#e31e24] rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">MFD Toolkit</h1>
            <p className="text-sm text-gray-500">Financial calculators for distributor client conversations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-[#e31e24]'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'sip' ? <SIPPlanner /> : <CGTaxCalc />}
    </div>
  );
}
