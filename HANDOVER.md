# HANDOVER — mutual-fund-dost

> AI-powered HDFC mutual fund advisory platform for distributors and investors

## Status: PRODUCTION-READY

**Version:** 0.2.0 | **Started:** January 2026 | **Last Updated:** February 2026

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

- **Branch:** main (1 commit ahead of origin)
- **Uncommitted:** Minor .gitignore + package-lock changes
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

## Next Steps

1. Add unit tests (recommendation engine, CAGR calculations)
2. Error monitoring (Sentry)
3. Cache fund screener results on /api/funds
4. Support other fund families (Axis, ICICI, SBI)

---
*Last reviewed: 2026-02-10*
