import {
  type SEBIRiskLevel,
  RISK_ALLOCATIONS,
  recommendFundBasket as legacyRecommend,
} from '@/lib/advisor-engine';
import { buildInvestorProfile } from './investor-profile';
import { computeAllocation } from './allocation-strategy';
import { scoreAllFunds } from './fund-scorer';
import { buildBasket } from './basket-builder';
import type { PersonalizationSignals, RecommendationResult } from './types';

const GOAL_LABELS: Record<string, string> = {
  preservation: 'Capital Preservation',
  income: 'Regular Income',
  growth: 'Wealth Growth',
  'aggressive-growth': 'Aggressive Growth',
};

const HORIZON_LABELS: Record<string, string> = {
  short: 'Less than 3 years',
  medium: '3-5 years',
  long: '5-10 years',
  'very-long': '10+ years',
};

const WISDOM_NOTES: Record<SEBIRiskLevel, string> = {
  'Very High':
    '"The stock market is a device for transferring money from the impatient to the patient." — Warren Buffett. Your aggressive allocation will reward patience. Stay invested through market cycles, add via SIP, and let compounding do its magic over 10+ years.',
  High:
    '"Risk comes from not knowing what you are doing." — Warren Buffett. Your high-growth portfolio is well-diversified. The key is to stay disciplined with SIPs and avoid timing the market. Time in the market beats timing the market.',
  'Moderately High':
    '"Be fearful when others are greedy and greedy when others are fearful." — Warren Buffett. Your balanced-growth portfolio is designed for steady wealth creation. Rebalance annually and increase equity SIPs during market corrections.',
  Moderate:
    '"The first rule of investing is don\'t lose money. The second rule is don\'t forget rule one." — Warren Buffett. Your balanced portfolio protects capital while capturing reasonable growth. Perfect for those building long-term wealth carefully.',
  'Low to Moderate':
    '"Price is what you pay. Value is what you get." — Warren Buffett. Your conservative portfolio is designed for capital preservation with modest growth. Consider gradually increasing equity exposure as you build confidence.',
  Low:
    '"Do not save what is left after spending, but spend what is left after saving." — Warren Buffett. Your safe portfolio ensures capital protection. As you build your savings habit, consider gradually moving towards more growth-oriented investments.',
};

function buildProfileSummary(
  profile: ReturnType<typeof buildInvestorProfile>,
  alloc: ReturnType<typeof computeAllocation>
): string {
  const goalText = GOAL_LABELS[profile.goal] ?? profile.goal;
  const horizonText = HORIZON_LABELS[profile.horizon] ?? profile.horizon;

  const parts: string[] = [];

  parts.push(
    `Based on your ${profile.riskLevel} risk profile, we've built a personalized basket targeting ${goalText.toLowerCase()}.`
  );

  parts.push(
    `Your ${horizonText.toLowerCase()} investment horizon and ${profile.experience} experience level shaped the fund selection.`
  );

  parts.push(
    `The allocation is ${alloc.equity}% equity, ${alloc.debt}% debt, ${alloc.hybrid}% hybrid${alloc.liquid > 0 ? `, and ${alloc.liquid}% liquid` : ''}.`
  );

  if (profile.needsTaxSaving) {
    parts.push('We\'ve included tax-saving options aligned with your salaried income profile.');
  }

  if (profile.needsLiquidity) {
    parts.push('Liquidity has been prioritized given your needs for accessible funds.');
  }

  return parts.join(' ');
}

function buildPersonalization(
  profile: ReturnType<typeof buildInvestorProfile>
): PersonalizationSignals {
  const tags: string[] = [];

  tags.push(GOAL_LABELS[profile.goal] ?? profile.goal);
  tags.push(`Horizon: ${HORIZON_LABELS[profile.horizon] ?? profile.horizon}`);

  if (profile.needsTaxSaving) tags.push('Tax Saving Included');
  if (profile.needsLiquidity) tags.push('Liquidity Focused');
  if (profile.experience === 'beginner') tags.push('Beginner Friendly');

  return {
    goalLabel: GOAL_LABELS[profile.goal] ?? profile.goal,
    horizonLabel: HORIZON_LABELS[profile.horizon] ?? profile.horizon,
    tags,
  };
}

/**
 * Build a personalized fund recommendation from questionnaire answers.
 * Falls back to the legacy engine if no answers are provided.
 */
export function buildRecommendation(
  answers: Record<string, number>,
  overrideRiskLevel?: SEBIRiskLevel
): RecommendationResult {
  // Fallback: if no meaningful answers, use legacy engine
  if (!answers || Object.keys(answers).length === 0) {
    const level = overrideRiskLevel ?? 'Very High';
    const legacy = legacyRecommend(level);
    return {
      ...legacy,
      recommendations: legacy.recommendations.map((r) => ({
        fund: r.fund,
        allocation: r.allocation,
        role: r.role,
        rationale: r.rationale,
      })),
      personalization: {
        goalLabel: '',
        horizonLabel: '',
        tags: [],
      },
    };
  }

  const profile = buildInvestorProfile(answers, overrideRiskLevel);
  const allocation = computeAllocation(profile);
  const scoredFunds = scoreAllFunds(profile, allocation);
  const picks = buildBasket(scoredFunds, allocation, profile);

  const riskAlloc = RISK_ALLOCATIONS[profile.riskLevel];

  return {
    riskLevel: profile.riskLevel,
    assetAllocation: {
      equity: allocation.equity,
      debt: allocation.debt,
      hybrid: allocation.hybrid,
      description: riskAlloc.description,
      investorProfile: riskAlloc.investorProfile,
    },
    recommendations: picks,
    totalFunds: picks.length,
    wisdomNote: WISDOM_NOTES[profile.riskLevel],
    profileSummary: buildProfileSummary(profile, allocation),
    personalization: buildPersonalization(profile),
  };
}

// Re-export types for convenience
export type { RecommendationResult, PersonalizationSignals } from './types';
