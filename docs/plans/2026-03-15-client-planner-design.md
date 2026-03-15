# Client Planner — Design Document

**Date:** 2026-03-15
**Status:** Approved for implementation

## What This Is

A distributor-facing back-office tool within mutual-fund-dost. Distributor records or uploads a client conversation (or dictates notes), AI transcribes and extracts financial facts, generates a personalized investment plan, and the distributor edits/finalizes before sharing with the client.

Inspired by the hn-invest personal advisory system — deep profiling, behavioral risk assessment, goal-based planning, SIP schedules — productized for any distributor-client relationship.

## Core Loop

1. Distributor opens a new client or selects an existing one
2. Records a conversation / uploads audio / dictates notes into mic
3. AI transcribes → extracts whatever facts are present → merges with existing profile
4. AI generates or updates the investment plan (versioned)
5. Distributor reviews, edits allocations/funds/SIPs, finalizes
6. Shares via PDF + shareable client link
7. Next conversation deepens the plan — version history preserved

## Scope

- India-only (no international investing, no DTA, no multi-currency)
- HDFC fund universe only (60 schemes)
- Pure MF planning (no insurance, no emergency fund, no debt payoff)
- All SIPs in INR

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary user | Distributor (not client) | Distributor is the expert; AI is back-office |
| Conversation depth | Progressive (not single-shot) | Matches real client relationships |
| AI output | Editable draft (not final) | Distributor is the author, AI is the engine |
| Sharing | PDF + client link | Formal handoff + ongoing reference |
| Plan lifecycle | Living plan with versions | Evolves over time like hn-invest did |
| Identity | Simple name field, no auth | Distributor name in localStorage, client name in DB |

## Data Model

### Distributor
- Name (free text, stored in localStorage)
- No auth — first visit prompts for name

### Client
- `id` (uuid, primary key)
- `distributor_name` (text)
- `name` (text, required)
- `phone` (text, optional)
- `notes` (text, optional)
- `created_at`, `updated_at`

### Conversation
- `id` (uuid, primary key)
- `client_id` (FK → client)
- `audio_url` (text, Supabase Storage path)
- `transcript` (text)
- `extracted_facts` (jsonb — whatever the AI pulled out)
- `gaps` (jsonb — what's still missing, prioritized)
- `created_at`

### Plan
- `id` (uuid, primary key)
- `client_id` (FK → client)
- `conversation_id` (FK → conversation that triggered this version)
- `version` (integer, auto-increment per client)
- `client_profile` (jsonb — merged facts snapshot)
- `risk_assessment` (jsonb — SEBI level + behavioral narrative + evidence quotes)
- `asset_allocation` (jsonb — equity/debt/hybrid percentages + reasoning)
- `fund_recommendations` (jsonb — funds with allocation %, SIP amounts, rationale, core/satellite role)
- `sip_schedule` (jsonb — fund, monthly amount, total)
- `gaps_remaining` (jsonb — prioritized missing info)
- `status` (enum: draft, reviewed, finalized)
- `share_slug` (text, unique — for client link)
- `created_at`

## AI Pipeline

All steps use Gemini 2.0 Flash.

### Step 1: Transcribe
- Audio → Gemini transcription
- Handles: distributor-client dialogue, solo dictation, Hindi-English mix, incomplete thoughts

### Step 2: Extract Facts
- Forgiving extraction — pulls out whatever financial facts exist
- Categories (all optional): income/expenses, existing investments, goals with timelines, risk behavior/attitudes, tax situation, SIP capacity
- Includes confidence level per fact and supporting quotes from transcript
- No minimum required — even "client is 35 and wants to start SIPs" is enough

### Step 3: Merge with Existing Profile
- First conversation → facts become the profile
- Subsequent conversations → merge new with existing, prefer newer, flag contradictions

### Step 4: Flag Gaps
- Check which important areas are still uncovered
- Generate prioritized list with suggested questions for next conversation
- Priority levels: high (blocks good recommendations), medium (would improve plan), low (nice to have)

### Step 5: Generate Plan
- Merged profile → planning prompt
- Works with whatever data is available — sparse input produces simpler plan with stated assumptions
- Uses existing fund scoring logic where applicable
- Produces: risk assessment, asset allocation, fund picks, SIP schedule

## Pages

### `/clients` — Client List
- All clients for this distributor
- Card per client: name, last conversation date, plan version, status
- "New Client" button (just needs a name)
- Click → client planner page

### `/clients/[id]` — Client Planner (main workspace)
- **Top:** Client name + info + edit
- **Left column:** Conversation history (recordings, transcripts, dates)
- **Right column:** Current plan
  - Profile summary (what AI knows, with confidence indicators)
  - Risk assessment (SEBI level + behavioral narrative)
  - Asset allocation (editable percentages)
  - Fund recommendations (editable — swap funds, change amounts)
  - SIP schedule with sanity check against stated surplus
  - Gaps & suggested next questions
- **Action bar:** Record / Upload / Export PDF / Share link
- **Version dropdown:** View older plan versions

### `/plan/[slug]` — Client-Facing Shared View
- Read-only, clean, professional layout
- Shows: plan summary, allocation, fund recommendations, SIP schedule
- Branded with distributor name
- No auth required — accessible via slug URL

## Plan Output Structure

### Client Profile Card
- Extracted facts with confidence (from conversation vs assumed)
- Key quotes as evidence

### Risk Assessment
- SEBI risk level derived from conversation (not a quiz score)
- Behavioral narrative ("client held through COVID, comfortable with drawdowns")

### Asset Allocation
- Equity / Debt / Hybrid percentages with reasoning
- Editable by distributor — fund picks recalculate on change

### Fund Recommendations
- 4-8 HDFC funds based on SIP capacity
- Per fund: name, category, allocation %, monthly SIP, rationale
- Core/Satellite labels
- Editable — distributor can swap or adjust

### SIP Schedule
- Table: Fund | Monthly SIP | Start date
- Total monthly SIP
- Sanity check against client's stated investable surplus

### Gaps & Next Steps
- Prioritized missing information
- Suggested questions for next conversation
