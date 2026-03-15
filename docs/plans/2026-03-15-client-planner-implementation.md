# Client Planner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a distributor-facing Client Planner to mutual-fund-dost where distributors record client conversations, AI extracts financial facts and generates personalized investment plans, and distributors edit/share the results.

**Architecture:** Three new pages (`/clients`, `/clients/[id]`, `/plan/[slug]`), five new API routes, three new Supabase tables, and a Gemini-powered AI pipeline (transcribe → extract facts → merge profile → flag gaps → generate plan). Builds on existing fund data, recommendation engine, and Gemini patterns.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, Supabase (PostgreSQL + Storage), Gemini 2.0 Flash, Lucide icons, existing HDFC fund data (60 schemes)

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migration-v4-client-planner.sql`

**Step 1: Write the migration SQL**

```sql
-- Client Planner tables (mfd_ prefix per project convention)

-- Clients
CREATE TABLE IF NOT EXISTS mfd_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_name TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (audio recordings + transcripts)
CREATE TABLE IF NOT EXISTS mfd_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES mfd_clients(id) ON DELETE CASCADE,
  audio_url TEXT,
  transcript TEXT,
  extracted_facts JSONB DEFAULT '{}'::jsonb,
  gaps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans (versioned per client)
CREATE TABLE IF NOT EXISTS mfd_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES mfd_clients(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES mfd_conversations(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  client_profile JSONB DEFAULT '{}'::jsonb,
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  asset_allocation JSONB DEFAULT '{}'::jsonb,
  fund_recommendations JSONB DEFAULT '[]'::jsonb,
  sip_schedule JSONB DEFAULT '[]'::jsonb,
  gaps_remaining JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'finalized')),
  share_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mfd_clients_distributor ON mfd_clients(distributor_name);
CREATE INDEX IF NOT EXISTS idx_mfd_conversations_client ON mfd_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_mfd_plans_client ON mfd_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_mfd_plans_share_slug ON mfd_plans(share_slug);

-- RLS
ALTER TABLE mfd_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfd_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfd_plans ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern as existing tables)
CREATE POLICY "Allow public read on mfd_clients" ON mfd_clients FOR SELECT USING (true);
CREATE POLICY "Allow insert on mfd_clients" ON mfd_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on mfd_clients" ON mfd_clients FOR UPDATE USING (true);
CREATE POLICY "Allow delete on mfd_clients" ON mfd_clients FOR DELETE USING (true);

CREATE POLICY "Allow public read on mfd_conversations" ON mfd_conversations FOR SELECT USING (true);
CREATE POLICY "Allow insert on mfd_conversations" ON mfd_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on mfd_plans" ON mfd_plans FOR SELECT USING (true);
CREATE POLICY "Allow insert on mfd_plans" ON mfd_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on mfd_plans" ON mfd_plans FOR UPDATE USING (true);
```

**Step 2: Run migration against Supabase**

Run: Open Supabase SQL editor at the shared instance (port 8000) and execute the migration.
Expected: 3 tables created, indexes and policies applied.

**Step 3: Create Supabase Storage bucket for audio**

Run in SQL editor:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('client-audio', 'client-audio', false);
```

**Step 4: Commit**

```bash
cd /root/claudecode/mutual-fund-dost
git add supabase/migration-v4-client-planner.sql
git commit -m "feat: add client planner database migration (clients, conversations, plans tables)"
```

---

## Task 2: TypeScript Types for Client Planner

**Files:**
- Create: `src/lib/client-planner/types.ts`

**Step 1: Write the types file**

This defines all the shapes used across the client planner feature. These mirror the JSONB columns in the database.

```typescript
// --- Database row types ---

export interface Client {
  id: string;
  distributor_name: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  audio_url: string | null;
  transcript: string | null;
  extracted_facts: ExtractedFacts;
  gaps: Gap[];
  created_at: string;
}

export interface Plan {
  id: string;
  client_id: string;
  conversation_id: string | null;
  version: number;
  client_profile: ClientProfile;
  risk_assessment: RiskAssessment;
  asset_allocation: AssetAllocation;
  fund_recommendations: FundRecommendation[];
  sip_schedule: SIPEntry[];
  gaps_remaining: Gap[];
  status: 'draft' | 'reviewed' | 'finalized';
  share_slug: string | null;
  created_at: string;
}

// --- Structured JSONB shapes ---

export interface ExtractedFacts {
  income?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string };
  expenses?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string };
  age?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string };
  dependents?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string };
  existing_investments?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string };
  goals?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string }[];
  risk_behavior?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string };
  tax_situation?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string };
  sip_capacity?: { value: string; confidence: 'high' | 'medium' | 'low'; quote?: string };
  other_facts?: { label: string; value: string; confidence: 'high' | 'medium' | 'low'; quote?: string }[];
}

export interface ClientProfile {
  age?: string;
  income?: string;
  expenses?: string;
  dependents?: string;
  existing_investments?: string;
  goals?: string[];
  risk_behavior?: string;
  tax_situation?: string;
  sip_capacity?: string;
  other?: Record<string, string>;
  last_updated?: string;
}

export interface RiskAssessment {
  sebi_level: string;
  behavioral_narrative: string;
  evidence_quotes: string[];
}

export interface AssetAllocation {
  equity: number;
  debt: number;
  hybrid: number;
  reasoning: string;
}

export interface FundRecommendation {
  fund_id: string;
  fund_name: string;
  category: string;
  allocation_percent: number;
  monthly_sip: number;
  rationale: string;
  role: 'core' | 'satellite';
}

export interface SIPEntry {
  fund_id: string;
  fund_name: string;
  monthly_amount: number;
}

export interface Gap {
  area: string;
  priority: 'high' | 'medium' | 'low';
  suggested_question: string;
}
```

**Step 2: Commit**

```bash
git add src/lib/client-planner/types.ts
git commit -m "feat: add TypeScript types for client planner data model"
```

---

## Task 3: Gemini Prompts for Client Planner

**Files:**
- Create: `src/lib/client-planner/prompts.ts`

**Step 1: Write the prompts file**

Three prompts: fact extraction, gap analysis, and plan generation. These are the core AI engine.

```typescript
import { HDFC_FUNDS } from '@/data/hdfc-funds';

const FUND_LIST = HDFC_FUNDS.map(f => `- ${f.name} (${f.category}, ${f.subCategory}, risk: ${f.riskLevel}, 5yr: ${f.return5y ?? 'N/A'}%)`).join('\n');

export const EXTRACT_FACTS_PROMPT = `You are a financial data extraction engine for an Indian mutual fund distributor's back-office tool.

You will receive a transcript of a conversation between a distributor and their client, OR a distributor dictating notes about a client. The audio may be messy, in Hindi-English mix, with incomplete thoughts.

Extract whatever financial facts you can find. Do NOT invent or assume facts that aren't mentioned. It's perfectly fine to have very few facts — the distributor will have more conversations later.

For each fact you extract, provide:
- "value": the extracted information (in English)
- "confidence": "high" (explicitly stated), "medium" (implied/approximate), or "low" (vague mention)
- "quote": the relevant snippet from the transcript (if identifiable)

Return valid JSON matching this schema:
{
  "income": { "value": "...", "confidence": "...", "quote": "..." },
  "expenses": { "value": "...", "confidence": "...", "quote": "..." },
  "age": { "value": "...", "confidence": "...", "quote": "..." },
  "dependents": { "value": "...", "confidence": "...", "quote": "..." },
  "existing_investments": { "value": "...", "confidence": "...", "quote": "..." },
  "goals": [{ "value": "...", "confidence": "...", "quote": "..." }],
  "risk_behavior": { "value": "...", "confidence": "...", "quote": "..." },
  "tax_situation": { "value": "...", "confidence": "...", "quote": "..." },
  "sip_capacity": { "value": "...", "confidence": "...", "quote": "..." },
  "other_facts": [{ "label": "...", "value": "...", "confidence": "...", "quote": "..." }]
}

ONLY include fields where you found relevant information. Omit fields with no data. An empty object {} is a valid response if the transcript contains no financial information.

TRANSCRIPT:
`;

export const FLAG_GAPS_PROMPT = `You are an investment planning assistant. Given a client's profile (extracted from conversations so far), identify what important information is still missing for creating a good mutual fund investment plan.

Categorize gaps by priority:
- "high": Critical for any meaningful recommendation (e.g., no income info, no idea of investment capacity)
- "medium": Would significantly improve the plan (e.g., existing investments not discussed, tax regime unknown)
- "low": Nice to have for fine-tuning (e.g., specific retirement age target, exact risk tolerance in past crashes)

For each gap, suggest a natural question the distributor can ask in their next conversation.

Return valid JSON array:
[
  { "area": "...", "priority": "high|medium|low", "suggested_question": "..." }
]

Return an empty array [] if the profile is comprehensive enough.

CLIENT PROFILE:
`;

export function buildPlanPrompt(clientProfile: string, fundList: string = FUND_LIST): string {
  return `You are "Mutual Fund Dost", an expert Indian mutual fund advisor. Given a client's profile, generate a personalized investment plan using ONLY HDFC Mutual Fund schemes.

CLIENT PROFILE:
${clientProfile}

AVAILABLE HDFC FUNDS:
${fundList}

Generate a comprehensive investment plan. Work with whatever information you have — if the profile is sparse, make reasonable assumptions and STATE them clearly.

Return valid JSON:
{
  "risk_assessment": {
    "sebi_level": "Low|Low to Moderate|Moderate|Moderately High|High|Very High",
    "behavioral_narrative": "2-3 sentences describing the client's risk profile based on available information. Include behavioral insights if the conversation revealed how they react to market movements.",
    "evidence_quotes": ["relevant quotes from the conversation that informed this assessment"]
  },
  "asset_allocation": {
    "equity": <0-100>,
    "debt": <0-100>,
    "hybrid": <0-100>,
    "reasoning": "2-3 sentences explaining why this allocation suits this client"
  },
  "fund_recommendations": [
    {
      "fund_id": "exact id from fund list",
      "fund_name": "exact name from fund list",
      "category": "equity|debt|hybrid|index|solution",
      "allocation_percent": <number, all must sum to 100>,
      "monthly_sip": <INR amount>,
      "rationale": "1-2 sentences: why this fund for this client",
      "role": "core|satellite"
    }
  ],
  "sip_schedule": [
    { "fund_id": "...", "fund_name": "...", "monthly_amount": <INR> }
  ],
  "plan_summary": "3-4 sentence overview of the plan for the client to understand"
}

RULES:
- Recommend 4-8 funds depending on SIP capacity (fewer funds for smaller amounts)
- Core funds (65% of allocation): diversified, stable, long-term compounders
- Satellite funds (35%): growth-oriented, thematic, or tactical
- All allocation_percent values must sum to exactly 100
- Monthly SIP amounts should be in round numbers (multiples of 500)
- If SIP capacity is unknown, assume a reasonable range based on income and suggest accordingly
- Total monthly SIP must not exceed the client's stated or inferred investable surplus
- Always include the reasoning for fund selection
- Minimum SIP per fund: INR 500
- Consider the client's goals when selecting fund categories (e.g., ELSS for tax saving, retirement funds for retirement goals)
- Equity + Debt + Hybrid must sum to 100
- Mutual fund investments are subject to market risks. Read all scheme related documents carefully.
`;
}

export const MERGE_PROFILE_PROMPT = `You are merging a client's existing profile with new facts extracted from a recent conversation.

Rules:
- Newer information takes precedence over older information
- If there's a contradiction, keep the newer value but note the change
- Preserve all existing facts that aren't contradicted
- Combine goal lists (don't replace, append new goals)

Return the merged profile as valid JSON matching the same schema as the existing profile.

EXISTING PROFILE:
`;
```

**Step 2: Commit**

```bash
git add src/lib/client-planner/prompts.ts
git commit -m "feat: add Gemini prompts for fact extraction, gap analysis, and plan generation"
```

---

## Task 4: AI Pipeline Engine

**Files:**
- Create: `src/lib/client-planner/engine.ts`

**Step 1: Write the AI pipeline**

This orchestrates the five-step pipeline: transcribe → extract → merge → flag gaps → generate plan. Each step calls Gemini and returns structured JSON.

```typescript
import { geminiModel } from '@/lib/gemini';
import { EXTRACT_FACTS_PROMPT, FLAG_GAPS_PROMPT, buildPlanPrompt, MERGE_PROFILE_PROMPT } from './prompts';
import type { ExtractedFacts, ClientProfile, Gap, Plan } from './types';
import { GoogleGenerativeAI } from '@google/generative-ai';

function parseJSON(text: string): unknown {
  // Handle markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  return JSON.parse(jsonMatch[1] || jsonMatch[0]);
}

/**
 * Step 1: Transcribe audio using Gemini
 * Accepts a base64 audio string or a file URL
 */
export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    {
      inlineData: {
        data: audioBase64,
        mimeType,
      },
    },
    'Transcribe this audio completely. Include all speakers if multiple people are talking. Preserve the natural language (Hindi, English, or mixed). Output only the transcript text, nothing else.',
  ]);

  return result.response.text();
}

/**
 * Step 2: Extract financial facts from transcript
 */
export async function extractFacts(transcript: string): Promise<ExtractedFacts> {
  const result = await geminiModel.generateContent(EXTRACT_FACTS_PROMPT + transcript);
  const text = result.response.text();
  return parseJSON(text) as ExtractedFacts;
}

/**
 * Step 3: Merge new facts into existing profile
 */
export async function mergeProfile(
  existing: ClientProfile,
  newFacts: ExtractedFacts
): Promise<ClientProfile> {
  // If existing profile is empty, build directly from facts
  if (!existing || Object.keys(existing).length === 0) {
    return buildProfileFromFacts(newFacts);
  }

  const prompt = MERGE_PROFILE_PROMPT +
    JSON.stringify(existing, null, 2) +
    '\n\nNEW FACTS:\n' +
    JSON.stringify(newFacts, null, 2);

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  const merged = parseJSON(text) as ClientProfile;
  merged.last_updated = new Date().toISOString();
  return merged;
}

/**
 * Step 4: Flag gaps in the profile
 */
export async function flagGaps(profile: ClientProfile): Promise<Gap[]> {
  const result = await geminiModel.generateContent(
    FLAG_GAPS_PROMPT + JSON.stringify(profile, null, 2)
  );
  const text = result.response.text();
  return parseJSON(text) as Gap[];
}

/**
 * Step 5: Generate investment plan
 */
export async function generatePlan(profile: ClientProfile): Promise<{
  risk_assessment: Plan['risk_assessment'];
  asset_allocation: Plan['asset_allocation'];
  fund_recommendations: Plan['fund_recommendations'];
  sip_schedule: Plan['sip_schedule'];
  plan_summary: string;
}> {
  const prompt = buildPlanPrompt(JSON.stringify(profile, null, 2));
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text) as {
    risk_assessment: Plan['risk_assessment'];
    asset_allocation: Plan['asset_allocation'];
    fund_recommendations: Plan['fund_recommendations'];
    sip_schedule: Plan['sip_schedule'];
    plan_summary: string;
  };
}

/**
 * Build a ClientProfile directly from ExtractedFacts (first conversation)
 */
function buildProfileFromFacts(facts: ExtractedFacts): ClientProfile {
  const profile: ClientProfile = { last_updated: new Date().toISOString() };
  if (facts.age) profile.age = facts.age.value;
  if (facts.income) profile.income = facts.income.value;
  if (facts.expenses) profile.expenses = facts.expenses.value;
  if (facts.dependents) profile.dependents = facts.dependents.value;
  if (facts.existing_investments) profile.existing_investments = facts.existing_investments.value;
  if (facts.goals) profile.goals = facts.goals.map(g => g.value);
  if (facts.risk_behavior) profile.risk_behavior = facts.risk_behavior.value;
  if (facts.tax_situation) profile.tax_situation = facts.tax_situation.value;
  if (facts.sip_capacity) profile.sip_capacity = facts.sip_capacity.value;
  if (facts.other_facts) {
    profile.other = {};
    for (const f of facts.other_facts) {
      profile.other[f.label] = f.value;
    }
  }
  return profile;
}

/**
 * Full pipeline: transcribe → extract → merge → gap → plan
 * Returns all intermediate results for storage
 */
export async function runFullPipeline(
  audioBase64: string,
  mimeType: string,
  existingProfile: ClientProfile
): Promise<{
  transcript: string;
  extractedFacts: ExtractedFacts;
  mergedProfile: ClientProfile;
  gaps: Gap[];
  plan: Awaited<ReturnType<typeof generatePlan>>;
}> {
  const transcript = await transcribeAudio(audioBase64, mimeType);
  const extractedFacts = await extractFacts(transcript);
  const mergedProfile = await mergeProfile(existingProfile, extractedFacts);
  const gaps = await flagGaps(mergedProfile);
  const plan = await generatePlan(mergedProfile);
  return { transcript, extractedFacts, mergedProfile, gaps, plan };
}
```

**Step 2: Commit**

```bash
git add src/lib/client-planner/engine.ts
git commit -m "feat: add AI pipeline engine (transcribe, extract, merge, gaps, plan)"
```

---

## Task 5: Client API Routes

**Files:**
- Create: `src/app/api/clients/route.ts` — GET (list) + POST (create)
- Create: `src/app/api/clients/[id]/route.ts` — GET + PATCH + DELETE

**Step 1: Write the clients list/create route**

```typescript
// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const distributor = request.nextUrl.searchParams.get('distributor');
  if (!distributor) {
    return NextResponse.json({ error: 'distributor param required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('mfd_clients')
    .select('*')
    .eq('distributor_name', distributor)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { distributor_name, name, phone, notes } = body;

  if (!distributor_name || !name) {
    return NextResponse.json({ error: 'distributor_name and name required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('mfd_clients')
    .insert({ distributor_name, name, phone: phone || null, notes: notes || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

**Step 2: Write the client detail route**

```typescript
// src/app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  // Fetch client + latest plan + conversations
  const [clientRes, plansRes, convsRes] = await Promise.all([
    supabase.from('mfd_clients').select('*').eq('id', id).single(),
    supabase.from('mfd_plans').select('*').eq('client_id', id).order('version', { ascending: false }),
    supabase.from('mfd_conversations').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ]);

  if (clientRes.error) return NextResponse.json({ error: clientRes.error.message }, { status: 404 });

  return NextResponse.json({
    client: clientRes.data,
    plans: plansRes.data || [],
    conversations: convsRes.data || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('mfd_clients')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { error } = await supabase.from('mfd_clients').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

**Step 3: Commit**

```bash
git add src/app/api/clients/
git commit -m "feat: add client CRUD API routes"
```

---

## Task 6: Conversation Processing API Route

**Files:**
- Create: `src/app/api/clients/[id]/conversations/route.ts`

This is the big one — receives audio, runs the full pipeline, stores everything.

**Step 1: Write the conversation route**

```typescript
// src/app/api/clients/[id]/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { runFullPipeline } from '@/lib/client-planner/engine';
import type { ClientProfile } from '@/lib/client-planner/types';

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = getSupabase();

  // Get form data (audio file)
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File | null;

  if (!audioFile) {
    return NextResponse.json({ error: 'audio file required' }, { status: 400 });
  }

  // Convert to base64 for Gemini
  const arrayBuffer = await audioFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = audioFile.type || 'audio/webm';

  // Get existing profile from latest plan (if any)
  const { data: latestPlan } = await supabase
    .from('mfd_plans')
    .select('client_profile, version')
    .eq('client_id', clientId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const existingProfile: ClientProfile = latestPlan?.client_profile || {};
  const nextVersion = (latestPlan?.version || 0) + 1;

  // Upload audio to Supabase Storage
  const audioPath = `${clientId}/${Date.now()}.webm`;
  await supabase.storage.from('client-audio').upload(audioPath, audioFile, {
    contentType: mimeType,
  });

  // Run the full AI pipeline
  const result = await runFullPipeline(base64, mimeType, existingProfile);

  // Save conversation
  const { data: conversation, error: convError } = await supabase
    .from('mfd_conversations')
    .insert({
      client_id: clientId,
      audio_url: audioPath,
      transcript: result.transcript,
      extracted_facts: result.extractedFacts,
      gaps: result.gaps,
    })
    .select()
    .single();

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  // Save plan
  const { data: plan, error: planError } = await supabase
    .from('mfd_plans')
    .insert({
      client_id: clientId,
      conversation_id: conversation.id,
      version: nextVersion,
      client_profile: result.mergedProfile,
      risk_assessment: result.plan.risk_assessment,
      asset_allocation: result.plan.asset_allocation,
      fund_recommendations: result.plan.fund_recommendations,
      sip_schedule: result.plan.sip_schedule,
      gaps_remaining: result.gaps,
      status: 'draft',
      share_slug: generateSlug(),
    })
    .select()
    .single();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  // Update client timestamp
  await supabase
    .from('mfd_clients')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', clientId);

  return NextResponse.json({
    conversation,
    plan,
    summary: result.plan.plan_summary,
  }, { status: 201 });
}
```

**Step 2: Commit**

```bash
git add src/app/api/clients/[id]/conversations/route.ts
git commit -m "feat: add conversation processing route with full AI pipeline"
```

---

## Task 7: Plan Update API Route

**Files:**
- Create: `src/app/api/plans/[id]/route.ts`

For distributor edits (adjust allocation, swap funds, change status).

**Step 1: Write the plan update route**

```typescript
// src/app/api/plans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('mfd_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabase();

  // Allow updating: asset_allocation, fund_recommendations, sip_schedule, status
  const allowed = ['asset_allocation', 'fund_recommendations', 'sip_schedule', 'status'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('mfd_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

**Step 2: Commit**

```bash
git add src/app/api/plans/[id]/route.ts
git commit -m "feat: add plan GET/PATCH API route for distributor edits"
```

---

## Task 8: Shared Plan API Route

**Files:**
- Create: `src/app/api/plans/share/[slug]/route.ts`

Public endpoint for client-facing shared view.

**Step 1: Write the shared plan route**

```typescript
// src/app/api/plans/share/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabase();

  const { data: plan, error } = await supabase
    .from('mfd_plans')
    .select('*, mfd_clients(name, distributor_name)')
    .eq('share_slug', slug)
    .eq('status', 'finalized')
    .single();

  if (error || !plan) {
    return NextResponse.json({ error: 'Plan not found or not yet finalized' }, { status: 404 });
  }

  return NextResponse.json(plan);
}
```

**Step 2: Commit**

```bash
git add src/app/api/plans/share/
git commit -m "feat: add public shared plan endpoint by slug"
```

---

## Task 9: Client List Page

**Files:**
- Create: `src/app/clients/page.tsx`
- Create: `src/components/client-planner/ClientList.tsx`
- Create: `src/components/client-planner/NewClientDialog.tsx`
- Create: `src/components/client-planner/DistributorSetup.tsx`

**Step 1: Write the DistributorSetup component**

This handles first-visit distributor name prompt. Uses localStorage.

```typescript
// src/components/client-planner/DistributorSetup.tsx
'use client';

import { useState } from 'react';
import { UserCheck } from 'lucide-react';

export default function DistributorSetup({ onComplete }: { onComplete: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Welcome to Client Planner</h2>
            <p className="text-sm text-gray-500">Set up your distributor profile</p>
          </div>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rajesh Sharma"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onComplete(name.trim())}
        />
        <button
          onClick={() => name.trim() && onComplete(name.trim())}
          disabled={!name.trim()}
          className="mt-4 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Write the NewClientDialog component**

```typescript
// src/components/client-planner/NewClientDialog.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreate: (data: { name: string; phone?: string; notes?: string }) => void;
}

export default function NewClientDialog({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">New Client</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client's name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any initial notes about this client"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onCreate({ name: name.trim(), phone: phone.trim() || undefined, notes: notes.trim() || undefined })}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Write the ClientList component**

```typescript
// src/components/client-planner/ClientList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Users, FileText, Clock } from 'lucide-react';
import type { Client } from '@/lib/client-planner/types';
import NewClientDialog from './NewClientDialog';
import DistributorSetup from './DistributorSetup';

export default function ClientList() {
  const [distributor, setDistributor] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClient, setShowNewClient] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mfd_distributor_name');
    if (saved) setDistributor(saved);
    else setLoading(false);
  }, []);

  const fetchClients = useCallback(async (name: string) => {
    setLoading(true);
    const res = await fetch(`/api/clients?distributor=${encodeURIComponent(name)}`);
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (distributor) fetchClients(distributor);
  }, [distributor, fetchClients]);

  const handleSetup = (name: string) => {
    localStorage.setItem('mfd_distributor_name', name);
    setDistributor(name);
  };

  const handleCreate = async (data: { name: string; phone?: string; notes?: string }) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, distributor_name: distributor }),
    });
    if (res.ok) {
      setShowNewClient(false);
      fetchClients(distributor!);
    }
  };

  if (!distributor && !loading) {
    return <DistributorSetup onComplete={handleSetup} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Planner</h1>
          <p className="text-sm text-gray-500 mt-1">
            <Users className="w-4 h-4 inline mr-1" />
            {distributor} &middot; {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Client
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-500 mb-6">Add your first client to get started</p>
          <button
            onClick={() => setShowNewClient(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Client
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  {client.phone && (
                    <p className="text-sm text-gray-500 mt-0.5">{client.phone}</p>
                  )}
                  {client.notes && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{client.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(client.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <FileText className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNewClient && (
        <NewClientDialog
          onClose={() => setShowNewClient(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
```

**Step 4: Write the clients page**

```typescript
// src/app/clients/page.tsx
import ClientList from '@/components/client-planner/ClientList';

export const metadata = {
  title: 'Client Planner - Mutual Fund Dost',
  description: 'Manage client investment plans powered by AI conversation analysis',
};

export default function ClientsPage() {
  return <ClientList />;
}
```

**Step 5: Commit**

```bash
git add src/app/clients/ src/components/client-planner/
git commit -m "feat: add client list page with distributor setup and new client dialog"
```

---

## Task 10: Audio Recorder Hook

**Files:**
- Create: `src/hooks/use-audio-recorder.ts`

**Step 1: Write the audio recorder hook**

Uses MediaRecorder API to capture audio from the microphone. Returns a Blob when recording stops.

```typescript
// src/hooks/use-audio-recorder.ts
'use client';

import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach(t => t.stop());
        if (resolveRef.current) {
          resolveRef.current(blob);
          resolveRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        resolveRef.current = resolve;
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  return { isRecording, duration, startRecording, stopRecording, error };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-audio-recorder.ts
git commit -m "feat: add audio recorder hook for client conversations"
```

---

## Task 11: Client Planner Page (Main Workspace)

**Files:**
- Create: `src/app/clients/[id]/page.tsx`
- Create: `src/components/client-planner/ClientPlanner.tsx`
- Create: `src/components/client-planner/AudioInput.tsx`
- Create: `src/components/client-planner/ConversationHistory.tsx`
- Create: `src/components/client-planner/PlanView.tsx`
- Create: `src/components/client-planner/ProfileCard.tsx`
- Create: `src/components/client-planner/GapsCard.tsx`

This is the largest task. The page has two columns: conversation history (left) and current plan (right), with an audio input bar.

**Step 1: Write the AudioInput component**

Records audio or accepts file upload. Shows recording state with timer.

```typescript
// src/components/client-planner/AudioInput.tsx
'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Upload, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

interface Props {
  clientId: string;
  onProcessed: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioInput({ clientId, onProcessed }: Props) {
  const { isRecording, duration, startRecording, stopRecording, error } = useAudioRecorder();
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleStopAndProcess = async () => {
    const blob = await stopRecording();
    if (blob) await processAudio(blob);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processAudio(file);
    e.target.value = '';
  };

  const processAudio = async (audio: Blob | File) => {
    setProcessing(true);
    setStatus('Transcribing & analyzing...');

    const formData = new FormData();
    formData.append('audio', audio);

    try {
      const res = await fetch(`/api/clients/${clientId}/conversations`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Processing failed');
      }

      setStatus('Plan generated!');
      onProcessed();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Error processing audio');
    } finally {
      setProcessing(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        {isRecording ? (
          <>
            <button
              onClick={handleStopAndProcess}
              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop ({formatDuration(duration)})
            </button>
            <span className="text-sm text-red-600 animate-pulse">Recording...</span>
          </>
        ) : processing ? (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">{status}</span>
          </div>
        ) : (
          <>
            <button
              onClick={startRecording}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mic className="w-4 h-4" />
              Record Conversation
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Audio
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {status && <span className="text-sm text-green-600">{status}</span>}
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
```

**Step 2: Write the ConversationHistory component**

```typescript
// src/components/client-planner/ConversationHistory.tsx
'use client';

import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { Conversation } from '@/lib/client-planner/types';

export default function ConversationHistory({ conversations }: { conversations: Conversation[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Record or upload a conversation to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <div key={conv.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-700">
                {new Date(conv.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            {expanded === conv.id ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expanded === conv.id && conv.transcript && (
            <div className="px-3 pb-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mt-2 mb-1">Transcript</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {conv.transcript}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Write the ProfileCard component**

```typescript
// src/components/client-planner/ProfileCard.tsx
'use client';

import { User, AlertCircle, CheckCircle } from 'lucide-react';
import type { ClientProfile } from '@/lib/client-planner/types';

const PROFILE_FIELDS: { key: keyof ClientProfile; label: string }[] = [
  { key: 'age', label: 'Age' },
  { key: 'income', label: 'Income' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'dependents', label: 'Dependents' },
  { key: 'existing_investments', label: 'Existing Investments' },
  { key: 'risk_behavior', label: 'Risk Behavior' },
  { key: 'tax_situation', label: 'Tax Situation' },
  { key: 'sip_capacity', label: 'SIP Capacity' },
];

export default function ProfileCard({ profile }: { profile: ClientProfile }) {
  const filledFields = PROFILE_FIELDS.filter(f => profile[f.key]);
  const completeness = Math.round((filledFields.length / PROFILE_FIELDS.length) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Client Profile
        </h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          completeness >= 75 ? 'bg-green-100 text-green-700' :
          completeness >= 40 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {completeness}% complete
        </span>
      </div>
      <div className="space-y-2.5">
        {PROFILE_FIELDS.map(({ key, label }) => {
          const value = profile[key];
          if (key === 'goals' || key === 'other' || key === 'last_updated') return null;
          return (
            <div key={key} className="flex items-start gap-2">
              {value ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
              )}
              <div>
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <p className="text-sm text-gray-800">{(value as string) || '—'}</p>
              </div>
            </div>
          );
        })}
        {profile.goals && profile.goals.length > 0 && (
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-medium text-gray-500">Goals</span>
              <ul className="text-sm text-gray-800 list-disc list-inside">
                {profile.goals.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Write the GapsCard component**

```typescript
// src/components/client-planner/GapsCard.tsx
'use client';

import { AlertTriangle, MessageCircle } from 'lucide-react';
import type { Gap } from '@/lib/client-planner/types';

const PRIORITY_STYLES = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  low: 'bg-gray-50 border-gray-200 text-gray-600',
};

export default function GapsCard({ gaps }: { gaps: Gap[] }) {
  if (gaps.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        Next Conversation
      </h3>
      <div className="space-y-2">
        {gaps.map((gap, i) => (
          <div key={i} className={`border rounded-lg p-3 ${PRIORITY_STYLES[gap.priority]}`}>
            <div className="flex items-start gap-2">
              <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium uppercase">{gap.area}</p>
                <p className="text-sm mt-0.5">&ldquo;{gap.suggested_question}&rdquo;</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 5: Write the PlanView component**

This shows the plan with editable allocations and fund recommendations.

```typescript
// src/components/client-planner/PlanView.tsx
'use client';

import { useState } from 'react';
import { PieChart, TrendingUp, IndianRupee, Shield, Pencil, Check, X } from 'lucide-react';
import type { Plan, FundRecommendation, AssetAllocation } from '@/lib/client-planner/types';

interface Props {
  plan: Plan;
  onUpdate: (updates: Partial<Plan>) => Promise<void>;
}

export default function PlanView({ plan, onUpdate }: Props) {
  const [editingAllocation, setEditingAllocation] = useState(false);
  const [allocation, setAllocation] = useState<AssetAllocation>(plan.asset_allocation);
  const [saving, setSaving] = useState(false);

  const handleSaveAllocation = async () => {
    setSaving(true);
    await onUpdate({ asset_allocation: allocation });
    setEditingAllocation(false);
    setSaving(false);
  };

  const totalSIP = plan.sip_schedule.reduce((sum, s) => sum + s.monthly_amount, 0);

  return (
    <div className="space-y-4">
      {/* Risk Assessment */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-600" />
          Risk Assessment
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {plan.risk_assessment.sebi_level}
          </span>
          <span className="text-xs text-gray-400">SEBI Risk Level</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{plan.risk_assessment.behavioral_narrative}</p>
        {plan.risk_assessment.evidence_quotes?.length > 0 && (
          <div className="mt-3 space-y-1">
            {plan.risk_assessment.evidence_quotes.map((q, i) => (
              <p key={i} className="text-xs text-gray-500 italic">&ldquo;{q}&rdquo;</p>
            ))}
          </div>
        )}
      </div>

      {/* Asset Allocation */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Asset Allocation
          </h3>
          {!editingAllocation ? (
            <button onClick={() => setEditingAllocation(true)} className="text-gray-400 hover:text-blue-600">
              <Pencil className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button onClick={handleSaveAllocation} disabled={saving} className="text-green-600 hover:text-green-700">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setAllocation(plan.asset_allocation); setEditingAllocation(false); }} className="text-gray-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-4 mb-3">
          {(['equity', 'debt', 'hybrid'] as const).map(type => (
            <div key={type} className="flex-1">
              <label className="text-xs font-medium text-gray-500 capitalize">{type}</label>
              {editingAllocation ? (
                <input
                  type="number"
                  value={allocation[type]}
                  onChange={(e) => setAllocation({ ...allocation, [type]: Number(e.target.value) })}
                  className="w-full mt-1 px-2 py-1 text-lg font-bold border border-gray-300 rounded text-center"
                  min={0}
                  max={100}
                />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{allocation[type]}%</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600">{plan.asset_allocation.reasoning}</p>
      </div>

      {/* Fund Recommendations */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Fund Recommendations
        </h3>
        <div className="space-y-3">
          {plan.fund_recommendations.map((rec: FundRecommendation, i: number) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{rec.fund_name}</p>
                  <p className="text-xs text-gray-500">{rec.category} &middot; {rec.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{rec.allocation_percent}%</p>
                  <p className="text-xs text-gray-500">
                    <IndianRupee className="w-3 h-3 inline" />
                    {rec.monthly_sip.toLocaleString('en-IN')}/mo
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">{rec.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SIP Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <IndianRupee className="w-4 h-4" />
            Total Monthly SIP
          </h3>
          <p className="text-2xl font-bold text-blue-900">
            ₹{totalSIP.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Status / Finalize */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          plan.status === 'finalized' ? 'bg-green-100 text-green-700' :
          plan.status === 'reviewed' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
        </span>
        {plan.status !== 'finalized' && (
          <button
            onClick={() => onUpdate({ status: 'finalized' })}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Finalize Plan
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 6: Write the ClientPlanner container component**

```typescript
// src/components/client-planner/ClientPlanner.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Share2, FileDown, History } from 'lucide-react';
import Link from 'next/link';
import type { Client, Conversation, Plan } from '@/lib/client-planner/types';
import AudioInput from './AudioInput';
import ConversationHistory from './ConversationHistory';
import PlanView from './PlanView';
import ProfileCard from './ProfileCard';
import GapsCard from './GapsCard';

export default function ClientPlanner({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}`);
    if (res.ok) {
      const data = await res.json();
      setClient(data.client);
      setPlans(data.plans);
      setConversations(data.conversations);
      if (data.plans.length > 0 && selectedVersion === null) {
        setSelectedVersion(data.plans[0].version);
      }
    }
    setLoading(false);
  }, [clientId, selectedVersion]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentPlan = plans.find(p => p.version === selectedVersion) || plans[0];

  const handlePlanUpdate = async (updates: Partial<Plan>) => {
    if (!currentPlan) return;
    const res = await fetch(`/api/plans/${currentPlan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) fetchData();
  };

  const handleShare = () => {
    if (currentPlan?.share_slug) {
      const url = `${window.location.origin}/plan/${currentPlan.share_slug}`;
      navigator.clipboard.writeText(url);
      alert('Plan link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-96 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Client not found</p>
        <Link href="/clients" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Back to clients</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
            {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {plans.length > 1 && (
            <select
              value={selectedVersion ?? ''}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2"
            >
              {plans.map(p => (
                <option key={p.version} value={p.version}>
                  v{p.version} — {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </option>
              ))}
            </select>
          )}
          {currentPlan?.status === 'finalized' && (
            <button onClick={handleShare} className="flex items-center gap-1 text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: conversations */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <History className="w-4 h-4" />
            Conversations ({conversations.length})
          </h2>
          <ConversationHistory conversations={conversations} />
          {currentPlan && (
            <>
              <ProfileCard profile={currentPlan.client_profile} />
              <GapsCard gaps={currentPlan.gaps_remaining} />
            </>
          )}
        </div>

        {/* Right column: plan */}
        <div className="lg:col-span-2">
          {currentPlan ? (
            <PlanView plan={currentPlan} onUpdate={handlePlanUpdate} />
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg mb-2">No plan yet</p>
              <p className="text-sm">Record a conversation to generate the first plan</p>
            </div>
          )}
        </div>
      </div>

      {/* Audio input bar (sticky bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <AudioInput clientId={clientId} onProcessed={fetchData} />
      </div>

      {/* Spacer for fixed audio bar */}
      <div className="h-20" />
    </div>
  );
}
```

**Step 7: Write the page wrapper**

```typescript
// src/app/clients/[id]/page.tsx
import ClientPlanner from '@/components/client-planner/ClientPlanner';

export const metadata = {
  title: 'Client Plan - Mutual Fund Dost',
};

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientPlanner clientId={id} />;
}
```

**Step 8: Commit**

```bash
git add src/app/clients/[id]/ src/components/client-planner/AudioInput.tsx src/components/client-planner/ConversationHistory.tsx src/components/client-planner/PlanView.tsx src/components/client-planner/ProfileCard.tsx src/components/client-planner/GapsCard.tsx src/components/client-planner/ClientPlanner.tsx
git commit -m "feat: add client planner page with audio input, plan view, profile card, and gaps"
```

---

## Task 12: Shared Plan Page (Client-Facing)

**Files:**
- Create: `src/app/plan/[slug]/page.tsx`
- Create: `src/components/client-planner/SharedPlanView.tsx`

**Step 1: Write the SharedPlanView component**

Clean, read-only view of a finalized plan.

```typescript
// src/components/client-planner/SharedPlanView.tsx
'use client';

import { useState, useEffect } from 'react';
import { PieChart, TrendingUp, IndianRupee, Shield, FileText } from 'lucide-react';
import type { Plan } from '@/lib/client-planner/types';

export default function SharedPlanView({ slug }: { slug: string }) {
  const [plan, setPlan] = useState<(Plan & { mfd_clients: { name: string; distributor_name: string } }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/plans/share/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(setPlan)
      .catch(() => setError('Plan not found or not yet finalized'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse"><div className="h-8 bg-gray-200 rounded w-64 mb-4" /><div className="h-96 bg-gray-100 rounded-xl" /></div>;
  if (error || !plan) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">{error}</div>;

  const totalSIP = plan.sip_schedule.reduce((sum, s) => sum + s.monthly_amount, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Investment Plan</h1>
        </div>
        <p className="text-sm text-gray-500">
          Prepared for {plan.mfd_clients.name} by {plan.mfd_clients.distributor_name}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Version {plan.version} &middot; {new Date(plan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="space-y-6">
        {/* Risk */}
        <div className="border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-600" />
            Your Risk Profile
          </h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {plan.risk_assessment.sebi_level}
          </span>
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">{plan.risk_assessment.behavioral_narrative}</p>
        </div>

        {/* Allocation */}
        <div className="border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-blue-600" />
            Asset Allocation
          </h2>
          <div className="flex gap-6 mb-3">
            {(['equity', 'debt', 'hybrid'] as const).map(type => (
              <div key={type} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{plan.asset_allocation[type]}%</p>
                <p className="text-xs text-gray-500 capitalize">{type}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600">{plan.asset_allocation.reasoning}</p>
        </div>

        {/* Funds */}
        <div className="border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Recommended Funds
          </h2>
          <div className="space-y-3">
            {plan.fund_recommendations.map((rec, i) => (
              <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{rec.fund_name}</p>
                  <p className="text-xs text-gray-500">{rec.category} &middot; {rec.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{rec.allocation_percent}%</p>
                  <p className="text-xs text-gray-500">₹{rec.monthly_sip.toLocaleString('en-IN')}/mo</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total SIP */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
          <h2 className="font-semibold text-blue-900 flex items-center gap-2">
            <IndianRupee className="w-4 h-4" />
            Total Monthly SIP
          </h2>
          <p className="text-2xl font-bold text-blue-900">₹{totalSIP.toLocaleString('en-IN')}</p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Mutual fund investments are subject to market risks. Read all scheme related documents carefully.
          Past performance is not indicative of future results.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Write the page**

```typescript
// src/app/plan/[slug]/page.tsx
import SharedPlanView from '@/components/client-planner/SharedPlanView';

export const metadata = {
  title: 'Investment Plan - Mutual Fund Dost',
};

export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SharedPlanView slug={slug} />;
}
```

**Step 3: Commit**

```bash
git add src/app/plan/ src/components/client-planner/SharedPlanView.tsx
git commit -m "feat: add shared plan page for client-facing view"
```

---

## Task 13: Navigation Update

**Files:**
- Modify: `src/components/ui/Header.tsx`

**Step 1: Add Client Planner link to desktop and mobile nav**

Add a "Client Planner" link in the header navigation, between "Daily Brief" and "Discover Funds" in both desktop and mobile nav. Use the same styling pattern as existing links.

Desktop nav — add after the Daily Brief link:
```tsx
<Link
  href="/clients"
  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
>
  Client Planner
</Link>
```

Mobile nav — add after the Daily Brief link:
```tsx
<Link
  href="/clients"
  className="text-sm font-medium text-gray-700 hover:text-blue-600 py-2"
  onClick={() => setMobileMenuOpen(false)}
>
  Client Planner
</Link>
```

**Step 2: Commit**

```bash
git add src/components/ui/Header.tsx
git commit -m "feat: add Client Planner to site navigation"
```

---

## Task 14: Build & Lint

**Step 1: Run lint**

```bash
cd /root/claudecode/mutual-fund-dost && npm run lint
```

Fix any lint errors that appear. Common issues will be unused imports or React compiler warnings.

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds with all new routes detected:
- `/clients` (static)
- `/clients/[id]` (dynamic)
- `/plan/[slug]` (dynamic)
- `/api/clients` (API route)
- `/api/clients/[id]` (API route)
- `/api/clients/[id]/conversations` (API route)
- `/api/plans/[id]` (API route)
- `/api/plans/share/[slug]` (API route)

Fix any build errors.

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve lint and build errors for client planner"
```

---

## Task 15: Database Migration Execution & Smoke Test

**Step 1: Run the migration**

Connect to the shared Supabase instance (port 8000) and execute `supabase/migration-v4-client-planner.sql`.

**Step 2: Create storage bucket**

In Supabase dashboard or SQL editor, ensure the `client-audio` bucket exists.

**Step 3: Start dev server and smoke test**

```bash
npm run dev
```

Manual test checklist:
- [ ] Visit `/clients` — should show distributor setup prompt
- [ ] Enter distributor name — should save to localStorage and show empty client list
- [ ] Create a new client — should appear in the list
- [ ] Click client — should go to `/clients/[id]` with empty state
- [ ] Record a short audio clip (even just "test client, age 30, earns 10 lakhs")
- [ ] Wait for processing — should see transcript, extracted facts, and generated plan
- [ ] Check that plan shows: risk assessment, allocation, fund recommendations, SIP schedule
- [ ] Check gaps card shows suggested next questions
- [ ] Click "Finalize Plan" — status should change
- [ ] Copy share link — visit `/plan/[slug]` — should show read-only plan

**Step 4: Commit if any runtime fixes needed**

```bash
git add -A
git commit -m "fix: runtime fixes from smoke testing"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Database migration | `supabase/migration-v4-client-planner.sql` |
| 2 | TypeScript types | `src/lib/client-planner/types.ts` |
| 3 | Gemini prompts | `src/lib/client-planner/prompts.ts` |
| 4 | AI pipeline engine | `src/lib/client-planner/engine.ts` |
| 5 | Client CRUD API | `src/app/api/clients/` |
| 6 | Conversation processing API | `src/app/api/clients/[id]/conversations/route.ts` |
| 7 | Plan update API | `src/app/api/plans/[id]/route.ts` |
| 8 | Shared plan API | `src/app/api/plans/share/[slug]/route.ts` |
| 9 | Client list page + components | `src/app/clients/page.tsx` + 3 components |
| 10 | Audio recorder hook | `src/hooks/use-audio-recorder.ts` |
| 11 | Client planner page + 5 components | `src/app/clients/[id]/page.tsx` + 5 components |
| 12 | Shared plan page | `src/app/plan/[slug]/page.tsx` + 1 component |
| 13 | Navigation update | `src/components/ui/Header.tsx` |
| 14 | Build & lint | — |
| 15 | Migration execution & smoke test | — |

Total: ~15 new files, 1 modified file, 1 migration SQL file.
