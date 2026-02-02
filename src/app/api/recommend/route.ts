import { NextRequest, NextResponse } from 'next/server';
import {
  SEBIRiskLevel,
  SEBI_RISK_LEVELS,
  scoreToRiskLevel,
} from '@/lib/advisor-engine';
import { buildRecommendation } from '@/lib/recommendation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { riskLevel, answers } = body as {
      riskLevel?: SEBIRiskLevel;
      answers?: Record<string, number>;
    };

    let resolvedRiskLevel: SEBIRiskLevel | undefined;

    if (riskLevel && SEBI_RISK_LEVELS.includes(riskLevel)) {
      resolvedRiskLevel = riskLevel;
    } else if (answers && Object.keys(answers).length > 0) {
      const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
      resolvedRiskLevel = scoreToRiskLevel(totalScore);
    } else {
      resolvedRiskLevel = 'Very High';
    }

    const basket = buildRecommendation(answers ?? {}, resolvedRiskLevel);

    return NextResponse.json(basket);
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
