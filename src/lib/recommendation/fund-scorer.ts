import { HDFC_FUNDS, type Fund } from '@/data/hdfc-funds';
import type { SEBIRiskLevel } from '@/lib/advisor-engine';
import type { InvestorProfile, AllocationResult, ScoredFund } from './types';

const RISK_ORDER: SEBIRiskLevel[] = [
  'Low', 'Low to Moderate', 'Moderate', 'Moderately High', 'High', 'Very High',
];

function riskIndex(level: SEBIRiskLevel): number {
  return RISK_ORDER.indexOf(level);
}

function categorizeFund(fund: Fund): 'equity' | 'debt' | 'hybrid' | 'liquid' {
  if (fund.category === 'debt') {
    if (['Liquid', 'Overnight', 'Ultra Short Duration', 'Money Market'].includes(fund.subCategory)) {
      return 'liquid';
    }
    return 'debt';
  }
  if (fund.category === 'hybrid') return 'hybrid';
  // equity, index, solution, fof → equity bucket
  return 'equity';
}

// Weight configuration
const W_CATEGORY = 0.30;
const W_RISK = 0.20;
const W_TRACK = 0.20;
const W_COST = 0.15;
const W_GOAL = 0.15;

function scoreCategoryFit(fund: Fund, bucket: 'equity' | 'debt' | 'hybrid' | 'liquid'): number {
  const actual = categorizeFund(fund);
  return actual === bucket ? 1.0 : 0.0;
}

function scoreRiskAlignment(fund: Fund, profile: InvestorProfile): number {
  const diff = Math.abs(riskIndex(fund.riskLevel) - riskIndex(profile.riskLevel));
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.7;
  if (diff === 2) return 0.3;
  return 0.0;
}

function scoreTrackRecord(fund: Fund): number {
  // Prefer funds with longer track records and higher returns
  let score = 0;
  let weights = 0;

  if (fund.return5y != null) {
    score += fund.return5y * 0.4;
    weights += 0.4;
  }
  if (fund.return3y != null) {
    score += fund.return3y * 0.3;
    weights += 0.3;
  }
  if (fund.return10y != null) {
    score += fund.return10y * 0.2;
    weights += 0.2;
  }
  if (fund.return1y != null) {
    score += fund.return1y * 0.1;
    weights += 0.1;
  }

  if (weights === 0) return 0.1; // New fund with no track record

  const avgReturn = score / weights;
  // Normalize: 0% = 0, 25%+ = 1.0
  return Math.min(1.0, Math.max(0, avgReturn / 25));
}

function scoreCostEfficiency(fund: Fund): number {
  // Lower expense ratio = better. 0% = 1.0, 2% = 0.0
  return Math.max(0, 1.0 - fund.expenseRatio / 2.0);
}

function scoreGoalAlignment(
  fund: Fund,
  profile: InvestorProfile,
  hints: AllocationResult['hints']
): number {
  let bonus = 0;

  if (hints.boostTaxSaver && fund.subCategory === 'ELSS') {
    bonus += 0.5;
  }

  if (hints.incomeOriented && (
    fund.subCategory === 'Dividend Yield' ||
    fund.subCategory === 'Conservative Hybrid' ||
    fund.subCategory === 'Equity Savings'
  )) {
    bonus += 0.4;
  }

  if (hints.needsLiquidity && (
    fund.subCategory === 'Liquid' ||
    fund.subCategory === 'Low Duration' ||
    fund.subCategory === 'Ultra Short Duration' ||
    fund.subCategory === 'Overnight' ||
    fund.subCategory === 'Money Market'
  )) {
    bonus += 0.4;
  }

  if (hints.preferIndex && (
    fund.category === 'index' ||
    fund.subCategory.includes('Index')
  )) {
    bonus += 0.3;
  }

  if (hints.allowSmallCap && (
    fund.subCategory === 'Small Cap' ||
    fund.subCategory === 'Small Cap Index'
  )) {
    bonus += 0.3;
  }

  if (!hints.allowSmallCap && (
    fund.subCategory === 'Small Cap' ||
    fund.subCategory === 'Small Cap Index'
  )) {
    bonus -= 0.5;
  }

  // Penalize sectoral/thematic for non-advanced investors
  if (profile.experience !== 'advanced' && (
    fund.subCategory.startsWith('Sectoral') ||
    fund.subCategory.startsWith('Thematic')
  )) {
    bonus -= 0.3;
  }

  return Math.max(0, Math.min(1.0, 0.5 + bonus));
}

export function scoreAllFunds(
  profile: InvestorProfile,
  allocation: AllocationResult
): ScoredFund[] {
  const results: ScoredFund[] = [];

  for (const fund of HDFC_FUNDS) {
    const bucket = categorizeFund(fund);

    // Skip funds in buckets with 0% allocation
    const bucketAllocation =
      bucket === 'equity' ? allocation.equity :
      bucket === 'debt' ? allocation.debt :
      bucket === 'hybrid' ? allocation.hybrid :
      allocation.liquid;

    if (bucketAllocation === 0) continue;

    const catScore = scoreCategoryFit(fund, bucket);
    const riskScore = scoreRiskAlignment(fund, profile);
    const trackScore = scoreTrackRecord(fund);
    const costScore = scoreCostEfficiency(fund);
    const goalScore = scoreGoalAlignment(fund, profile, allocation.hints);

    const totalScore =
      W_CATEGORY * catScore +
      W_RISK * riskScore +
      W_TRACK * trackScore +
      W_COST * costScore +
      W_GOAL * goalScore;

    const reasons: string[] = [];
    if (catScore > 0.5) reasons.push('Category match');
    if (riskScore > 0.5) reasons.push('Risk aligned');
    if (trackScore > 0.5) reasons.push('Strong track record');
    if (costScore > 0.7) reasons.push('Cost efficient');
    if (goalScore > 0.6) reasons.push('Goal aligned');

    results.push({ fund, score: totalScore, bucket, reasons });
  }

  return results.sort((a, b) => b.score - a.score);
}
