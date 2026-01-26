# Mutual Fund Dost

Your trusted guide for HDFC Mutual Fund investments. Mutual Fund Dost is an AI-powered advisory platform that provides personalized fund recommendations based on your SEBI risk profile, a fund screener for all 60 HDFC schemes, and real-time financial news with AI-generated impact analysis.

**Live**: Deployed on Vercel with automated daily data refresh.

---

## Features

### Fund Discovery (`/discover`)
- **SEBI Risk Profiler** — 6-question questionnaire that maps your answers to one of the 6 SEBI-defined risk levels (Low, Low to Moderate, Moderate, Moderately High, High, Very High)
- **Personalized Fund Baskets** — Core + Satellite portfolio construction with 6-8 funds per basket, each with allocation percentages and rationale
- **Interactive Riskometer** — Visual semicircle gauge with a slider to explore recommendations across risk levels
- **Shareable Links** — Share your basket via URL (`/discover?risk=High`) or native share on mobile
- **Export to PDF** — Browser-native print-to-PDF with clean layout (hides navigation and interactive controls)
- **Profile Persistence** — Risk profile saved in localStorage; "Refresh Profile" to retake the quiz

### Fund Screener (`/funds`)
- **All 60 HDFC Schemes** — Equity, Debt, Hybrid, Solution, Index, and Fund-of-Funds
- **Multi-Category Filtering** — Chip-based category selector (select multiple categories)
- **Risk Level Filtering** — Filter by SEBI risk level
- **Text Search** — Search by fund name
- **Sortable Columns** — Sort by any metric (returns, AUM, expense ratio)
- **Fund Comparison** — Select and compare up to 5 funds side-by-side
- **Direct Plans Only** — All data is for Direct Growth plans

### News & Insights (`/news`)
- **AI-Analyzed News** — Financial news parsed from RSS feeds (Economic Times, Moneycontrol, Livemint)
- **Impact Assessment** — Each article analyzed by Google Gemini for market impact (positive/negative/neutral) and significance (high/medium/low)
- **Affected Funds** — AI identifies which HDFC funds are impacted by each news item
- **Investor Action** — Actionable advice for each news article
- **4-Hour Cache** — Fresh news with intelligent caching

### Automated Data Pipeline
- **Daily NAV Refresh** — Fund NAVs and CAGR returns fetched from AMFI + mfapi.in
- **Fund Manager Scraping** — Manager names scraped daily from hdfcfund.com's official portal
- **Supabase Persistence** — All data stored in PostgreSQL via Supabase with fallback to static data

---

## Architecture

```
                     +-----------------------+
                     |    Vercel (Hosting)    |
                     |   Next.js 16 + React 19|
                     +-----------+-----------+
                                 |
            +--------------------+--------------------+
            |                    |                    |
     Static Pages           API Routes          Cron Jobs
     (SSG at build)      (Server Functions)    (Scheduled)
            |                    |                    |
    /         /discover    /api/funds          /api/cron/refresh-funds
    /funds    /news        /api/news           /api/cron/refresh-news
                           /api/recommend
                           /api/metadata
                                 |
            +--------------------+--------------------+
            |                    |                    |
       Supabase             External APIs         Gemini AI
    (PostgreSQL DB)                                (News Analysis)
            |                    |
    - funds              - AMFI (NAV data)
    - fund_performance   - mfapi.in (CAGR returns)
    - news_cache         - hdfcfund.com (fund managers)
    - data_metadata      - RSS feeds (financial news)
```

### Data Flow

1. **Cron Job (Daily 7:30 PM IST)** — `refresh-funds`
   - Fetches latest NAV from AMFI's official text file
   - Fetches 1Y/3Y/5Y/10Y CAGR returns from mfapi.in
   - Scrapes fund manager names from hdfcfund.com (parsing `__NEXT_DATA__` JSON from each fund page)
   - Upserts all data to Supabase `funds` and `fund_performance` tables
   - Updates `data_metadata` with sync status

2. **Cron Job (Daily 1:00 AM IST)** — `refresh-news`
   - Parses RSS feeds from major Indian financial news sources
   - Sends each article to Google Gemini for analysis (impact, significance, affected funds, investor action)
   - Caches results in Supabase `news_cache` table (4-hour TTL)

3. **API Endpoints** — Serve data to the frontend
   - `/api/funds` merges static fund definitions with Supabase data (NAV, returns, managers)
   - `/api/news` serves cached AI-analyzed news
   - `/api/recommend` generates fund baskets server-side
   - All endpoints gracefully fall back to static data if Supabase is unavailable

---

## Fund Discovery Logic

The recommendation engine (`src/lib/advisor-engine.ts`) uses a structured approach:

### Risk Assessment
- **6-Question Questionnaire**: Age, investment horizon, income stability, loss tolerance, investment goal, experience
- **Score Mapping**: Total score (6-30) maps to one of 6 SEBI risk levels
- **Direct Selection**: Users can also directly pick a risk level via the riskometer slider

### Portfolio Construction (Core + Satellite)
Each risk level gets a different asset allocation and fund selection:

| Risk Level | Equity | Debt | Hybrid | Approach |
|------------|--------|------|--------|----------|
| Low | 0% | 85% | 15% | Capital preservation — liquid, low-duration, corporate bonds |
| Low to Moderate | 15% | 65% | 20% | Debt-heavy with minimal equity exposure |
| Moderate | 35% | 40% | 25% | Balanced — dynamic allocation fund at the core |
| Moderately High | 55% | 25% | 20% | Growth-oriented with debt cushion |
| High | 75% | 10% | 15% | Aggressive equity with tactical debt |
| Very High | 90% | 5% | 5% | Maximum equity — flexi, mid, small cap heavy |

### Fund Selection Principles
1. **Diversification** — Spread across fund categories (large/mid/small cap, sectors, debt types)
2. **Core + Satellite** — ~70% in diversified core funds, ~30% in focused/thematic satellites
3. **Track Record** — Preference for funds with 5+ year history
4. **Cost Efficiency** — Expense ratios considered in selection
5. **Each fund has a rationale** — Clear explanation of why it's included and its role

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.4 (App Router, Turbopack) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini API |
| Data Sources | AMFI, mfapi.in, hdfcfund.com, RSS feeds |
| Deployment | Vercel (with cron jobs) |
| Icons | Lucide React |
| RSS Parsing | rss-parser |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/
│   │   ├── cron/
│   │   │   ├── refresh-funds/    # Daily fund data + manager refresh
│   │   │   └── refresh-news/     # Daily news fetch + AI analysis
│   │   ├── funds/                # GET /api/funds — fund data with filters
│   │   ├── metadata/             # GET /api/metadata — sync status
│   │   ├── news/                 # GET /api/news — AI-analyzed news
│   │   └── recommend/            # POST /api/recommend — fund baskets
│   ├── discover/                 # Risk profiler + recommendations page
│   ├── funds/                    # Fund screener page
│   ├── news/                     # News feed page
│   ├── layout.tsx                # Root layout (header, footer, disclaimer)
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles + print CSS
│
├── components/
│   ├── discover/
│   │   ├── FundAllocation.tsx    # Donut chart for portfolio allocation
│   │   ├── FundBasket.tsx        # Full basket display (summary, cards, wisdom)
│   │   ├── RiskProfiler.tsx      # 6-question SEBI questionnaire
│   │   └── RiskSliderControl.tsx # Interactive riskometer + slider
│   ├── funds/
│   │   ├── FundComparison.tsx    # Side-by-side fund comparison modal
│   │   └── FundScreener.tsx      # Filterable, sortable fund table
│   ├── news/
│   │   └── NewsFeed.tsx          # News cards with AI analysis display
│   └── ui/
│       ├── DisclaimerBanner.tsx   # Top-of-page regulatory disclaimer
│       ├── Footer.tsx             # Site footer
│       ├── FundCard.tsx           # Individual fund detail card
│       ├── Header.tsx             # Navigation header
│       └── NewsCard.tsx           # Individual news article card
│
├── data/
│   └── hdfc-funds.ts             # Static data for 60 HDFC schemes (fallback)
│
└── lib/
    ├── advisor-engine.ts         # Risk levels, questionnaire, recommendation logic
    ├── fund-data-fetcher.ts      # AMFI NAV + mfapi.in CAGR fetcher
    ├── fund-manager-scraper.ts   # hdfcfund.com manager scraper
    ├── gemini.ts                 # Google Gemini API client
    ├── news-fetcher.ts           # RSS feed parser + news aggregator
    └── supabase.ts               # Supabase client initialization
```

---

## Database Schema (Supabase)

### `funds` table
Primary fund data. Updated daily by the cron job.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Unique ID (e.g., `hdfc-flexi-cap`) |
| `name` | TEXT | Full fund name |
| `slug` | TEXT UNIQUE | URL slug for hdfcfund.com |
| `category` | TEXT | `equity` / `debt` / `hybrid` / `solution` / `index` / `fof` |
| `sub_category` | TEXT | e.g., "Large Cap", "Liquid", "Balanced Advantage" |
| `risk_level` | TEXT | SEBI risk level |
| `aum_crores` | NUMERIC | Assets Under Management (in crores) |
| `expense_ratio` | NUMERIC | Annual expense ratio (%) |
| `fund_manager` | TEXT | Primary fund manager (scraped from hdfcfund.com) |
| `nav` | NUMERIC | Latest Net Asset Value |
| `nav_date` | DATE | Date of last NAV update |
| `amfi_scheme_code` | INTEGER | AMFI scheme code for data fetching |

### `fund_performance` table
Return data per fund per date.

| Column | Type | Description |
|--------|------|-------------|
| `fund_id` | TEXT FK | References `funds.id` |
| `return_1y` | NUMERIC | 1-year CAGR (%) |
| `return_3y` | NUMERIC | 3-year CAGR (%) |
| `return_5y` | NUMERIC | 5-year CAGR (%) |
| `return_since_inception` | NUMERIC | Since-inception return (%) |
| `as_of_date` | DATE | Date of the return data |

### `news_cache` table
AI-analyzed financial news articles.

| Column | Type | Description |
|--------|------|-------------|
| `title` | TEXT | Article headline |
| `source` | TEXT | Publication name |
| `url` | TEXT | Link to full article |
| `ai_analysis` | TEXT | Gemini analysis summary |
| `impact` | TEXT | `positive` / `negative` / `neutral` |
| `significance` | TEXT | `high` / `medium` / `low` |
| `impacted_funds` | JSONB | Array of affected fund IDs |
| `investor_action` | TEXT | Recommended action for investors |

### `data_metadata` table
Tracks cron job sync status.

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT PK | `fund_data` or `news_data` |
| `last_updated` | TIMESTAMPTZ | Last successful sync time |
| `status` | TEXT | `success` / `partial` / `error` |
| `details` | JSONB | Sync stats (funds updated, errors, duration) |

---

## API Reference

### `GET /api/funds`
Returns all HDFC fund data with optional filters.

**Query Parameters:**
- `category` — Filter by fund category (equity, debt, hybrid, etc.)
- `riskLevel` — Filter by SEBI risk level
- `search` — Text search on fund name

**Response:** Array of fund objects with NAV, returns, AUM, manager, etc.

### `GET /api/news`
Returns latest AI-analyzed financial news.

**Response:** Array of news articles with AI analysis, impact score, affected funds.

### `POST /api/recommend`
Generates a personalized fund basket.

**Body:**
```json
{ "riskLevel": "High" }
// or
{ "answers": [5, 4, 3, 4, 5, 3] }  // questionnaire scores
```

**Response:** Fund basket with allocation, rationale, and wisdom note.

### `GET /api/metadata`
Returns data sync status and timestamps.

### `GET /api/cron/refresh-funds`
**Requires:** `Authorization: Bearer {CRON_SECRET}`

Triggers fund data refresh (NAV, returns, managers). Called automatically by Vercel cron.

### `GET /api/cron/refresh-news`
**Requires:** `Authorization: Bearer {CRON_SECRET}`

Triggers news fetch and AI analysis. Called automatically by Vercel cron.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
CRON_SECRET=your_cron_secret
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

### Trigger Data Refresh Locally

```bash
# Refresh fund data
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/refresh-funds

# Refresh news
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/refresh-news
```

---

## Deployment

Deployed on **Vercel** with automatic cron jobs:

| Cron Job | Schedule | Purpose |
|----------|----------|---------|
| `refresh-funds` | 7:30 PM IST daily | NAV, returns, fund managers |
| `refresh-news` | 1:00 AM IST daily | Financial news + AI analysis |

The `vercel.json` file configures the cron schedule. Cron endpoints are secured with a `CRON_SECRET` bearer token.

---

## Data Sources

| Source | Data | Method |
|--------|------|--------|
| [AMFI](https://www.amfiindia.com) | NAV data | Text file download |
| [mfapi.in](https://www.mfapi.in) | Historical returns (CAGR) | REST API |
| [hdfcfund.com](https://www.hdfcfund.com) | Fund manager names | HTML scraping (`__NEXT_DATA__` JSON) |
| Economic Times, Moneycontrol, Livemint | Financial news | RSS feeds |
| Google Gemini | News impact analysis | Generative AI API |

---

## Disclaimer

This is an educational platform. Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance is not indicative of future returns. This platform does not constitute investment advice. Please consult a SEBI-registered investment advisor before making investment decisions.
