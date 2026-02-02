import { scoreToRiskLevel, type SEBIRiskLevel } from '@/lib/advisor-engine';
import type {
  InvestorProfile,
  AgeGroup,
  Horizon,
  StabilityLevel,
  ToleranceLevel,
  Goal,
  Experience,
} from './types';

function mapAge(score: number): AgeGroup {
  if (score >= 5) return 'young';
  if (score >= 3) return 'mid';
  if (score >= 2) return 'pre-retirement';
  return 'retired';
}

function mapHorizon(score: number): Horizon {
  if (score <= 1) return 'short';
  if (score <= 2) return 'medium';
  if (score <= 4) return 'long';
  return 'very-long';
}

function mapStability(score: number): StabilityLevel {
  if (score <= 1) return 'low';
  if (score <= 2) return 'medium';
  return 'high';
}

function mapTolerance(score: number): ToleranceLevel {
  if (score <= 1) return 'low';
  if (score <= 2) return 'medium';
  return 'high';
}

function mapGoal(score: number): Goal {
  if (score <= 1) return 'preservation';
  if (score <= 2) return 'income';
  if (score <= 3) return 'growth';
  return 'aggressive-growth';
}

function mapExperience(score: number): Experience {
  if (score <= 1) return 'beginner';
  if (score <= 2) return 'beginner';
  if (score <= 3) return 'intermediate';
  return 'advanced';
}

export function buildInvestorProfile(
  answers: Record<string, number>,
  overrideRiskLevel?: SEBIRiskLevel
): InvestorProfile {
  const totalScore = Object.values(answers).reduce((sum, s) => sum + s, 0);
  const riskLevel = overrideRiskLevel ?? scoreToRiskLevel(totalScore);

  const ageGroup = mapAge(answers.age ?? 3);
  const horizon = mapHorizon(answers.horizon ?? 3);
  const incomeStability = mapStability(answers.income_stability ?? 3);
  const lossTolerance = mapTolerance(answers.loss_tolerance ?? 3);
  const goal = mapGoal(answers.goal ?? 3);
  const experience = mapExperience(answers.experience ?? 3);

  // Derived signals
  const needsTaxSaving =
    ageGroup === 'young' && (answers.income_stability ?? 0) >= 4;
  const needsLiquidity =
    horizon === 'short' || incomeStability === 'low';

  return {
    riskLevel,
    ageGroup,
    horizon,
    incomeStability,
    lossTolerance,
    goal,
    experience,
    needsTaxSaving,
    needsLiquidity,
  };
}
