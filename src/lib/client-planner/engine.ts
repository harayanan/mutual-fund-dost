/**
 * Client Planner — Advisor Engine
 *
 * Two-step AI pipeline:
 *   1. Transcribe audio → text
 *   2. Analyze transcript → generate investment plan
 *
 * The plan generation prompt is the core IP. It's designed to produce
 * hn-invest-quality output from messy, partial, Hindi-English conversations.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { HDFC_FUNDS } from '@/data/hdfc-funds';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Build fund reference once — used in the planning prompt
const FUND_REFERENCE = HDFC_FUNDS.map(f => {
  const returns = [
    f.return1y !== null ? `1Y: ${f.return1y}%` : null,
    f.return3y !== null ? `3Y: ${f.return3y}%` : null,
    f.return5y !== null ? `5Y: ${f.return5y}%` : null,
    f.return10y !== null ? `10Y: ${f.return10y}%` : null,
  ].filter(Boolean).join(', ');
  return `- ${f.name} [id: ${f.id}] | ${f.category}/${f.subCategory} | Risk: ${f.riskLevel} | AUM: ₹${f.aumCrores}Cr | Expense: ${f.expenseRatio}% | ${returns} | Min horizon: ${f.minHorizonMonths}mo | Suitable for: ${f.suitableFor}`;
}).join('\n');

/**
 * Step 1: Transcribe audio
 */
export async function transcribeAudio(
  audioBase64: string,
  mimeType: string
): Promise<string> {
  const result = await model.generateContent([
    {
      inlineData: {
        data: audioBase64,
        mimeType,
      },
    },
    `Transcribe this audio completely and accurately.

Rules:
- If multiple speakers, label them (Speaker 1, Speaker 2, etc.)
- Preserve the natural language — Hindi, English, Hinglish, whatever is spoken
- Include filler words and pauses only if they convey meaning (e.g., hesitation about risk)
- If numbers are spoken (income, amounts, age), write them as digits
- Output ONLY the transcript text, nothing else`,
  ]);

  return result.response.text();
}

/**
 * Step 2: Generate investment plan from transcript
 *
 * This is the core advisor engine. The prompt is designed to:
 * - Extract facts from messy, partial conversations
 * - Infer behavioral risk profile (not just a quiz score)
 * - Build a goal-aware asset allocation
 * - Select specific funds with reasoning
 * - Flag what's missing for next conversation
 * - All within SEBI compliance and Indian context
 */
export async function generatePlan(transcript: string): Promise<AdvisorPlan> {
  const prompt = `You are an expert Indian mutual fund advisor with 20 years of experience. You think like Warren Buffett (long-term, value-oriented) but operate in the Indian regulatory framework (SEBI guidelines).

A distributor just had a conversation with a client (or dictated notes about a client). Your job: extract every useful detail and build the best possible investment plan from whatever information is available.

## YOUR THINKING PROCESS

### 1. EXTRACT — Pull out every financial fact
Listen for: age, income, monthly expenses, dependents, existing investments (MFs, FDs, PPF, NPS, stocks, gold, real estate, insurance), goals (retirement, children's education, home, wealth building, tax saving), investment horizon, past investment experience, attitude toward risk/loss, tax regime (old vs new), job stability, spouse's income.

Don't invent facts. If something isn't mentioned, mark it unknown. Even a single fact ("he's 35 and earns well") is enough to start.

### 2. ASSESS RISK — Behavioral, not just numerical
SEBI defines 6 risk levels: Low, Low to Moderate, Moderate, Moderately High, High, Very High.

But real risk assessment goes deeper:
- What has this person actually done during market crashes? (Held? Sold? Bought more?)
- Do they check their portfolio daily or ignore it for months?
- Is their fear about losing capital, or about missing out on growth?
- How stable is their income? Salaried vs business vs freelance changes everything.
- Do they have dependents who rely on this money?

If the conversation reveals behavioral cues ("I panicked and sold in 2020", "I don't even check my MF app"), use those. They're more reliable than stated preferences.

If no behavioral data, infer from demographics:
- Young (< 30) + salaried + no dependents → likely High to Very High
- 35-45 + family + stable job → likely Moderately High to High
- Pre-retirement (50+) → likely Moderate to Low
- Adjust based on stated comfort with risk

### 3. ALLOCATE — Goal-aware asset allocation
Don't just map risk level to a fixed split. Consider:

**Time horizon drives equity exposure:**
- < 3 years: Max 20% equity (mostly debt/liquid)
- 3-5 years: 30-50% equity
- 5-10 years: 50-70% equity
- 10+ years: 70-90% equity

**Goal type matters:**
- Wealth building (long-term) → equity-heavy
- Children's education (known date) → equity now, glide to debt as date approaches
- Retirement → balanced, with income component
- Tax saving → ELSS is mandatory inclusion
- Emergency/short-term → liquid/ultra-short only

**Income stability affects debt allocation:**
- Stable salaried → can take more equity
- Business/freelance → needs higher debt/liquid buffer
- Single income family → more conservative than dual income

### 4. SELECT FUNDS — Specific, reasoned picks
Use ONLY from the HDFC fund universe below. For each fund:
- State why THIS fund for THIS client (not generic reasons)
- Assign a role: Core (stable, diversified, long-term) or Satellite (growth, thematic, tactical)
- Set a specific monthly SIP amount (minimum ₹500, multiples of ₹500)

**Fund selection principles:**
- Core allocation (60-70%): Flexi Cap, Large Cap, or Balanced Advantage for stability
- Growth satellite (20-30%): Mid Cap, Small Cap, or Sectoral for alpha
- Tactical (0-10%): ELSS for tax saving, or specific sector calls
- Debt component: Short Term Debt, Corporate Bond, or Liquid based on horizon
- If SIP capacity is small (< ₹10,000/mo): max 3-4 funds
- If SIP capacity is medium (₹10,000-30,000/mo): 4-6 funds
- If SIP capacity is large (> ₹30,000/mo): 6-8 funds
- Never recommend a fund whose risk level exceeds the client's assessed risk level by more than one step
- Prefer funds with 5Y+ track record and AUM > ₹5,000 Cr for core positions

### 5. BUILD SIP SCHEDULE — Actionable numbers
- Total monthly SIP must not exceed the client's investable surplus
- If surplus is unknown, estimate conservatively from income (20-30% of post-tax income)
- Round to multiples of ₹500
- State the total clearly with a sanity check

### 6. FLAG GAPS — What to ask next time
Be specific: "Ask about existing MF holdings to check for overlap" not "Need more information."
Prioritize: what would most change the plan if known?

## HDFC FUND UNIVERSE

${FUND_REFERENCE}

## TRANSCRIPT

${transcript}

## RESPONSE FORMAT

Return valid JSON (no markdown, no code blocks, just raw JSON):

{
  "client_snapshot": {
    "facts_extracted": {
      "age": "value or null",
      "income": "value or null",
      "monthly_expenses": "value or null",
      "dependents": "value or null",
      "existing_investments": "value or null",
      "goals": ["goal1", "goal2"],
      "investment_horizon": "value or null",
      "risk_attitude": "value or null",
      "tax_regime": "value or null",
      "sip_capacity": "value or null",
      "occupation": "value or null",
      "other": ["any other relevant facts"]
    },
    "key_quotes": ["verbatim quotes that reveal financial psychology or important facts"],
    "profile_completeness": "percentage estimate of how much we know vs need to know"
  },
  "risk_assessment": {
    "sebi_level": "one of the 6 SEBI levels",
    "confidence": "high/medium/low — how confident are we in this assessment",
    "behavioral_narrative": "2-4 sentences. Not 'client has moderate risk tolerance.' Instead: 'Based on 15 years of salaried employment and mention of not checking portfolio frequently, this client likely has a set-and-forget temperament. The focus on children's education suggests a specific timeline that constrains risk-taking. Recommend Moderately High with a time-bound glide path.'",
    "assumptions_made": ["list any assumptions if data was sparse"]
  },
  "asset_allocation": {
    "equity": 0,
    "debt": 0,
    "hybrid": 0,
    "reasoning": "2-3 sentences explaining why this split for this person, referencing their specific situation"
  },
  "fund_recommendations": [
    {
      "fund_id": "exact id from fund list above",
      "fund_name": "exact name",
      "category": "equity/debt/hybrid/index/solution",
      "sub_category": "Flexi Cap/Mid Cap/etc",
      "role": "core/satellite",
      "allocation_percent": 0,
      "monthly_sip": 0,
      "rationale": "1-2 sentences: why THIS fund for THIS client. Reference their specific goals, risk profile, or constraints. Not generic."
    }
  ],
  "sip_summary": {
    "total_monthly": 0,
    "sanity_check": "statement comparing total SIP to income/surplus — is this sustainable?",
    "step_up_suggestion": "optional: suggest annual SIP increase if appropriate"
  },
  "gaps_for_next_conversation": [
    {
      "area": "what's missing",
      "priority": "high/medium/low",
      "question": "exact question the distributor should ask"
    }
  ],
  "advisor_notes": "1-2 sentences of strategic advice for the distributor — not for the client. Things like 'This client seems risk-averse despite being young — don't push aggressive funds, let them build confidence with balanced funds first. Revisit in 6 months.'"
}

RULES:
- All allocation_percent values MUST sum to exactly 100
- Equity + Debt + Hybrid MUST sum to exactly 100
- Every fund_id MUST match an id from the fund list above
- If transcript has almost no financial info, still produce a plan with stated assumptions
- Minimum 3 funds, maximum 8 funds
- Every SIP amount must be ≥ ₹500 and a multiple of ₹500
- SEBI disclaimer: Mutual fund investments are subject to market risks`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON — handle possible markdown wrapping
  let jsonStr = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim()) as AdvisorPlan;

  // Validate fund IDs exist
  const validFundIds = new Set(HDFC_FUNDS.map(f => f.id));
  parsed.fund_recommendations = parsed.fund_recommendations.filter(r => {
    if (!validFundIds.has(r.fund_id)) {
      console.warn(`Plan referenced unknown fund: ${r.fund_id} (${r.fund_name})`);
      return false;
    }
    return true;
  });

  return parsed;
}

// --- Types ---

export interface AdvisorPlan {
  client_snapshot: {
    facts_extracted: {
      age: string | null;
      income: string | null;
      monthly_expenses: string | null;
      dependents: string | null;
      existing_investments: string | null;
      goals: string[];
      investment_horizon: string | null;
      risk_attitude: string | null;
      tax_regime: string | null;
      sip_capacity: string | null;
      occupation: string | null;
      other: string[];
    };
    key_quotes: string[];
    profile_completeness: string;
  };
  risk_assessment: {
    sebi_level: string;
    confidence: string;
    behavioral_narrative: string;
    assumptions_made: string[];
  };
  asset_allocation: {
    equity: number;
    debt: number;
    hybrid: number;
    reasoning: string;
  };
  fund_recommendations: {
    fund_id: string;
    fund_name: string;
    category: string;
    sub_category: string;
    role: 'core' | 'satellite';
    allocation_percent: number;
    monthly_sip: number;
    rationale: string;
  }[];
  sip_summary: {
    total_monthly: number;
    sanity_check: string;
    step_up_suggestion?: string;
  };
  gaps_for_next_conversation: {
    area: string;
    priority: 'high' | 'medium' | 'low';
    question: string;
  }[];
  advisor_notes: string;
}
