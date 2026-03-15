# HANDOVER — mutual-fund-dost

> AI-powered HDFC mutual fund advisory platform for distributors and investors

## Status: PRODUCTION-READY

**Version:** 0.2.0 | **Started:** January 2026 | **Last Updated:** March 2026

## Tech Stack

- **Framework:** Next.js 16.1.4 (App Router)
- **UI:** React 19.2.3 + Tailwind CSS 4 + Lucide icons
- **Database:** Supabase (PostgreSQL with RLS)
- **AI:** Google Gemini 2.0 Flash (`@google/generative-ai` 0.24.1)
- **Data Sources:** AMFI NAV API, mfapi.in, hdfcfund.com, RSS news feeds
- **Deployment:** Vercel with 3 cron jobs
- **GitHub:** https://github.com/harayanan/mutual-fund-dost

## Key Features

- **Risk Profiler:** 6-question SEBI-compliant questionnaire → 6 risk levels
- **Fund Screener:** Sortable, filterable table of 59 HDFC funds with live NAV
- **Fund Comparison:** Side-by-side fund comparison modal
- **Recommendation Engine:** Core+Satellite portfolios (70/30 split) with modular scoring
- **News Analysis:** RSS → Gemini AI relevance scoring → cached in Supabase
- **Daily Brief:** AI-generated distributor briefs with talking points & action items

## Source Structure (45 files)

```
src/
├── app/
│   ├── api/
│   │   ├── cron/refresh-funds/       # Daily NAV + CAGR + managers (7:30 PM IST)
│   │   ├── cron/refresh-news/        # RSS → Gemini analysis (1:00 AM IST)
│   │   ├── cron/refresh-daily-brief/ # Distributor briefs (2:00 AM IST)
│   │   ├── daily-brief/             # GET + refresh endpoints
│   │   ├── funds/route.ts           # GET with filters
│   │   ├── metadata/route.ts        # Sync status
│   │   ├── news/                    # GET cached + refresh
│   │   └── recommend/route.ts       # POST risk-based basket
│   ├── daily-brief/page.tsx
│   ├── discover/page.tsx            # Risk profiler + recommendations
│   ├── funds/page.tsx               # Fund screener
│   ├── news/page.tsx
│   └── page.tsx                     # Home
├── components/                       # 15 React components
├── lib/
│   ├── advisor-engine.ts            # 594 lines — SEBI risk levels, scoring
│   ├── gemini.ts                    # 211 lines — Gemini client + prompts
│   ├── fund-data-fetcher.ts         # 215 lines — AMFI/mfapi.in
│   ├── fund-manager-scraper.ts      # 126 lines — hdfcfund.com scraper
│   ├── news-fetcher.ts              # 72 lines — RSS aggregation
│   ├── supabase.ts
│   └── recommendation/             # Modular engine (6 files)
└── data/hdfc-funds.ts               # 59 HDFC funds (1,468 lines)
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anonymous key
GEMINI_API_KEY               — Google Gemini API key
CRON_SECRET                  — Vercel cron authentication
```

## Quick Start

```bash
npm install
cp .env.example .env.local   # Fill in Supabase + Gemini keys
npm run dev                   # localhost:3000
```

## Database Tables

- `funds` — Fund metadata + live NAV
- `fund_performance` — Historical CAGR returns
- `news_cache` — AI-analyzed news (4-hour TTL)
- `data_metadata` — Sync timestamps

## Git Status

- **Branch:** main (up to date with origin)
- **Clean:** No uncommitted changes
- **Vercel Project ID:** prj_OwWNQ62NIJSM4M5BCJB0fhBXdSR2

## Known Constraints

1. Vercel Hobby Plan limits cron to once/day (was 6h intervals)
2. Two funds consistently 404 on hdfcfund.com (skip list handles this)
3. Brand obfuscated: HDFC → XYZ in UI/prompts (fund names preserved in data)
4. News cache TTL: 4 hours (reduces Gemini API costs)

## Architecture Decisions

- Rate limiting: 200ms (AMFI), 500ms (hdfcfund.com) between requests
- Caching: RSS → Gemini → Supabase (no per-request AI calls)
- Fallback: All endpoints degrade to static data if Supabase unavailable
- Core+Satellite: 70% diversified stable + 30% thematic growth

## Recent Session (2026-02-14)

**What was done:**
- Fixed 2 ESLint errors (React 19 compiler compliance):
  - Replaced `useEffect` initialization with render-time state adjustment in discover page (avoids `set-state-in-effect` rule)
  - Wrapped donut chart segment computation in `useMemo` with immutable `slice + reduce` (avoids `immutability` rule)
- Fixed 7 ESLint warnings:
  - Removed unused imports (`recommendFundBasket`, `Fund`, `FundBasket`)
  - Prefixed omitted destructured vars with `_` in news routes
  - Configured ESLint `no-unused-vars` to allow `_` prefix convention
- **Result:** 0 errors, 0 warnings — lint is fully clean
- Deployed to production via Vercel (commit `e143159`)

## Next Steps

1. Add unit tests (recommendation engine, CAGR calculations)
2. Error monitoring (Sentry)
3. Cache fund screener results on /api/funds
4. Support other fund families (Axis, ICICI, SBI)

## Session: 2026-02-25

### What was done (VPS storage optimization)
- **Dedicated Supabase instance STOPPED** — the mfd dedicated instance (port 9300) was stopped to reclaim disk. It had zero tables — migration from shared DB never happened.
- Compose file preserved at `/root/supabase-stacks/mfd/docker-compose.yml`. Restart with: `cd /root/supabase-stacks/mfd && docker compose -p supabase-mfd up -d`
- **All mfd data is safe** in the shared Supabase (port 8000): 5 tables (mfd_daily_briefs, mfd_data_metadata, mfd_fund_performance, mfd_funds, mfd_news_cache)
- App still points to shared instance — no impact on functionality.

## Session: 2026-03-15

### What was done (News & Daily Brief fix)

**Problem:** News Insights and Daily Brief pages showed no data. Three root causes found:

1. **Vercel env vars pointed to old Supabase cloud** (`pbvhguyczpviagwdmeih.supabase.co`) instead of self-hosted (`supabase.xisunknown.com`). The cloud instance is inaccessible (India ban). Fixed by passing `--build-env` flags in deploy.
2. **Indian RSS feeds geo-block Vercel IPs** (US-based). All 4 RSS sources (ET, Moneycontrol, Livemint) return nothing from Vercel serverless. Fixed by moving RSS fetch to VPS cron.
3. **Vercel cron jobs hadn't run since Feb 14.** Hobby plan limitations + above issues.

**Changes:**
- `src/app/api/news/route.ts` — GET auto-refreshes if no today's data (fallback for when VPS cron fails)
- `src/app/api/daily-brief/route.ts` — GET auto-generates brief if none for today
- `src/lib/news-fetcher.ts` — Uses global `fetch()` + `parseString()` instead of `rss-parser`'s HTTP (for serverless compat)
- `scripts/refresh-news.mjs` — Standalone Node script: RSS → Gemini → Supabase (runs on VPS)
- `scripts/refresh-news.sh` — Shell wrapper with env loading and log rotation
- `scripts/deploy.sh` — Vercel deploy with `--build-env` flags (required for CLI deploys)
- Removed stale `PROMPT-LOG.md`

**VPS Cron:** `0 1,13 * * *` (6:30 AM + 6:30 PM IST) — runs `scripts/refresh-news.sh`

**Deploy note:** Always use `scripts/deploy.sh` or pass `--build-env` flags. Plain `vercel deploy --prod` won't include env vars.

**Commits:** `66d0764`, `1cdbe52`, `013d9e6`

### What was done (Monday Morning Brief — new feature)

**New page:** `/monday-brief` — a premium 3-page print-ready weekly playbook for distributors. Generated by Gemini 2.0 Flash using 7 days of accumulated news + fund performance data.

**3-page layout:**
- **Page 1 — Market Context:** Market pulse strip (7 metrics), Nifty week summary, big picture narrative (3-4 paragraphs), top 5 stories with urgency badges and client segments
- **Page 2 — Distributor Playbook:** 8-10 action items with timing, SIP Wins stat callout, 5 conversation scripts by persona (Panicking Client, Opportunity Seeker, SIP Investor, HNI Client, New Prospect)
- **Page 3 — Intelligence:** Fund spotlights (Flexi Cap + BAF hero cards with returns, elevator pitch, SIP story), performance heatmap (7 categories × 4 periods), week ahead radar, regulatory corner

**New files:**
- `src/app/monday-brief/page.tsx` — page with Download PDF button
- `src/components/monday-brief/MondayBriefDocument.tsx` — 724-line print-optimized component
- `src/app/api/monday-brief/route.ts` — GET with auto-generate on first weekly visit
- `src/app/api/monday-brief/refresh/route.ts` — manual POST trigger
- `docs/plans/2026-03-15-monday-morning-brief.md` — design document

**Modified:**
- `src/lib/gemini.ts` — 12 new types + `generateMondayBrief()` with detailed Gemini prompt
- `src/components/ui/Header.tsx` — added nav link
- `src/app/globals.css` — print CSS for 3-page layout
- `scripts/refresh-news.mjs` — Monday brief generation (runs only on Mondays)

**Database:** New `mfd_monday_briefs` table (week_of DATE PK, brief_data JSONB)

**VPS Cron:** Added `30 23 * * 0` (Monday 5:00 AM IST) — pre-generates the brief before distributors wake up

**Commits:** `f94d058`, plus follow-up for VPS script

---
*Last reviewed: 2026-03-15*
