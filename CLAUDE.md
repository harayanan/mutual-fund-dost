# CLAUDE.md - mutual-fund-dost

## Project Purpose

AI-powered HDFC mutual fund advisory platform for distributors and investors. Provides SEBI-compliant fund recommendations, risk profiling, fund screening, AI-driven news analysis, and daily distributor briefs.

**Version**: 0.2.0 | **Started**: January 2026 | **Status**: Actively maintained

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router), React 19.2.3, TypeScript 5
- **Styling**: Tailwind CSS 4, Lucide icons
- **Database**: Supabase (PostgreSQL) via @supabase/supabase-js
- **AI**: Google Gemini 2.0 Flash via @google/generative-ai
- **Data**: RSS feeds via rss-parser for news aggregation
- **Deployment**: Vercel (serverless)

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── cron/          # 3 Vercel cron jobs (fund refresh, news, daily brief)
│   │   ├── daily-brief/   # Distributor daily brief API
│   │   ├── funds/         # Fund data endpoints
│   │   ├── metadata/      # Data metadata
│   │   ├── news/          # News cache endpoints
│   │   └── recommend/     # AI recommendation engine
│   └── (pages)            # UI pages
├── components/            # React components
├── data/
│   └── hdfc-funds.ts      # 60 HDFC mutual fund schemes (static seed data)
└── lib/
    ├── advisor-engine.ts      # Risk profiling (6 levels), fund scoring
    ├── gemini.ts              # Gemini AI client and prompt templates
    ├── fund-data-fetcher.ts   # Fund NAV/performance data fetcher
    ├── fund-manager-scraper.ts# Fund manager info scraper
    ├── news-fetcher.ts        # RSS news aggregation
    ├── recommendation/        # Recommendation sub-modules
    └── supabase.ts            # Supabase client
```

## Key Files

- `src/lib/advisor-engine.ts` — Core risk profiling (6 levels: Conservative to Very Aggressive) and fund recommendation scoring
- `src/lib/gemini.ts` — Gemini AI integration for news analysis and recommendations
- `src/lib/fund-data-fetcher.ts` — Fetches fund NAV and performance data
- `src/data/hdfc-funds.ts` — Static dataset of 60 HDFC mutual fund schemes

## Cron Jobs (Vercel)

| Job | Schedule | Purpose |
|-----|----------|---------|
| refresh-funds | 7:30 PM IST daily | Update fund NAVs and performance |
| refresh-news | 1:00 AM IST daily | Fetch and analyze RSS news |
| refresh-daily-brief | 2:00 AM IST daily | Generate distributor daily brief |

## Features

- SEBI-compliant risk profiler with 6 risk levels
- Fund screener across 60 HDFC schemes
- AI-powered fund recommendations and comparison
- Daily distributor brief with market insights
- RSS news aggregation with AI analysis

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CRON_SECRET` | Secret for authenticating cron job requests |

## Development

```bash
npm install && npm run dev    # Dev server on localhost:3000
npm run build                 # Production build
npm run lint                  # ESLint
```

`@/*` resolves to `./src/*`
