# Changelog

All notable changes to Mutual Fund Dost are documented in this file.

## [2026-01-27] — Brand Obfuscation

- Replaced HDFC branding with "XYZ" across all UI and marketing text
- Preserved actual fund names in data, screener details, and recommendations
- Updated SEO metadata and AI prompt instructions accordingly

**Files affected:** Homepage, header, footer, fund screener, discover page, news page, comparison modal, news cards, Gemini prompts

## [2026-01-26] — News Caching, Rich Insights & Discovery Polish

### News System Overhaul
- Switched `/api/news` to serve exclusively from Supabase cache — eliminated per-request Gemini API calls
- Added relevance scoring (1–10) via Gemini; low-value articles are filtered out
- Gemini now produces 4–5 sentence insights with concrete investor actions
- Cron fetches 20 items, filters to quality-only before storing
- Server-side pagination (`page`/`limit` params) and category filtering
- NewsFeed UI shows pagination controls with article counts
- NewsCard highlights "Why This Matters" section with distinct investor action callout

### Fund Discovery & Screener Enhancements
- Fixed risk slider not updating recommendations (key-based remount)
- Made riskometer SVG segments clickable
- Added personalized profile summary for each SEBI risk level
- Added share link (URL params + native share) and PDF export
- Multi-category chip filter in Fund Screener
- Renamed category column to "Sub-category", added Direct Plans badge
- localStorage persistence for risk profile
- Print-optimized CSS for clean PDF output
- Added Fund Screener button to home page

### Data Pipeline
- Added daily fund manager scraping from hdfcfund.com
- Integrated scraper into existing cron job; managers served from Supabase
- Updated fund managers from official HDFC AMC data

### Documentation
- Added comprehensive README with architecture, schema, and API docs

### Verification
- Verified Vercel GitHub integration after repo was set to private

## [2026-01-26] — Initial Release

Mutual Fund Dost launched as an AI-powered HDFC mutual fund advisory platform.

### Features
- **News Insights** — RSS-fed financial news with Google Gemini AI analysis
- **Discover Funds** — SEBI-aligned 6-question risk profiler with personalized fund basket recommendations (Core + Satellite approach)
- **Fund Screener** — Sortable, filterable table for all 60 HDFC schemes with side-by-side comparison (up to 5 funds)
- **Automated Data Refresh** — Vercel Cron jobs pulling NAV from AMFI, returns from mfapi.in
- **Supabase Backend** — PostgreSQL database for fund data, performance history, news cache, and sync metadata
- **Last Updated timestamps** across the UI

### Tech Stack
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4, Lucide icons
- Supabase (PostgreSQL with RLS)
- Google Gemini API
- Deployed on Vercel

### Initial Commit
- Scaffolded from Create Next App
