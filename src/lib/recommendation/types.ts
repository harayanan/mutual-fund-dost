import { Fund } from '@/data/hdfc-funds';
import { SEBIRiskLevel } from '@/lib/advisor-engine';

export type AgeGroup = 'young' | 'mid' | 'pre-retirement' | 'retired';
export type Horizon = 'short' | 'medium' | 'long' | 'very-long';
export type StabilityLevel = 'low' | 'medium' | 'high';
export type ToleranceLevel = 'low' | 'medium' | 'high';
export type Goal = 'preservation' | 'income' | 'growth' | 'aggressive-growth';
export type Experience = 'beginner' | 'intermediate' | 'advanced';

export interface InvestorProfile {
  riskLevel: SEBIRiskLevel;
  ageGroup: AgeGroup;
  horizon: Horizon;
  incomeStability: StabilityLevel;
  lossTolerance: ToleranceLevel;
  goal: Goal;
  experience: Experience;
  needsTaxSaving: boolean;
  needsLiquidity: boolean;
}

export interface AllocationResult {
  equity: number;
  debt: number;
  hybrid: number;
  liquid: number;
  hints: AllocationHints;
}

export interface AllocationHints {
  allowSmallCap: boolean;
  preferIndex: boolean;
  boostTaxSaver: boolean;
  needsLiquidity: boolean;
  incomeOriented: boolean;
}

export interface ScoredFund {
  fund: Fund;
  score: number;
  bucket: 'equity' | 'debt' | 'hybrid' | 'liquid';
  reasons: string[];
}

export interface FundPick {
  fund: Fund;
  allocation: number;
  role: string;
  rationale: string;
}

export interface PersonalizationSignals {
  goalLabel: string;
  horizonLabel: string;
  tags: string[];
}

export interface RecommendationResult {
  riskLevel: SEBIRiskLevel;
  assetAllocation: {
    equity: number;
    debt: number;
    hybrid: number;
    description: string;
    investorProfile: string;
  };
  recommendations: FundPick[];
  totalFunds: number;
  wisdomNote: string;
  profileSummary: string;
  personalization: PersonalizationSignals;
}
