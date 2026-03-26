import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function analyzeNewsForInvestors(newsItems: { title: string; summary: string; source: string }[]) {
  const newsText = newsItems
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   ${n.summary}`)
    .join('\n\n');

  const prompt = `You are "Mutual Fund Dost", an expert Indian mutual fund advisor focused exclusively on HDFC Mutual Fund schemes. Analyze the following news items and provide deep, valuable investment insights.

For each news item:
1. Classify the news: macro / geopolitical / company / sector / regulatory / market
2. Rate relevance to HDFC mutual fund investors on a scale of 1-10 (10 = directly impacts HDFC fund NAVs, 1 = completely unrelated)
3. If relevance_score < 4, set "skip": true (generic market noise not worth showing to investors)
4. Assess the impact on Indian mutual fund investors: positive / negative / neutral
5. Identify which HDFC Mutual Fund schemes are most likely affected (use exact fund names)
6. Provide a RICH, DETAILED insight paragraph (4-5 sentences). Cover: what exactly happened, why it matters for mutual fund investors, how it connects to specific funds in the HDFC universe, and what investors should watch for next.
7. Provide a SPECIFIC investor_action — not generic advice like "stay invested" but concrete next steps. Example: "SIP investors in HDFC Infrastructure Fund may see short-term NAV pressure; continue SIPs to average down. New lump-sum investors should wait for clarity on Q3 earnings before adding exposure."
8. Rate the significance: high / medium / low

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
- Skip articles that are generic market commentary, clickbait, or have no actionable relevance to HDFC fund investors

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

// Monday Morning Brief types
export interface MarketMetric {
  label: string;
  value: string;
  change: string;
  direction: 'up' | 'down' | 'flat';
}

export interface WeeklyStory {
  title: string;
  title_hi?: string;
  source: string;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  clientImplication: string;
  clientImplication_hi?: string;
  talkingPoints: string[];
  talkingPoints_hi?: string[];
  affectedClientSegments: string[];
}

export interface ClientActionItem {
  task: string;
  task_hi?: string;
  priority: 'high' | 'medium' | 'low';
  clientSegment: string;
  clientSegment_hi?: string;
  timing: string;
  timing_hi?: string;
  context: string;
  context_hi?: string;
}

export interface ConversationScript {
  persona: string;
  persona_hi?: string;
  opener: string;
  opener_hi?: string;
  talkingPoints: string[];
  talkingPoints_hi?: string[];
  objectionHandler: string;
  objectionHandler_hi?: string;
  suggestedFund: string;
}

export interface FundSpotlight {
  fundName: string;
  aum: string;
  return1Y: string;
  return3Y: string;
  return5Y: string;
  categoryRank: string;
  categoryRank_hi?: string;
  whyThisWeek: string;
  whyThisWeek_hi?: string;
  elevatorPitch: string;
  elevatorPitch_hi?: string;
  sipStory: string;
  sipStory_hi?: string;
}

export interface FundHeatmapRow {
  category: string;
  return1W: string;
  return1M: string;
  return3M: string;
  return1Y: string;
}

export interface WeekAheadEvent {
  date: string;
  event: string;
  event_hi?: string;
  impact: string;
  impact_hi?: string;
  actionTrigger: string;
  actionTrigger_hi?: string;
}

export interface MondayBrief {
  weekOf: string;
  generatedAt: string;
  // Page 1
  marketPulse: MarketMetric[];
  niftyWeekSummary: string;
  niftyWeekSummary_hi?: string;
  bigPicture: string;
  bigPicture_hi?: string;
  topStories: WeeklyStory[];
  // Page 2
  actionPlan: ClientActionItem[];
  conversationScripts: ConversationScript[];
  sipWinsStat: string;
  sipWinsStat_hi?: string;
  // Page 3
  fundSpotlights: FundSpotlight[];
  fundHeatmap: FundHeatmapRow[];
  weekAhead: WeekAheadEvent[];
  regulatoryCorner: string;
  regulatoryCorner_hi?: string;
  weeklyWisdom: string;
  weeklyWisdom_hi?: string;
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

HDFC Fund Universe (for context):
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

export async function generateMondayBrief(
  newsItems: { title: string; summary: string; source: string }[],
  fundData: { name: string; subCategory: string; aumCrores: number; return1Y: number | null; return3Y: number | null; return5Y: number | null; return10Y: number | null }[]
): Promise<MondayBrief> {
  const monday = new Date();
  // Find this week's Monday
  const day = monday.getDay();
  const diff = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
  monday.setDate(monday.getDate() + diff);
  const weekOf = monday.toISOString().split('T')[0];

  const newsText = newsItems
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   ${n.summary}`)
    .join('\n\n');

  const fundText = fundData
    .map((f) => `${f.name} (${f.subCategory}) — AUM: ₹${f.aumCrores} Cr | 1Y: ${f.return1Y ?? 'N/A'}% | 3Y: ${f.return3Y ?? 'N/A'}% | 5Y: ${f.return5Y ?? 'N/A'}%`)
    .join('\n');

  const prompt = `You are "Mutual Fund Dost", creating the MONDAY MORNING BRIEF for Indian mutual fund distributors. This is a premium weekly document that makes distributors look brilliant in front of their clients.

Today's date: ${new Date().toISOString().split('T')[0]}
Week of: ${weekOf}

LAST WEEK'S NEWS (use these for analysis):
${newsText}

HDFC FUND PERFORMANCE DATA:
${fundText}

Generate a comprehensive Monday Morning Brief. This document will be printed as a 3-page PDF and sent to distributors. Make it data-rich, actionable, and impressive.

IMPORTANT RULES:
- All data must be based on the news and fund data provided above
- Frame everything for DISTRIBUTORS (how to serve clients), not retail investors
- Be specific with numbers — distributors respect precision
- HDFC Flexi Cap Fund and HDFC Balanced Advantage Fund are the flagship funds — give them hero treatment
- Never give specific investment advice — frame as conversation starters
- Include SEBI compliance language where needed

Return a JSON object with this EXACT structure:

{
  "marketPulse": [
    {"label": "Nifty 50", "value": "21,450", "change": "-5.3%", "direction": "down"},
    {"label": "Sensex", "value": "71,200", "change": "-5.1%", "direction": "down"},
    {"label": "India VIX", "value": "22.3", "change": "+50.7%", "direction": "up"},
    {"label": "Gold (₹/10g)", "value": "88,500", "change": "+1.5%", "direction": "up"},
    {"label": "USD/INR", "value": "86.92", "change": "+0.5%", "direction": "up"},
    {"label": "FII Flow (₹ Cr)", "value": "-12,450", "change": "", "direction": "down"},
    {"label": "DII Flow (₹ Cr)", "value": "+9,800", "change": "", "direction": "up"}
  ],
  "niftyWeekSummary": "Brief 1-line describing the week's Nifty trajectory shape (e.g., 'Steady decline all week with Friday selloff')",
  "niftyWeekSummary_hi": "Nifty की इस सप्ताह की दिशा का हिंदी विवरण",
  "bigPicture": "2 short paragraphs, max 100 words total. Written like a senior colleague briefing an MFD distributor before their Monday calls — concrete, numbers-driven, no padding.",
  "topStories": [
    {
      "title": "Headline",
      "title_hi": "Hindi headline in Devanagari",
      "source": "Source",
      "category": "macro|sector|regulatory|market|geopolitical|company",
      "urgency": "high|medium|low",
      "clientImplication": "1 sentence, max 20 words",
      "clientImplication_hi": "Hindi translation of clientImplication in Devanagari script",
      "talkingPoints": ["point1", "point2"],
      "talkingPoints_hi": ["Hindi point 1 in Devanagari", "Hindi point 2 in Devanagari"],
      "affectedClientSegments": ["retirees", "HNI clients", "SIP investors"]
    }
  ],
  "actionPlan": [
    {
      "task": "Specific actionable task",
      "task_hi": "हिंदी में कार्य विवरण",
      "priority": "high|medium|low",
      "clientSegment": "Who this applies to",
      "clientSegment_hi": "हिंदी में ग्राहक वर्ग",
      "timing": "Monday|Tuesday|Mid-week|By Friday",
      "timing_hi": "सोमवार|मंगलवार|सप्ताह के मध्य में|शुक्रवार तक",
      "context": "1-line why this matters now",
      "context_hi": "हिंदी में एक पंक्ति में क्यों यह महत्वपूर्ण है"
    }
  ],
  "conversationScripts": [
    {
      "persona": "The Panicking Client",
      "persona_hi": "घबराया हुआ निवेशक",
      "opener": "Natural opening line to use",
      "opener_hi": "Hindi opener in Devanagari script",
      "talkingPoints": ["point1", "point2", "point3"],
      "talkingPoints_hi": ["Hindi point 1 in Devanagari", "Hindi point 2 in Devanagari", "Hindi point 3 in Devanagari"],
      "objectionHandler": "When they say 'but the market is crashing...' respond with...",
      "objectionHandler_hi": "Hindi objection handler in Devanagari script",
      "suggestedFund": "HDFC fund to mention in context"
    },
    {
      "persona": "The SIP Investor",
      "persona_hi": "एसआईपी निवेशक",
      "opener": "...",
      "opener_hi": "...",
      "talkingPoints": ["..."],
      "talkingPoints_hi": ["..."],
      "objectionHandler": "...",
      "objectionHandler_hi": "...",
      "suggestedFund": "..."
    },
    {
      "persona": "The New Prospect",
      "persona_hi": "नया संभावित ग्राहक",
      "opener": "...",
      "opener_hi": "...",
      "talkingPoints": ["..."],
      "talkingPoints_hi": ["..."],
      "objectionHandler": "...",
      "objectionHandler_hi": "...",
      "suggestedFund": "..."
    }
  ],
  "sipWinsStat": "A powerful stat like: 'A client who started a ₹10,000 SIP in HDFC Flexi Cap Fund during the March 2020 crash now has ₹X.XX lakhs (XX% XIRR). Markets recover — SIPs make sure your clients are there when they do.'",
  "sipWinsStat_hi": "Hindi translation of sipWinsStat in Devanagari script",
  "fundSpotlights": [
    {
      "fundName": "HDFC Flexi Cap Fund",
      "aum": "₹96,295 Cr",
      "return1Y": "17.2%",
      "return3Y": "22.9%",
      "return5Y": "21.0%",
      "categoryRank": "Rank X/35 in Flexi Cap",
      "categoryRank_hi": "फ्लेक्सी कैप में रैंक X/35",
      "whyThisWeek": "Why this fund is relevant given this week's market conditions",
      "whyThisWeek_hi": "इस सप्ताह के बाजार में यह फंड क्यों प्रासंगिक है",
      "elevatorPitch": "30-second pitch a distributor can use with a client",
      "elevatorPitch_hi": "30 सेकंड की पिच जो डिस्ट्रीब्यूटर ग्राहक के साथ उपयोग कर सकते हैं",
      "sipStory": "₹1 lakh invested 10 years ago is now ₹X.XX lakhs",
      "sipStory_hi": "10 साल पहले ₹1 लाख का निवेश अब ₹X.XX लाख है"
    },
    {
      "fundName": "HDFC Balanced Advantage Fund",
      "aum": "...",
      "return1Y": "...",
      "return3Y": "...",
      "return5Y": "...",
      "categoryRank": "...",
      "categoryRank_hi": "...",
      "whyThisWeek": "Include current equity/debt allocation and how the fund auto-managed risk during the week's volatility",
      "whyThisWeek_hi": "...",
      "elevatorPitch": "...",
      "elevatorPitch_hi": "...",
      "sipStory": "...",
      "sipStory_hi": "..."
    }
  ],
  "fundHeatmap": [
    {"category": "Large Cap", "return1W": "-4.2%", "return1M": "-7.1%", "return3M": "-8.5%", "return1Y": "+6.2%"},
    {"category": "Flexi Cap", "return1W": "...", "return1M": "...", "return3M": "...", "return1Y": "..."},
    {"category": "BAF", "return1W": "...", "return1M": "...", "return3M": "...", "return1Y": "..."},
    {"category": "Mid Cap", "return1W": "...", "return1M": "...", "return3M": "...", "return1Y": "..."},
    {"category": "Small Cap", "return1W": "...", "return1M": "...", "return3M": "...", "return1Y": "..."},
    {"category": "Debt Short Term", "return1W": "...", "return1M": "...", "return3M": "...", "return1Y": "..."},
    {"category": "Liquid", "return1W": "...", "return1M": "...", "return3M": "...", "return1Y": "..."}
  ],
  "weekAhead": [
    {
      "date": "Mon 17 Mar",
      "event": "Event description",
      "event_hi": "हिंदी में घटना का विवरण",
      "impact": "Potential market impact",
      "impact_hi": "हिंदी में संभावित बाजार प्रभाव",
      "actionTrigger": "If X happens, discuss Y with Z clients",
      "actionTrigger_hi": "यदि X हो, तो Z ग्राहकों के साथ Y पर चर्चा करें"
    }
  ],
  "regulatoryCorner": "Any SEBI/AMFI updates, NFO launches, scheme changes, or tax-related deadlines. If nothing notable, say 'No major regulatory updates this week.'",
  "regulatoryCorner_hi": "Hindi translation of regulatoryCorner in Devanagari script",
  "weeklyWisdom": "One motivational or educational quote relevant to the week's context",
  "weeklyWisdom_hi": "Hindi translation of weeklyWisdom in Devanagari script",
  "bigPicture_hi": "Hindi translation of bigPicture in Devanagari script"
}

Include exactly 3 top stories (no more, no fewer). Include exactly 3 action items. Include exactly 3 conversation scripts (The Panicking Client, The SIP Investor, The New Prospect only).

For all _hi fields: write natural, conversational Hindi in Devanagari script. This is NOT a word-for-word translation — adapt for a distributor reading on their phone in a Tier 2 city. Use clear, simple Hindi. Avoid Anglicized jargon where Hindi equivalents exist: बाज़ार (market), निवेश (investment), ग्राहक (client), रिटर्न (return — keep this one), एसआईपी (SIP — keep this one).

CRITICAL: Use actual numbers from the fund data provided. For fund returns, use the EXACT numbers from the fund data above. For marketPulse data (Nifty, Sensex, VIX, Gold, FII/DII flows): only populate values you can DIRECTLY derive from the news items provided. If a metric is not mentioned in the news, set value to "N/A" and change to "". Do NOT estimate, extrapolate, or guess market index levels — this is displayed to professional distributors who will spot fabricated data.`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Monday Brief response as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    weekOf,
    generatedAt: new Date().toISOString(),
    marketPulse: parsed.marketPulse || [],
    niftyWeekSummary: parsed.niftyWeekSummary || '',
    niftyWeekSummary_hi: parsed.niftyWeekSummary_hi,
    bigPicture: parsed.bigPicture || '',
    bigPicture_hi: parsed.bigPicture_hi,
    topStories: parsed.topStories || [],
    actionPlan: parsed.actionPlan || [],
    conversationScripts: parsed.conversationScripts || [],
    sipWinsStat: parsed.sipWinsStat || '',
    sipWinsStat_hi: parsed.sipWinsStat_hi,
    fundSpotlights: parsed.fundSpotlights || [],
    fundHeatmap: parsed.fundHeatmap || [],
    weekAhead: parsed.weekAhead || [],
    regulatoryCorner: parsed.regulatoryCorner || '',
    regulatoryCorner_hi: parsed.regulatoryCorner_hi,
    weeklyWisdom: parsed.weeklyWisdom || '',
    weeklyWisdom_hi: parsed.weeklyWisdom_hi,
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
