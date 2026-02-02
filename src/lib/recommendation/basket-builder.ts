import type { InvestorProfile, AllocationResult, ScoredFund, FundPick } from './types';

interface BucketConfig {
  bucket: 'equity' | 'debt' | 'hybrid' | 'liquid';
  targetPct: number;
}

function assignRole(fund: ScoredFund, isCore: boolean): string {
  const prefix = isCore ? 'Core' : 'Satellite';
  const cat = fund.fund.subCategory;

  if (fund.bucket === 'liquid') return 'Liquidity';
  if (fund.bucket === 'debt') return `Stability - ${cat}`;

  if (fund.fund.category === 'index') return `${prefix} - Passive`;
  if (cat === 'ELSS') return `${prefix} - Tax Efficient`;
  if (cat === 'Balanced Advantage') return 'Tactical - Dynamic';
  if (cat === 'Large Cap') return `${prefix} - Stability`;
  if (cat === 'Flexi Cap' || cat === 'Multi Cap') return `${prefix} - Diversified`;
  if (cat === 'Mid Cap' || cat === 'Large & Mid Cap') return `${prefix} - Growth`;
  if (cat === 'Small Cap' || cat === 'Small Cap Index') return `${prefix} - High Growth`;
  if (cat === 'Equity Savings') return 'Moderate - Hybrid';
  if (cat === 'Conservative Hybrid') return 'Conservative - Hybrid';
  if (cat === 'Aggressive Hybrid') return `${prefix} - Hybrid`;
  if (cat.startsWith('Sectoral') || cat.startsWith('Thematic')) return `${prefix} - Thematic`;

  return `${prefix} - ${fund.bucket.charAt(0).toUpperCase() + fund.bucket.slice(1)}`;
}

function buildRationale(fund: ScoredFund, profile: InvestorProfile): string {
  const parts: string[] = [];
  const f = fund.fund;

  if (fund.reasons.includes('Strong track record') && f.return5y != null) {
    parts.push(`${f.return5y.toFixed(1)}% 5-year CAGR demonstrates consistent long-term performance.`);
  }
  if (fund.reasons.includes('Cost efficient')) {
    parts.push(`Low expense ratio of ${f.expenseRatio}% keeps more returns in your pocket.`);
  }
  if (fund.reasons.includes('Risk aligned')) {
    parts.push(`Risk level matches your ${profile.riskLevel} profile.`);
  }
  if (fund.reasons.includes('Goal aligned')) {
    if (f.subCategory === 'ELSS') {
      parts.push('Tax saving under Section 80C with equity growth potential.');
    } else if (f.subCategory === 'Dividend Yield') {
      parts.push('Focused on dividend-yielding companies for income generation.');
    } else if (f.subCategory === 'Liquid' || f.subCategory === 'Overnight') {
      parts.push('High liquidity for easy access when you need funds.');
    } else if (fund.fund.category === 'index') {
      parts.push('Simple, low-cost index approach ideal for building a core position.');
    }
  }

  if (parts.length === 0) {
    parts.push(`${f.subCategory} fund providing ${fund.bucket} exposure in your portfolio.`);
  }

  return parts.join(' ');
}

export function buildBasket(
  scoredFunds: ScoredFund[],
  allocation: AllocationResult,
  profile: InvestorProfile
): FundPick[] {
  const allBuckets: BucketConfig[] = [
    { bucket: 'equity', targetPct: allocation.equity },
    { bucket: 'debt', targetPct: allocation.debt },
    { bucket: 'hybrid', targetPct: allocation.hybrid },
    { bucket: 'liquid', targetPct: allocation.liquid },
  ];
  const buckets = allBuckets.filter((b) => b.targetPct > 0);

  // Determine total fund count based on profile complexity
  const isSimple = profile.experience === 'beginner' || profile.goal === 'preservation';
  const maxFunds = isSimple ? 5 : 8;
  const minAllocation = 5;

  const picks: FundPick[] = [];
  const usedSubCategories = new Set<string>();

  for (const { bucket, targetPct } of buckets) {
    const bucketFunds = scoredFunds.filter((f) => f.bucket === bucket);

    // Determine how many funds for this bucket proportionally
    let bucketCount = Math.max(1, Math.round((targetPct / 100) * maxFunds));

    // Ensure we don't exceed total
    const remaining = maxFunds - picks.length;
    bucketCount = Math.min(bucketCount, remaining, bucketFunds.length);
    if (bucketCount <= 0) continue;

    let selected = 0;
    for (const sf of bucketFunds) {
      if (selected >= bucketCount) break;

      // Diversification: max 1 fund per sub-category
      if (usedSubCategories.has(sf.fund.subCategory)) continue;

      usedSubCategories.add(sf.fund.subCategory);
      selected++;

      const isCore = selected <= Math.ceil(bucketCount * 0.65);

      picks.push({
        fund: sf.fund,
        allocation: 0, // assigned below
        role: assignRole(sf, isCore),
        rationale: buildRationale(sf, profile),
      });
    }
  }

  // Assign allocations proportionally within each bucket
  if (picks.length === 0) return [];

  // Group picks by bucket
  const bucketGroups = new Map<string, FundPick[]>();
  for (const pick of picks) {
    const bucket = categorizePick(pick);
    const group = bucketGroups.get(bucket) ?? [];
    group.push(pick);
    bucketGroups.set(bucket, group);
  }

  const bucketTargets: Record<string, number> = {
    equity: allocation.equity,
    debt: allocation.debt,
    hybrid: allocation.hybrid,
    liquid: allocation.liquid,
  };

  for (const [bucket, group] of bucketGroups) {
    const target = bucketTargets[bucket] ?? 0;
    // Distribute evenly within bucket, with first fund getting core share
    if (group.length === 1) {
      group[0].allocation = target;
    } else {
      const coreCount = Math.ceil(group.length * 0.65);
      const corePct = Math.round(target * 0.65);
      const satPct = target - corePct;

      for (let i = 0; i < group.length; i++) {
        if (i < coreCount) {
          group[i].allocation = Math.round(corePct / coreCount);
        } else {
          group[i].allocation = Math.round(satPct / (group.length - coreCount));
        }
      }
    }
  }

  // Enforce minimum allocation and normalize
  let total = picks.reduce((s, p) => s + p.allocation, 0);
  for (const pick of picks) {
    if (pick.allocation < minAllocation) {
      pick.allocation = minAllocation;
    }
  }
  total = picks.reduce((s, p) => s + p.allocation, 0);

  // Normalize to 100
  if (total !== 100 && picks.length > 0) {
    const diff = 100 - total;
    // Apply difference to highest-allocated fund
    const sorted = [...picks].sort((a, b) => b.allocation - a.allocation);
    sorted[0].allocation += diff;
  }

  return picks;
}

function categorizePick(pick: FundPick): string {
  const cat = pick.fund.category;
  const sub = pick.fund.subCategory;
  if (cat === 'debt' && ['Liquid', 'Overnight', 'Ultra Short Duration', 'Money Market'].includes(sub)) {
    return 'liquid';
  }
  if (cat === 'debt') return 'debt';
  if (cat === 'hybrid') return 'hybrid';
  return 'equity';
}
