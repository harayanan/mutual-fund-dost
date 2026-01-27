import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function analyzeNewsForInvestors(newsItems: { title: string; summary: string; source: string }[]) {
  const newsText = newsItems
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   ${n.summary}`)
    .join('\n\n');

  const prompt = `You are "Mutual Fund Dost", an expert Indian mutual fund advisor focused exclusively on XYZ Mutual Fund schemes. Analyze the following news items and provide deep, valuable investment insights.

For each news item:
1. Classify the news: macro / geopolitical / company / sector / regulatory / market
2. Rate relevance to XYZ mutual fund investors on a scale of 1-10 (10 = directly impacts XYZ fund NAVs, 1 = completely unrelated)
3. If relevance_score < 4, set "skip": true (generic market noise not worth showing to investors)
4. Assess the impact on Indian mutual fund investors: positive / negative / neutral
5. Identify which XYZ Mutual Fund schemes are most likely affected (use exact fund names)
6. Provide a RICH, DETAILED insight paragraph (4-5 sentences). Cover: what exactly happened, why it matters for mutual fund investors, how it connects to specific funds in the XYZ universe, and what investors should watch for next.
7. Provide a SPECIFIC investor_action — not generic advice like "stay invested" but concrete next steps. Example: "SIP investors in HDFC Infrastructure Fund may see short-term NAV pressure; continue SIPs to average down. New lump-sum investors should wait for clarity on Q3 earnings before adding exposure."
8. Rate the significance: high / medium / low

XYZ Fund Universe:
- Equity: Flexi Cap, Mid Cap, Small Cap, Large Cap, Large and Mid Cap, Focused, Multi Cap, Capital Builder Value, Dividend Yield, ELSS Tax Saver
- Sectoral/Thematic: Infrastructure, Technology, Pharma & Healthcare, Banking & Financial Services, Defence, Housing Opportunities, Manufacturing, Business Cycle
- Hybrid: Balanced Advantage, Hybrid Equity, Equity Savings, Hybrid Debt, Multi-Asset Allocation, Arbitrage
- Debt: Liquid, Low Duration, Short Term Debt, Corporate Bond, Banking & PSU Debt, Floating Rate Debt
- Index: Nifty 50 Index, BSE Sensex Index, NIFTY Next 50 Index
- Solution: Children's Fund, Retirement Savings (Equity/Hybrid Equity/Hybrid Debt)

Important guidelines:
- Always mention that mutual fund investments are subject to market risks
- Never guarantee returns
- Focus on long-term wealth creation perspective
- Consider the investor's risk profile when suggesting impact
- Be balanced and factual, avoid sensationalism
- Skip articles that are generic market commentary, clickbait, or have no actionable relevance to XYZ fund investors

NEWS ITEMS:
${newsText}

Respond in valid JSON array format. Include ALL items (even skipped ones):
[{
  "news_index": 1,
  "category": "macro",
  "relevance_score": 8,
  "skip": false,
  "impact": "positive",
  "significance": "high",
  "affected_funds": ["HDFC Flexi Cap Fund", "HDFC Large Cap Fund"],
  "insight": "Your detailed 4-5 sentence insight here...",
  "investor_action": "Specific, concrete next steps for investors..."
}]`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Gemini response as JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function generateFundInsight(fundName: string, fundDetails: Record<string, unknown>) {
  const prompt = `You are "Mutual Fund Dost", a trusted mutual fund advisor. Provide a brief, insightful analysis of ${fundName}.

Fund Details: ${JSON.stringify(fundDetails)}

Provide in JSON format:
{
  "summary": "2-3 sentence fund overview",
  "strengths": ["strength1", "strength2"],
  "considerations": ["consideration1", "consideration2"],
  "ideal_for": "Type of investor this fund is ideal for",
  "buffett_perspective": "What would a long-term value investor think about this fund?"
}`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse response');
  return JSON.parse(jsonMatch[0]);
}
