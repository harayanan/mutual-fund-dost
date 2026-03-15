import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HDFC_FUNDS } from '@/data/hdfc-funds';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const FUND_IDS = HDFC_FUNDS.map(f => `${f.name} [${f.id}] (${f.subCategory}, ${f.riskLevel})`).join('\n');

export async function POST(request: NextRequest) {
  try {
    const { message, currentPlan, chatHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const historyText = (chatHistory || [])
      .map((m: { role: string; text: string }) => `${m.role}: ${m.text}`)
      .join('\n');

    const prompt = `You are an expert Indian mutual fund advisor embedded in a distributor's planning tool. The distributor is refining an investment plan for their client through conversation with you.

CURRENT PLAN:
${currentPlan ? JSON.stringify(currentPlan, null, 2) : 'No plan yet — generate one based on the conversation.'}

CONVERSATION SO FAR:
${historyText}

DISTRIBUTOR SAYS: ${message}

AVAILABLE HDFC FUNDS:
${FUND_IDS}

INSTRUCTIONS:
- Respond naturally as an expert advisor would
- If the distributor provides new client info, acknowledge it and explain how it changes the plan
- If they ask to swap funds, adjust allocations, or change strategy, do it with reasoning
- If they ask "what if" questions, analyze the scenario
- Keep responses concise (2-4 paragraphs max)
- If the change warrants an updated plan, include an updated plan in your response

RESPONSE FORMAT — return valid JSON (no markdown wrapping):
{
  "reply": "Your conversational response to the distributor. Natural language, not robotic.",
  "updated_plan": null or { the full updated plan object in the same schema as currentPlan if changes were made }
}

If no plan changes are needed (e.g., distributor asked a question), set updated_plan to null.
If a plan update is warranted, return the COMPLETE updated plan (not a partial diff). The plan schema:
{
  "client_snapshot": { "facts_extracted": {...}, "key_quotes": [...], "profile_completeness": "..." },
  "risk_assessment": { "sebi_level": "...", "confidence": "...", "behavioral_narrative": "...", "assumptions_made": [...] },
  "asset_allocation": { "equity": N, "debt": N, "hybrid": N, "reasoning": "..." },
  "fund_recommendations": [{ "fund_id": "...", "fund_name": "...", "category": "...", "sub_category": "...", "role": "core|satellite", "allocation_percent": N, "monthly_sip": N, "rationale": "..." }],
  "sip_summary": { "total_monthly": N, "sanity_check": "...", "step_up_suggestion": "..." },
  "gaps_for_next_conversation": [{ "area": "...", "priority": "...", "question": "..." }],
  "advisor_notes": "..."
}

RULES:
- All allocation_percent must sum to 100
- Equity + Debt + Hybrid must sum to 100
- Every fund_id must be a valid HDFC fund id
- SIP amounts in multiples of ₹500, minimum ₹500`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1];

    const parsed = JSON.parse(jsonStr.trim());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Chat error:', err);
    const message = err instanceof Error ? err.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
