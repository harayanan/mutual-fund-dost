'use client';

import { Fund } from '@/data/hdfc-funds';
import { X, TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';

interface FundComparisonProps {
  funds: Fund[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

const riskColors: Record<string, string> = {
  Low: 'bg-green-100 text-green-800',
  'Low to Moderate': 'bg-lime-100 text-lime-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  'Moderately High': 'bg-orange-100 text-orange-800',
  High: 'bg-red-100 text-red-800',
  'Very High': 'bg-red-200 text-red-900',
};

type ReturnKey = 'return1y' | 'return3y' | 'return5y' | 'return10y' | 'returnSinceInception';

function getBest(funds: Fund[], field: ReturnKey | 'expenseRatio' | 'aumCrores'): string | null {
  const valid = funds.filter((f) => f[field] !== null);
  if (valid.length === 0) return null;
  if (field === 'expenseRatio') {
    return valid.reduce((best, f) => ((f[field] as number) < (best[field] as number) ? f : best)).id;
  }
  return valid.reduce((best, f) => ((f[field] as number) > (best[field] as number) ? f : best)).id;
}

function formatReturn(val: number | null, isBest: boolean): React.ReactNode {
  if (val === null) return <span className="text-gray-300">--</span>;
  const positive = val >= 0;
  return (
    <div className="flex items-center gap-1">
      {positive ? (
        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
      )}
      <span
        className={`font-bold ${positive ? 'text-green-600' : 'text-red-600'} ${isBest ? 'text-lg' : 'text-base'}`}
      >
        {positive ? '+' : ''}
        {val.toFixed(2)}%
      </span>
      {isBest && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
    </div>
  );
}

export default function FundComparison({ funds, onClose, onRemove }: FundComparisonProps) {
  if (funds.length === 0) return null;

  const best1y = getBest(funds, 'return1y');
  const best3y = getBest(funds, 'return3y');
  const best5y = getBest(funds, 'return5y');
  const best10y = getBest(funds, 'return10y');
  const bestSI = getBest(funds, 'returnSinceInception');
  const bestTER = getBest(funds, 'expenseRatio');
  const bestAUM = getBest(funds, 'aumCrores');

  const rows: {
    label: string;
    render: (fund: Fund) => React.ReactNode;
  }[] = [
    {
      label: 'Category',
      render: (f) => (
        <span className="text-xs font-medium text-gray-700">{f.subCategory}</span>
      ),
    },
    {
      label: 'Risk Level',
      render: (f) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColors[f.riskLevel]}`}>
          {f.riskLevel}
        </span>
      ),
    },
    {
      label: 'AUM',
      render: (f) => (
        <span className={`text-sm ${f.id === bestAUM ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
          {(f.aumCrores / 1000).toFixed(1)}K Cr
          {f.id === bestAUM && <Trophy className="w-3 h-3 text-amber-500 inline ml-1" />}
        </span>
      ),
    },
    {
      label: 'Expense Ratio',
      render: (f) => (
        <span className={`text-sm ${f.id === bestTER ? 'font-bold text-green-600' : 'text-gray-700'}`}>
          {f.expenseRatio.toFixed(2)}%
          {f.id === bestTER && <Trophy className="w-3 h-3 text-amber-500 inline ml-1" />}
        </span>
      ),
    },
    {
      label: '1 Year Return',
      render: (f) => formatReturn(f.return1y, f.id === best1y),
    },
    {
      label: '3 Year Return',
      render: (f) => formatReturn(f.return3y, f.id === best3y),
    },
    {
      label: '5 Year Return',
      render: (f) => formatReturn(f.return5y, f.id === best5y),
    },
    {
      label: '10 Year Return',
      render: (f) => formatReturn(f.return10y, f.id === best10y),
    },
    {
      label: 'Since Inception',
      render: (f) => formatReturn(f.returnSinceInception, f.id === bestSI),
    },
    {
      label: 'Fund Manager',
      render: (f) => <span className="text-xs text-gray-600">{f.fundManager}</span>,
    },
    {
      label: 'Min Horizon',
      render: (f) => (
        <span className="text-xs text-gray-600">{f.minHorizonMonths} months</span>
      ),
    },
    {
      label: 'Benchmark',
      render: (f) => <span className="text-[11px] text-gray-500 leading-tight">{f.benchmark}</span>,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto pt-8 pb-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Fund Comparison
            </h2>
            <p className="text-xs text-indigo-200">
              Comparing {funds.length} HDFC funds side-by-side
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Best indicator legend */}
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-700">
            Trophy icon marks the best value in each row
          </span>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Fund Names Header */}
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36 bg-gray-50 sticky left-0">
                  Metric
                </th>
                {funds.map((fund) => (
                  <th key={fund.id} className="px-4 py-4 text-left min-w-[180px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-gray-900 leading-tight">
                          {fund.name}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {fund.category.toUpperCase()}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(fund.id)}
                        className="text-gray-300 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-0">
                    {row.label}
                  </td>
                  {funds.map((fund) => (
                    <td key={fund.id} className="px-4 py-3">
                      {row.render(fund)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verdict Section */}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Key Observations
          </h3>
          <ul className="space-y-2 text-xs text-gray-600">
            {best5y && (
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  <strong>{funds.find((f) => f.id === best5y)?.name}</strong> has the highest 5-year return,
                  suggesting strong long-term performance consistency.
                </span>
              </li>
            )}
            {bestTER && (
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  <strong>{funds.find((f) => f.id === bestTER)?.name}</strong> has the lowest expense ratio
                  ({funds.find((f) => f.id === bestTER)?.expenseRatio}%), which means more of your returns stay with you.
                </span>
              </li>
            )}
            {bestAUM && (
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  <strong>{funds.find((f) => f.id === bestAUM)?.name}</strong> has the largest AUM, indicating
                  strong investor confidence and liquidity.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
              <span>
                Remember: past performance does not guarantee future returns. Consider your risk profile,
                investment horizon, and financial goals before choosing.
              </span>
            </li>
          </ul>
        </div>

        {/* Close */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
