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

// Types for Daily Brief
export interface DistributorNewsInsight {
  title: string;
  source: string;
  category: string;
  clientImplication: string;
  talkingPoints: string[];
  affectedClientSegments: string[];
  urgency: 'high' | 'medium' | 'low';
}

export interface ConversationStarter {
  topic: string;
  opener: string;
  keyPoint: string;
  clientBenefit: string;
}

export interface ActionItem {
  task: string;
  priority: 'high' | 'medium' | 'low';
  clientSegment?: string;
  deadline?: string;
}

export interface DailyBrief {
  date: string;
  generatedAt: string;
  topStories: DistributorNewsInsight[];
  conversationStarters: ConversationStarter[];
  actionItems: ActionItem[];
  dailyWisdom: string;
}

export async function generateDistributorBrief(
  newsItems: { title: string; summary: string; source: string }[]
): Promise<DailyBrief> {
  const today = new Date().toISOString().split('T')[0];
  const newsText = newsItems
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   ${n.summary}`)
    .join('\n\n');

  const prompt = `You are "Mutual Fund Dost", an AI assistant for mutual fund DISTRIBUTORS (not retail investors). Your job is to help distributors prepare for their day by summarizing news in a way that helps them serve their clients better.

Today's date: ${today}

Analyze the following news and create a DISTRIBUTOR-FOCUSED daily brief. Remember:
- Frame everything in terms of "how to help clients" NOT "what to do as an investor"
- Focus on conversation opportunities with clients
- Identify which client segments should be contacted
- Provide actionable tasks for the distributor's day

NEWS ITEMS:
${newsText}

Create a comprehensive daily brief with:

1. TOP STORIES (3-5 most important): For each story, provide:
   - title: The headline
   - source: News source
   - category: macro / geopolitical / company / sector / regulatory / market
   - clientImplication: 2-3 sentences explaining what this means for clients (not what the distributor should invest in)
   - talkingPoints: Array of 2-3 specific points to discuss with clients
   - affectedClientSegments: Array of client types who should know about this (e.g., "retirees", "young professionals", "HNI clients", "SIP investors", "lump sum investors")
   - urgency: high (contact clients today) / medium (mention in next meeting) / low (good to know)

2. CONVERSATION STARTERS (3-4): Proactive topics to bring up with clients:
   - topic: Brief topic title
   - opener: A natural conversation opener (e.g., "Have you seen the news about...")
   - keyPoint: The main insight to convey
   - clientBenefit: Why this conversation helps the client

3. ACTION ITEMS (3-5): Specific tasks for the distributor today:
   - task: Clear, actionable task description
   - priority: high / medium / low
   - clientSegment: Which clients this task relates to (optional)
   - deadline: When to complete (e.g., "today", "this week") (optional)

4. DAILY WISDOM: One motivational or educational quote/tip for distributors (1-2 sentences)

XYZ Fund Universe (for context):
- Equity: Flexi Cap, Mid Cap, Small Cap, Large Cap, Large and Mid Cap, Focused, Multi Cap, Capital Builder Value, Dividend Yield, ELSS Tax Saver
- Sectoral/Thematic: Infrastructure, Technology, Pharma & Healthcare, Banking & Financial Services, Defence, Housing Opportunities, Manufacturing, Business Cycle
- Hybrid: Balanced Advantage, Hybrid Equity, Equity Savings, Hybrid Debt, Multi-Asset Allocation, Arbitrage
- Debt: Liquid, Low Duration, Short Term Debt, Corporate Bond, Banking & PSU Debt, Floating Rate Debt
- Index: Nifty 50 Index, BSE Sensex Index, NIFTY Next 50 Index

IMPORTANT GUIDELINES:
- Be practical and actionable
- Focus on client relationship building
- Never give specific investment advice (distributors will customize for each client)
- Emphasize the distributor's role as a trusted advisor
- Keep language professional but warm

Respond in valid JSON format:
{
  "topStories": [...],
  "conversationStarters": [...],
  "actionItems": [...],
  "dailyWisdom": "..."
}`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Gemini response as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    date: today,
    generatedAt: new Date().toISOString(),
    topStories: parsed.topStories || [],
    conversationStarters: parsed.conversationStarters || [],
    actionItems: parsed.actionItems || [],
    dailyWisdom: parsed.dailyWisdom || '',
  };
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
