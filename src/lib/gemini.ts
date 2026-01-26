import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function analyzeNewsForInvestors(newsItems: { title: string; summary: string; source: string }[]) {
  const newsText = newsItems
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   ${n.summary}`)
    .join('\n\n');

  const prompt = `You are "Mutual Fund Dost", an expert Indian mutual fund advisor focused exclusively on HDFC Mutual Fund schemes. Analyze the following news items and provide investment insights.

For each news item:
1. Classify the news: macro / geopolitical / company / sector / regulatory / market
2. Assess the impact on Indian mutual fund investors: positive / negative / neutral
3. Identify which HDFC Mutual Fund schemes are most likely affected (use exact fund names)
4. Provide a clear, actionable insight in plain English (2-3 sentences)
5. Rate the significance: high / medium / low

HDFC Fund Universe:
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

NEWS ITEMS:
${newsText}

Respond in valid JSON array format:
[{
  "news_index": 1,
  "category": "macro",
  "impact": "positive",
  "significance": "high",
  "affected_funds": ["HDFC Flexi Cap Fund", "HDFC Large Cap Fund"],
  "insight": "Your insight here...",
  "investor_action": "What investors should consider..."
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
