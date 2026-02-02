import type { SEBIRiskLevel } from '@/lib/advisor-engine';
import type { InvestorProfile, AllocationResult, AllocationHints } from './types';

// Base allocations by risk level (equity, debt, hybrid, liquid)
const BASE_ALLOCATIONS: Record<SEBIRiskLevel, [number, number, number, number]> = {
  'Low':              [0,  75, 15, 10],
  'Low to Moderate':  [15, 55, 20, 10],
  'Moderate':         [35, 35, 25, 5],
  'Moderately High':  [55, 20, 20, 5],
  'High':             [75, 10, 15, 0],
  'Very High':        [90, 5,  5,  0],
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function computeAllocation(profile: InvestorProfile): AllocationResult {
  const [baseEq, baseDebt, baseHybrid, baseLiquid] = BASE_ALLOCATIONS[profile.riskLevel];

  let equity = baseEq;
  let debt = baseDebt;
  let hybrid = baseHybrid;
  let liquid = baseLiquid;

  // Short horizon → shift equity to debt
  if (profile.horizon === 'short') {
    const shift = Math.min(equity, 10);
    equity -= shift;
    debt += shift;
  } else if (profile.horizon === 'medium') {
    const shift = Math.min(equity, 5);
    equity -= shift;
    debt += shift;
  }

  // Goal=income → boost hybrid/debt
  if (profile.goal === 'income') {
    const shift = Math.min(equity, 5);
    equity -= shift;
    hybrid += shift;
  }

  // Goal=preservation → cap equity
  if (profile.goal === 'preservation') {
    const cap = 20;
    if (equity > cap) {
      const excess = equity - cap;
      equity = cap;
      debt += excess;
    }
  }

  // Low income stability → increase liquid
  if (profile.incomeStability === 'low') {
    const shift = Math.min(debt, 5);
    debt -= shift;
    liquid += shift;
  }

  // Pre-retirement → floor on debt
  if (profile.ageGroup === 'pre-retirement' || profile.ageGroup === 'retired') {
    const debtFloor = 25;
    if (debt < debtFloor) {
      const needed = debtFloor - debt;
      const fromEquity = Math.min(equity, needed);
      equity -= fromEquity;
      debt += fromEquity;
    }
  }

  // Normalize to 100
  const total = equity + debt + hybrid + liquid;
  if (total !== 100) {
    const scale = 100 / total;
    equity = Math.round(equity * scale);
    debt = Math.round(debt * scale);
    hybrid = Math.round(hybrid * scale);
    liquid = 100 - equity - debt - hybrid;
  }

  equity = clamp(equity, 0, 100);
  debt = clamp(debt, 0, 100);
  hybrid = clamp(hybrid, 0, 100);
  liquid = clamp(liquid, 0, 100);

  const hints: AllocationHints = {
    allowSmallCap:
      (profile.ageGroup === 'young' && profile.goal === 'aggressive-growth') ||
      profile.riskLevel === 'Very High',
    preferIndex:
      profile.experience === 'beginner',
    boostTaxSaver:
      profile.needsTaxSaving,
    needsLiquidity:
      profile.needsLiquidity,
    incomeOriented:
      profile.goal === 'income',
  };

  return { equity, debt, hybrid, liquid, hints };
}
