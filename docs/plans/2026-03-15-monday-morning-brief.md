# Monday Morning Brief Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a print-ready 3-page Monday Morning Brief page that gives distributors a comprehensive weekly playbook — market data, AI analysis, fund highlights, conversation scripts, and action items.

**Architecture:** Single page route `/monday-brief` with a client component that fetches from a new `/api/monday-brief` GET endpoint. The GET endpoint auto-generates the brief on first Monday visit (same pattern as daily-brief). A Gemini prompt generates the narrative/analytical content, while fund performance data comes from Supabase `mfd_funds` + `mfd_fund_performance` tables. The page is styled for A4 print with `@media print` CSS. VPS cron generates it every Monday at 5:30 AM IST.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, Gemini 2.0 Flash, Supabase, CSS print media queries.

---

### Task 1: Types & Gemini Prompt

**Files:**
- Modify: `src/lib/gemini.ts` — add `MondayBrief` types and `generateMondayBrief()` function

**Step 1: Add types to gemini.ts**

Add after the existing `DailyBrief` interface (line ~100):

```typescript
// Monday Morning Brief types
export interface MarketMetric {
  label: string;
  value: string;
  change: string;
  direction: 'up' | 'down' | 'flat';
}

export interface WeeklyStory {
  title: string;
  source: string;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  clientImplication: string;
  talkingPoints: string[];
  affectedClientSegments: string[];
}

export interface ClientActionItem {
  task: string;
  priority: 'high' | 'medium' | 'low';
  clientSegment: string;
  timing: string;
  context: string;
}

export interface ConversationScript {
  persona: string;
  opener: string;
  talkingPoints: string[];
  objectionHandler: string;
  suggestedFund: string;
}

export interface FundSpotlight {
  fundName: string;
  aum: string;
  return1Y: string;
  return3Y: string;
  return5Y: string;
  categoryRank: string;
  whyThisWeek: string;
  elevatorPitch: string;
  sipStory: string;
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
  impact: string;
  actionTrigger: string;
}

export interface MondayBrief {
  weekOf: string;
  generatedAt: string;
  // Page 1
  marketPulse: MarketMetric[];
  niftyWeekSummary: string;
  bigPicture: string;
  topStories: WeeklyStory[];
  // Page 2
  actionPlan: ClientActionItem[];
  conversationScripts: ConversationScript[];
  sipWinsStat: string;
  // Page 3
  fundSpotlights: FundSpotlight[];
  fundHeatmap: FundHeatmapRow[];
  weekAhead: WeekAheadEvent[];
  regulatoryCorner: string;
  weeklyWisdom: string;
}
```

**Step 2: Add generateMondayBrief function**

Add after `generateDistributorBrief`:

```typescript
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

XYZ FUND PERFORMANCE DATA:
${fundText}

Generate a comprehensive Monday Morning Brief. This document will be printed as a 3-page PDF and sent to distributors. Make it data-rich, actionable, and impressive.

IMPORTANT RULES:
- All data must be based on the news and fund data provided above
- Frame everything for DISTRIBUTORS (how to serve clients), not retail investors
- Be specific with numbers — distributors respect precision
- XYZ Flexi Cap Fund and XYZ Balanced Advantage Fund are the flagship funds — give them hero treatment
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
  "bigPicture": "3-4 paragraph narrative summary of the week. Written like a senior analyst briefing — what happened, why, what it means for mutual fund distributors and their clients. Include specific numbers. This is what the distributor reads before any client call on Monday.",
  "topStories": [
    {
      "title": "Headline",
      "source": "Source",
      "category": "macro|sector|regulatory|market|geopolitical|company",
      "urgency": "high|medium|low",
      "clientImplication": "2-3 sentences on what this means for clients",
      "talkingPoints": ["point1", "point2"],
      "affectedClientSegments": ["retirees", "HNI clients", "SIP investors"]
    }
  ],
  "actionPlan": [
    {
      "task": "Specific actionable task",
      "priority": "high|medium|low",
      "clientSegment": "Who this applies to",
      "timing": "Monday|Tuesday|Mid-week|By Friday",
      "context": "1-line why this matters now"
    }
  ],
  "conversationScripts": [
    {
      "persona": "The Panicking Client",
      "opener": "Natural opening line to use",
      "talkingPoints": ["point1", "point2", "point3"],
      "objectionHandler": "When they say 'but the market is crashing...' respond with...",
      "suggestedFund": "XYZ fund to mention in context"
    },
    {
      "persona": "The Opportunity Seeker",
      "opener": "...",
      "talkingPoints": ["..."],
      "objectionHandler": "...",
      "suggestedFund": "..."
    },
    {
      "persona": "The SIP Investor",
      "opener": "...",
      "talkingPoints": ["..."],
      "objectionHandler": "...",
      "suggestedFund": "..."
    },
    {
      "persona": "The HNI Client",
      "opener": "...",
      "talkingPoints": ["..."],
      "objectionHandler": "...",
      "suggestedFund": "..."
    },
    {
      "persona": "The New Prospect",
      "opener": "...",
      "talkingPoints": ["..."],
      "objectionHandler": "...",
      "suggestedFund": "..."
    }
  ],
  "sipWinsStat": "A powerful stat like: 'A client who started a ₹10,000 SIP in XYZ Flexi Cap Fund during the March 2020 crash now has ₹X.XX lakhs (XX% XIRR). Markets recover — SIPs make sure your clients are there when they do.'",
  "fundSpotlights": [
    {
      "fundName": "XYZ Flexi Cap Fund",
      "aum": "₹96,295 Cr",
      "return1Y": "17.2%",
      "return3Y": "22.9%",
      "return5Y": "21.0%",
      "categoryRank": "Rank X/35 in Flexi Cap",
      "whyThisWeek": "Why this fund is relevant given this week's market conditions",
      "elevatorPitch": "30-second pitch a distributor can use with a client",
      "sipStory": "₹1 lakh invested 10 years ago is now ₹X.XX lakhs"
    },
    {
      "fundName": "XYZ Balanced Advantage Fund",
      "aum": "...",
      "return1Y": "...",
      "return3Y": "...",
      "return5Y": "...",
      "categoryRank": "...",
      "whyThisWeek": "Include current equity/debt allocation and how the fund auto-managed risk during the week's volatility",
      "elevatorPitch": "...",
      "sipStory": "..."
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
      "impact": "Potential market impact",
      "actionTrigger": "If X happens, discuss Y with Z clients"
    }
  ],
  "regulatoryCorner": "Any SEBI/AMFI updates, NFO launches, scheme changes, or tax-related deadlines. If nothing notable, say 'No major regulatory updates this week.'",
  "weeklyWisdom": "One motivational or educational quote relevant to the week's context"
}

CRITICAL: Use actual numbers from the fund data provided. For market data (Nifty, Sensex, VIX, Gold, FII/DII flows), estimate from the news context — distributors expect approximate accuracy, not perfection. For fund returns, use the EXACT numbers from the fund data above.`;

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
    bigPicture: parsed.bigPicture || '',
    topStories: parsed.topStories || [],
    actionPlan: parsed.actionPlan || [],
    conversationScripts: parsed.conversationScripts || [],
    sipWinsStat: parsed.sipWinsStat || '',
    fundSpotlights: parsed.fundSpotlights || [],
    fundHeatmap: parsed.fundHeatmap || [],
    weekAhead: parsed.weekAhead || [],
    regulatoryCorner: parsed.regulatoryCorner || '',
    weeklyWisdom: parsed.weeklyWisdom || '',
  };
}
```

**Step 3: Commit**

```bash
git add src/lib/gemini.ts
git commit -m "feat: add MondayBrief types and Gemini prompt"
```

---

### Task 2: API Route — GET + Refresh

**Files:**
- Create: `src/app/api/monday-brief/route.ts`
- Create: `src/app/api/monday-brief/refresh/route.ts`

**Step 1: Create GET endpoint**

`src/app/api/monday-brief/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateMondayBrief } from '@/lib/gemini';
import type { MondayBrief } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

async function generateBriefInline(supabase: ReturnType<typeof getSupabase>, weekOf: string): Promise<void> {
  // Get last 7 days of news
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: newsItems } = await supabase
    .from('mfd_news_cache')
    .select('title, summary, source')
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(40);

  // Get fund data with performance
  const { data: funds } = await supabase
    .from('mfd_funds')
    .select('name, sub_category, aum_crores');

  const { data: performance } = await supabase
    .from('mfd_fund_performance')
    .select('fund_id, return_1y, return_3y, return_5y, return_10y');

  const perfMap = new Map((performance || []).map((p) => [p.fund_id, p]));

  const fundData = (funds || []).map((f) => {
    const slug = f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const perf = perfMap.get(slug) || perfMap.get(slug.replace('-fund', ''));
    return {
      name: f.name,
      subCategory: f.sub_category,
      aumCrores: f.aum_crores,
      return1Y: perf?.return_1y ?? null,
      return3Y: perf?.return_3y ?? null,
      return5Y: perf?.return_5y ?? null,
      return10Y: perf?.return_10y ?? null,
    };
  });

  if (!newsItems || newsItems.length === 0) return;

  const brief = await generateMondayBrief(newsItems, fundData);

  await supabase.from('mfd_monday_briefs').upsert(
    {
      week_of: weekOf,
      brief_data: brief,
      generated_at: brief.generatedAt,
    },
    { onConflict: 'week_of' }
  );

  await supabase.from('mfd_data_metadata').upsert(
    {
      key: 'monday_brief_data',
      last_updated: new Date().toISOString(),
      status: 'success',
      details: { trigger: 'auto-refresh-on-visit', weekOf },
    },
    { onConflict: 'key' }
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const weekOf = getCurrentWeekMonday();

    // Try this week's brief
    const { data: existing } = await supabase
      .from('mfd_monday_briefs')
      .select('*')
      .eq('week_of', weekOf)
      .single();

    if (existing) {
      return NextResponse.json({
        brief: existing.brief_data as MondayBrief,
        lastUpdated: existing.generated_at,
      });
    }

    // Auto-generate
    try {
      await generateBriefInline(supabase, weekOf);
    } catch (genErr) {
      console.error('Auto-generate Monday brief failed:', genErr);
    }

    // Re-fetch (this week or latest)
    const { data: row } = await supabase
      .from('mfd_monday_briefs')
      .select('*')
      .order('week_of', { ascending: false })
      .limit(1)
      .single();

    if (!row) {
      return NextResponse.json({
        brief: null,
        error: 'No Monday brief available. News data may be missing.',
      });
    }

    return NextResponse.json({
      brief: row.brief_data as MondayBrief,
      lastUpdated: row.generated_at,
      isStale: row.week_of !== weekOf,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Monday brief' },
      { status: 500 }
    );
  }
}
```

**Step 2: Create refresh endpoint**

`src/app/api/monday-brief/refresh/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateMondayBrief } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

export async function POST() {
  const startTime = Date.now();

  try {
    const supabase = getSupabase();
    const weekOf = getCurrentWeekMonday();

    // Get last 7 days of news
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newsItems } = await supabase
      .from('mfd_news_cache')
      .select('title, summary, source')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(40);

    if (!newsItems || newsItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No recent news available to generate brief',
        durationMs: Date.now() - startTime,
      });
    }

    // Get fund data
    const { data: funds } = await supabase.from('mfd_funds').select('name, sub_category, aum_crores');
    const { data: performance } = await supabase.from('mfd_fund_performance').select('fund_id, return_1y, return_3y, return_5y, return_10y');

    const perfMap = new Map((performance || []).map((p) => [p.fund_id, p]));
    const fundData = (funds || []).map((f) => {
      const slug = f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const perf = perfMap.get(slug) || perfMap.get(slug.replace('-fund', ''));
      return {
        name: f.name, subCategory: f.sub_category, aumCrores: f.aum_crores,
        return1Y: perf?.return_1y ?? null, return3Y: perf?.return_3y ?? null,
        return5Y: perf?.return_5y ?? null, return10Y: perf?.return_10y ?? null,
      };
    });

    const brief = await generateMondayBrief(newsItems, fundData);

    await supabase.from('mfd_monday_briefs').upsert(
      { week_of: weekOf, brief_data: brief, generated_at: brief.generatedAt },
      { onConflict: 'week_of' }
    );

    await supabase.from('mfd_data_metadata').upsert(
      { key: 'monday_brief_data', last_updated: new Date().toISOString(), status: 'success', details: { trigger: 'manual', weekOf, newsCount: newsItems.length } },
      { onConflict: 'key' }
    );

    return NextResponse.json({
      success: true,
      weekOf,
      newsCount: newsItems.length,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/monday-brief/
git commit -m "feat: add Monday brief API endpoints (GET + refresh)"
```

---

### Task 3: Supabase Table

**Step 1: Create the `mfd_monday_briefs` table**

Run via Supabase SQL editor or node script:

```sql
CREATE TABLE IF NOT EXISTS mfd_monday_briefs (
  week_of DATE PRIMARY KEY,
  brief_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS but allow anon access (same pattern as other mfd_ tables)
ALTER TABLE mfd_monday_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON mfd_monday_briefs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert" ON mfd_monday_briefs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON mfd_monday_briefs FOR UPDATE TO anon USING (true);
```

---

### Task 4: Page Component — Print-Optimized Layout

**Files:**
- Create: `src/app/monday-brief/page.tsx`
- Create: `src/components/monday-brief/MondayBriefDocument.tsx`

**Step 1: Create the page shell**

`src/app/monday-brief/page.tsx` — thin wrapper like daily-brief page. Includes the "Download PDF" button that triggers `window.print()`. The header/footer from layout.tsx are hidden via existing `@media print` CSS.

**Step 2: Create MondayBriefDocument component**

`src/components/monday-brief/MondayBriefDocument.tsx` — the main client component. Handles:
- Fetching from `/api/monday-brief`
- Loading skeleton
- Error/empty states with "Generate Brief" button
- Refresh button
- Renders the full 3-page print layout

The document layout (all in one component, sections separated by comments):

**Print Page 1 — Market Context:**
- Header bar: "MONDAY MORNING BRIEF | Week of March 17-21, 2026 | Mutual Fund Dost"
- Market Pulse strip: 7 metrics in a horizontal grid, green/red colored
- Nifty week summary line (italic)
- Big Picture: 3-4 paragraphs, serif-like feel for readability
- Top 5 Stories: compact cards with urgency badges and segment pills
- CSS: `page-break-after: always` after this section

**Print Page 2 — Distributor Playbook:**
- "YOUR ACTION PLAN THIS WEEK" header
- Action items in a table: task, priority badge, segment, timing, context
- "SIP WINS" callout box (amber gradient, prominent stat)
- "CONVERSATION PLAYBOOK" — 5 persona cards in a 2+3 grid
  - Each: persona name, opener in quotes, 3 talking points, objection handler, suggested fund
- CSS: `page-break-after: always` after this section

**Print Page 3 — Intelligence:**
- "STAR PERFORMERS" — 2 hero cards for Flexi Cap and BAF
  - Returns table (1Y/3Y/5Y), category rank, elevator pitch, SIP story, why relevant this week
- "FUND PERFORMANCE HEATMAP" — color-coded table (7 categories × 4 periods)
  - Green for positive, red for negative, bold for significant moves
- "WEEK AHEAD RADAR" — 5-6 events with dates and action triggers
- "REGULATORY CORNER" — compact box
- Footer: Weekly wisdom quote + SEBI disclaimer + "Powered by Mutual Fund Dost AI"

**Print CSS considerations:**
- Use `@media print` to hide UI chrome (refresh button, loading states)
- Use `break-after: page` for 3-page separation
- All colors use `print-color-adjust: exact` (already in globals.css)
- Tables and cards use `break-inside: avoid`
- Font sizes slightly smaller for print density (11px body, 9px labels)
- A4 page width consideration: max 190mm content width

**Step 3: Commit**

```bash
git add src/app/monday-brief/ src/components/monday-brief/
git commit -m "feat: add Monday Morning Brief page with print layout"
```

---

### Task 5: Print CSS Enhancements

**Files:**
- Modify: `src/app/globals.css` — add Monday brief print-specific rules

**Step 1: Add print rules to globals.css**

Append to existing `@media print` block:

```css
/* Monday Brief print layout */
.monday-brief-page {
  font-size: 11px;
  line-height: 1.4;
}

.monday-brief-page .page-break {
  break-after: page;
}

.monday-brief-page .no-print {
  display: none !important;
}

.monday-brief-page table {
  break-inside: avoid;
}

.monday-brief-page .hero-card {
  break-inside: avoid;
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add print CSS for Monday brief 3-page layout"
```

---

### Task 6: Navigation + Header Link

**Files:**
- Modify: `src/components/ui/Header.tsx` — add Monday Brief link

**Step 1: Add link to desktop and mobile nav**

Add after the "Daily Brief" link in both desktop and mobile nav:

```tsx
<Link
  href="/monday-brief"
  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
>
  Monday Brief
</Link>
```

**Step 2: Commit**

```bash
git add src/components/ui/Header.tsx
git commit -m "feat: add Monday Brief to navigation"
```

---

### Task 7: VPS Cron — Monday Generation

**Files:**
- Modify: `scripts/refresh-news.mjs` — add Monday brief generation
- Modify: `scripts/refresh-news.sh` — no changes needed (same script)

**Step 1: Add Monday brief generation to the VPS script**

At the end of `main()` in `refresh-news.mjs`, after the daily brief section, add:

```javascript
// Generate Monday brief (only on Mondays, or if none exists for this week)
const dayOfWeek = new Date().getDay();
if (dayOfWeek === 1) { // Monday
  console.log('Monday detected — generating Monday Morning Brief...');
  try {
    const weekMonday = new Date().toISOString().split('T')[0];

    // Check if already exists
    const { data: existing } = await supabase
      .from('mfd_monday_briefs')
      .select('week_of')
      .eq('week_of', weekMonday)
      .single();

    if (!existing) {
      // Fetch funds + performance for the prompt
      const { data: funds } = await supabase.from('mfd_funds').select('name, sub_category, aum_crores');
      const { data: performance } = await supabase.from('mfd_fund_performance').select('fund_id, return_1y, return_3y, return_5y, return_10y');
      const perfMap = new Map((performance || []).map(p => [p.fund_id, p]));

      const fundData = (funds || []).map(f => {
        const slug = f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const perf = perfMap.get(slug) || perfMap.get(slug.replace('-fund', ''));
        return {
          name: f.name, subCategory: f.sub_category, aumCrores: f.aum_crores,
          return1Y: perf?.return_1y ?? null, return3Y: perf?.return_3y ?? null,
          return5Y: perf?.return_5y ?? null, return10Y: perf?.return_10y ?? null,
        };
      });

      // Get 7 days of news
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: weekNews } = await supabase
        .from('mfd_news_cache')
        .select('title, summary, source')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(40);

      if (weekNews && weekNews.length > 0) {
        const mondayBrief = await generateMondayBriefVPS(weekNews, fundData);
        await supabase.from('mfd_monday_briefs').upsert(
          { week_of: weekMonday, brief_data: mondayBrief, generated_at: new Date().toISOString() },
          { onConflict: 'week_of' }
        );
        console.log('Monday Morning Brief generated and saved');
      }
    } else {
      console.log('Monday brief already exists for this week');
    }
  } catch (err) {
    console.error('Monday brief generation failed:', err.message);
  }
}
```

Add the `generateMondayBriefVPS` function to the script (mirrors the Gemini prompt from gemini.ts but in plain JS).

**Step 2: Update cron to run earlier on Mondays**

Add a separate Monday-only cron at 5:00 AM IST (23:30 UTC Sunday):

```bash
# MFD Monday Morning Brief (Sundays 11:30 PM UTC = Monday 5:00 AM IST)
30 23 * * 0 /root/claudecode/mutual-fund-dost/scripts/refresh-news.sh
```

**Step 3: Commit**

```bash
git add scripts/refresh-news.mjs
git commit -m "feat: add Monday brief generation to VPS cron"
```

---

### Task 8: Build, Test, Deploy

**Step 1: Run build**
```bash
npm run build
```

**Step 2: Test locally**
```bash
npm run dev -- -p 3002
# Visit http://localhost:3002/monday-brief
# Click "Generate Brief" and verify it loads
# Click "Download PDF" and verify 3-page print layout
```

**Step 3: Deploy**
```bash
./scripts/deploy.sh
```

**Step 4: Create Supabase table on production**

Run the SQL from Task 3 against the shared Supabase instance.

**Step 5: Test production**
```bash
curl -s https://mutual-fund-dost.vercel.app/api/monday-brief | python3 -m json.tool | head -20
```

**Step 6: Final commit**
```bash
git add -A
git commit -m "feat: Monday Morning Brief — complete implementation"
```
