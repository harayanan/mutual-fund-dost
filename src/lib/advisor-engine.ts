import { Fund, HDFC_FUNDS } from '@/data/hdfc-funds';

// ============ SEBI Risk Levels ============
export type SEBIRiskLevel =
  | 'Low'
  | 'Low to Moderate'
  | 'Moderate'
  | 'Moderately High'
  | 'High'
  | 'Very High';

export const SEBI_RISK_LEVELS: SEBIRiskLevel[] = [
  'Low',
  'Low to Moderate',
  'Moderate',
  'Moderately High',
  'High',
  'Very High',
];

// ============ Risk Profile Questionnaire ============
export interface RiskQuestion {
  id: string;
  question: string;
  options: { label: string; score: number }[];
}

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'age',
    question: 'What is your age group?',
    options: [
      { label: 'Under 25', score: 5 },
      { label: '25-35', score: 4 },
      { label: '36-45', score: 3 },
      { label: '46-55', score: 2 },
      { label: 'Above 55', score: 1 },
    ],
  },
  {
    id: 'horizon',
    question: 'What is your investment horizon?',
    options: [
      { label: 'Less than 1 year', score: 1 },
      { label: '1-3 years', score: 2 },
      { label: '3-5 years', score: 3 },
      { label: '5-10 years', score: 4 },
      { label: 'More than 10 years', score: 5 },
    ],
  },
  {
    id: 'income_stability',
    question: 'How stable is your income?',
    options: [
      { label: 'Irregular / Freelance', score: 2 },
      { label: 'Stable salaried', score: 4 },
      { label: 'Business owner with steady revenue', score: 3 },
      { label: 'Retired with pension', score: 1 },
    ],
  },
  {
    id: 'loss_tolerance',
    question: 'If your investment drops 20% in a month, what would you do?',
    options: [
      { label: 'Sell everything immediately', score: 1 },
      { label: 'Sell some to limit losses', score: 2 },
      { label: 'Hold and wait for recovery', score: 4 },
      { label: 'Invest more at lower prices', score: 5 },
    ],
  },
  {
    id: 'goal',
    question: 'What is your primary investment goal?',
    options: [
      { label: 'Preserve my capital', score: 1 },
      { label: 'Generate regular income', score: 2 },
      { label: 'Grow wealth steadily', score: 3 },
      { label: 'Maximize long-term returns', score: 5 },
    ],
  },
  {
    id: 'experience',
    question: 'What is your investment experience?',
    options: [
      { label: 'Never invested before', score: 1 },
      { label: 'Only fixed deposits / savings', score: 2 },
      { label: 'Some mutual funds / stocks', score: 3 },
      { label: 'Active investor (5+ years)', score: 5 },
    ],
  },
];

// Map total score to SEBI risk level
export function scoreToRiskLevel(totalScore: number): SEBIRiskLevel {
  if (totalScore <= 8) return 'Low';
  if (totalScore <= 12) return 'Low to Moderate';
  if (totalScore <= 16) return 'Moderate';
  if (totalScore <= 20) return 'Moderately High';
  if (totalScore <= 24) return 'High';
  return 'Very High';
}

// ============ Asset Allocation by Risk Level ============
export interface AssetAllocation {
  equity: number;
  debt: number;
  hybrid: number;
  description: string;
  investorProfile: string;
}

export const RISK_ALLOCATIONS: Record<SEBIRiskLevel, AssetAllocation> = {
  Low: {
    equity: 0,
    debt: 85,
    hybrid: 15,
    description:
      'Capital preservation is the priority. Your portfolio is built around stable debt instruments with minimal market risk.',
    investorProfile:
      'Conservative investor seeking safety of capital. You prefer certainty over high returns and want to avoid any significant portfolio fluctuations.',
  },
  'Low to Moderate': {
    equity: 15,
    debt: 65,
    hybrid: 20,
    description:
      'Primarily debt-focused with a small equity allocation for modest growth. A careful balance of safety and returns.',
    investorProfile:
      'Cautious investor who wants slightly better returns than fixed deposits but with limited risk exposure. Ideal for parking emergency funds or short-term goals.',
  },
  Moderate: {
    equity: 35,
    debt: 40,
    hybrid: 25,
    description:
      'Balanced between growth and stability. Equity provides upside while debt anchors the portfolio.',
    investorProfile:
      'Balanced investor comfortable with moderate market fluctuations in exchange for better returns. Typically someone with a 3-5 year horizon.',
  },
  'Moderately High': {
    equity: 55,
    debt: 25,
    hybrid: 20,
    description:
      'Growth-oriented with meaningful equity exposure. Debt provides a cushion during market downturns.',
    investorProfile:
      'Growth-focused investor with a medium-term horizon (5+ years). You understand that markets can be volatile but believe in the long-term growth story of India.',
  },
  High: {
    equity: 75,
    debt: 10,
    hybrid: 15,
    description:
      'Aggressively tilted towards equity for maximum capital appreciation. Minimal debt allocation for tactical purposes.',
    investorProfile:
      'Aggressive investor with a long-term horizon (7+ years). You are comfortable with significant short-term volatility and are focused on wealth creation.',
  },
  'Very High': {
    equity: 90,
    debt: 5,
    hybrid: 5,
    description:
      'Maximum equity exposure for those seeking the highest possible long-term returns. As Warren Buffett says, "The stock market is a device for transferring money from the impatient to the patient."',
    investorProfile:
      'Highly aggressive investor with a very long-term horizon (10+ years). You have the temperament to stay invested through market cycles and focus purely on long-term wealth creation.',
  },
};

// ============ Fund Basket Recommendation ============
export interface FundRecommendation {
  fund: Fund;
  allocation: number; // percentage
  role: string; // e.g., "Core - Diversified", "Satellite - Growth"
  rationale: string;
}

export interface FundBasket {
  riskLevel: SEBIRiskLevel;
  assetAllocation: AssetAllocation;
  recommendations: FundRecommendation[];
  totalFunds: number;
  wisdomNote: string;
}

/**
 * Core fund selection logic following long-term wealth creation principles:
 *
 * 1. DIVERSIFICATION: Spread across fund categories
 * 2. CORE + SATELLITE: 70% in diversified funds, 30% in focused/thematic
 * 3. LONG-TERM TRACK RECORD: Prefer funds with 5yr+ history
 * 4. COST EFFICIENCY: Consider expense ratios
 * 5. CONSISTENCY: Prefer funds with consistent multi-year performance
 */
export function recommendFundBasket(riskLevel: SEBIRiskLevel): FundBasket {
  const allocation = RISK_ALLOCATIONS[riskLevel];
  const recommendations: FundRecommendation[] = [];

  switch (riskLevel) {
    case 'Very High':
      recommendations.push(
        {
          fund: findFund('hdfc-flexi-cap')!,
          allocation: 25,
          role: 'Core - Diversified',
          rationale:
            'Flagship diversified fund with 30-year track record. Invests across market caps, providing the flexibility to navigate different market conditions. A true all-weather fund.',
        },
        {
          fund: findFund('hdfc-mid-cap')!,
          allocation: 20,
          role: 'Core - Growth',
          rationale:
            "India's largest mid-cap fund with a stellar long-term track record. Mid-caps offer the sweet spot of growth potential with reasonable liquidity.",
        },
        {
          fund: findFund('hdfc-small-cap')!,
          allocation: 15,
          role: 'Satellite - High Growth',
          rationale:
            'Small caps provide the highest long-term return potential. This fund is well-managed with disciplined stock selection. Requires patience through volatility.',
        },
        {
          fund: findFund('hdfc-elss')!,
          allocation: 10,
          role: 'Core - Tax Efficient',
          rationale:
            'Tax saving under Section 80C with equity growth. The 3-year lock-in actually enforces the discipline of long-term investing — a feature, not a bug.',
        },
        {
          fund: findFund('hdfc-large-cap')!,
          allocation: 10,
          role: 'Core - Stability',
          rationale:
            'Large-cap exposure provides stability and lower volatility. These are market leaders with strong moats — businesses that Buffett would call "wonderful companies."',
        },
        {
          fund: findFund('hdfc-balanced-advantage')!,
          allocation: 10,
          role: 'Tactical - Dynamic',
          rationale:
            'Dynamic asset allocation automatically reduces equity when markets are expensive and increases when cheap. Built-in discipline that removes emotion from investing.',
        },
        {
          fund: findFund('hdfc-nifty-50-index')!,
          allocation: 5,
          role: 'Core - Passive',
          rationale:
            'Low-cost index fund tracking the Nifty 50. As Buffett advises, a low-cost index fund is the most sensible equity investment for most people.',
        },
        {
          fund: findFund('hdfc-corporate-bond')!,
          allocation: 5,
          role: 'Stability - Debt',
          rationale:
            'Small debt allocation for rebalancing and stability. High-quality corporate bonds provide steady income with capital protection.',
        }
      );
      break;

    case 'High':
      recommendations.push(
        {
          fund: findFund('hdfc-flexi-cap')!,
          allocation: 25,
          role: 'Core - Diversified',
          rationale:
            'Flagship all-cap fund providing diversification across market capitalizations with a proven long-term track record.',
        },
        {
          fund: findFund('hdfc-mid-cap')!,
          allocation: 15,
          role: 'Core - Growth',
          rationale:
            'Leading mid-cap fund for growth. Mid-caps balance growth potential with manageable risk for the aggressive investor.',
        },
        {
          fund: findFund('hdfc-large-cap')!,
          allocation: 15,
          role: 'Core - Stability',
          rationale:
            'Large-cap anchor for portfolio stability. Blue-chip companies with strong competitive advantages.',
        },
        {
          fund: findFund('hdfc-balanced-advantage')!,
          allocation: 15,
          role: 'Tactical - Dynamic',
          rationale:
            'Dynamic allocation acts as an automatic risk manager, reducing equity exposure when valuations are stretched.',
        },
        {
          fund: findFund('hdfc-elss')!,
          allocation: 10,
          role: 'Core - Tax Efficient',
          rationale:
            'Tax savings with equity growth. Smart way to invest in equities while optimizing tax efficiency.',
        },
        {
          fund: findFund('hdfc-nifty-50-index')!,
          allocation: 5,
          role: 'Core - Passive',
          rationale:
            'Low-cost passive allocation ensuring you capture the broad market returns at minimal cost.',
        },
        {
          fund: findFund('hdfc-short-term-debt')!,
          allocation: 10,
          role: 'Stability - Debt',
          rationale:
            'Debt anchor for the portfolio providing steady income and rebalancing opportunities during market corrections.',
        },
        {
          fund: findFund('hdfc-corporate-bond')!,
          allocation: 5,
          role: 'Stability - Debt',
          rationale:
            'Quality corporate bonds for additional debt exposure with reasonable yield enhancement over government securities.',
        }
      );
      break;

    case 'Moderately High':
      recommendations.push(
        {
          fund: findFund('hdfc-flexi-cap')!,
          allocation: 20,
          role: 'Core - Diversified',
          rationale:
            'Diversified equity exposure across market caps. Provides the flexibility to adapt to market conditions.',
        },
        {
          fund: findFund('hdfc-large-cap')!,
          allocation: 15,
          role: 'Core - Stability',
          rationale:
            'Large-cap foundation for the equity portion. Lower volatility than mid/small caps while still participating in equity growth.',
        },
        {
          fund: findFund('hdfc-balanced-advantage')!,
          allocation: 20,
          role: 'Core - Dynamic',
          rationale:
            'Dynamic asset allocation is perfect at this risk level — it automatically adjusts equity-debt mix based on market valuations.',
        },
        {
          fund: findFund('hdfc-equity-savings')!,
          allocation: 10,
          role: 'Moderate - Hybrid',
          rationale:
            'Blends equity, arbitrage, and debt for reduced volatility. Good for investors transitioning from fixed deposits to market-linked products.',
        },
        {
          fund: findFund('hdfc-short-term-debt')!,
          allocation: 15,
          role: 'Stability - Debt',
          rationale:
            'Short duration debt provides stability and liquidity. Acts as the ballast in your portfolio during market turbulence.',
        },
        {
          fund: findFund('hdfc-corporate-bond')!,
          allocation: 10,
          role: 'Stability - Debt',
          rationale:
            'High-quality corporate bonds for enhanced yield over government securities with controlled credit risk.',
        },
        {
          fund: findFund('hdfc-floating-rate')!,
          allocation: 10,
          role: 'Stability - Debt',
          rationale:
            'Floating rate instruments protect against interest rate rises. Smart debt allocation for the current rate environment.',
        }
      );
      break;

    case 'Moderate':
      recommendations.push(
        {
          fund: findFund('hdfc-balanced-advantage')!,
          allocation: 20,
          role: 'Core - Dynamic',
          rationale:
            'Dynamic allocation is ideal for moderate risk — it gives equity exposure while automatically managing downside.',
        },
        {
          fund: findFund('hdfc-large-cap')!,
          allocation: 10,
          role: 'Core - Equity',
          rationale:
            'Conservative equity exposure through large-cap blue chips. These companies have survived multiple market cycles.',
        },
        {
          fund: findFund('hdfc-equity-savings')!,
          allocation: 10,
          role: 'Moderate - Hybrid',
          rationale:
            'Equity-arbitrage-debt blend provides equity taxation benefits with significantly lower volatility than pure equity.',
        },
        {
          fund: findFund('hdfc-hybrid-debt')!,
          allocation: 15,
          role: 'Conservative - Hybrid',
          rationale:
            'Predominantly debt with modest equity. Aims to beat fixed deposit returns while limiting downside risk.',
        },
        {
          fund: findFund('hdfc-short-term-debt')!,
          allocation: 15,
          role: 'Stability - Debt',
          rationale:
            'Short duration debt for stability. Lower interest rate risk compared to longer duration funds.',
        },
        {
          fund: findFund('hdfc-corporate-bond')!,
          allocation: 15,
          role: 'Stability - Debt',
          rationale:
            'Quality corporate bonds as a core debt holding. AA+ rated instruments provide safety with yield.',
        },
        {
          fund: findFund('hdfc-floating-rate')!,
          allocation: 15,
          role: 'Stability - Debt',
          rationale:
            'Floating rate debt adapts to changing interest rate scenarios, providing natural protection.',
        }
      );
      break;

    case 'Low to Moderate':
      recommendations.push(
        {
          fund: findFund('hdfc-equity-savings')!,
          allocation: 10,
          role: 'Growth - Conservative',
          rationale:
            'Minimal equity exposure through an equity savings structure. Tax-efficient way to get some market participation.',
        },
        {
          fund: findFund('hdfc-hybrid-debt')!,
          allocation: 15,
          role: 'Conservative - Hybrid',
          rationale:
            'Debt-heavy hybrid for capital protection with modest growth. Perfect stepping stone from pure debt.',
        },
        {
          fund: findFund('hdfc-short-term-debt')!,
          allocation: 20,
          role: 'Core - Debt',
          rationale:
            'Core debt holding with controlled duration risk. Steady returns exceeding savings account rates.',
        },
        {
          fund: findFund('hdfc-corporate-bond')!,
          allocation: 20,
          role: 'Core - Debt',
          rationale:
            'High-quality corporate bonds for yield enhancement. Safety-focused with AA+ rated portfolio.',
        },
        {
          fund: findFund('hdfc-banking-psu-debt')!,
          allocation: 15,
          role: 'Stability - Debt',
          rationale:
            'Banking and PSU paper offers sovereign-like safety. Ideal for conservative investors seeking debt returns.',
        },
        {
          fund: findFund('hdfc-floating-rate')!,
          allocation: 10,
          role: 'Stability - Debt',
          rationale:
            'Floating rate exposure for interest rate protection. Adaptable to changing monetary policy.',
        },
        {
          fund: findFund('hdfc-arbitrage')!,
          allocation: 10,
          role: 'Low Risk - Tax Efficient',
          rationale:
            'Tax-efficient alternative to liquid funds. Equity taxation benefits with debt-like returns and minimal risk.',
        }
      );
      break;

    case 'Low':
      recommendations.push(
        {
          fund: findFund('hdfc-liquid')!,
          allocation: 20,
          role: 'Core - Liquidity',
          rationale:
            'Highest liquidity with next-day redemption. Park your emergency fund here for instant access with better returns than savings accounts.',
        },
        {
          fund: findFund('hdfc-low-duration')!,
          allocation: 20,
          role: 'Core - Short Term',
          rationale:
            'Low duration instruments for capital safety. Marginally better returns than liquid fund with minimal additional risk.',
        },
        {
          fund: findFund('hdfc-short-term-debt')!,
          allocation: 15,
          role: 'Core - Debt',
          rationale:
            'Short duration debt for steady accrual income. Suitable for 6-12 month investment horizon.',
        },
        {
          fund: findFund('hdfc-corporate-bond')!,
          allocation: 15,
          role: 'Core - Debt',
          rationale:
            'Quality corporate bonds for slightly higher yields while maintaining capital safety.',
        },
        {
          fund: findFund('hdfc-banking-psu-debt')!,
          allocation: 15,
          role: 'Stability - Debt',
          rationale:
            'Near-sovereign safety with banking and PSU debt instruments. Maximum safety for the conservative investor.',
        },
        {
          fund: findFund('hdfc-arbitrage')!,
          allocation: 15,
          role: 'Low Risk - Tax Efficient',
          rationale:
            'Tax-efficient returns with virtually no market risk. Ideal for parking funds with equity taxation advantages.',
        }
      );
      break;
  }

  const wisdomNotes: Record<SEBIRiskLevel, string> = {
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

  return {
    riskLevel,
    assetAllocation: allocation,
    recommendations: recommendations.filter((r) => r.fund != null),
    totalFunds: recommendations.filter((r) => r.fund != null).length,
    wisdomNote: wisdomNotes[riskLevel],
  };
}

function findFund(id: string): Fund | undefined {
  return HDFC_FUNDS.find((f) => f.id === id);
}

// ============ Risk Level Descriptions for UI ============
export const RISK_LEVEL_COLORS: Record<SEBIRiskLevel, string> = {
  Low: '#22c55e',
  'Low to Moderate': '#84cc16',
  Moderate: '#eab308',
  'Moderately High': '#f97316',
  High: '#ef4444',
  'Very High': '#dc2626',
};

export const RISK_LEVEL_DESCRIPTIONS: Record<SEBIRiskLevel, string> = {
  Low: 'Principal at low risk',
  'Low to Moderate': 'Principal at low to moderate risk',
  Moderate: 'Principal at moderate risk',
  'Moderately High': 'Principal at moderately high risk',
  High: 'Principal at high risk',
  'Very High': 'Principal at very high risk',
};
