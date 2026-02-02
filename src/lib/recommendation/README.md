# Personalized Recommendation Engine

> **Version:** 0.2.0 | **Last updated:** 2026-02-02

## Why This Exists

The original `advisor-engine.ts` collapsed all questionnaire answers into a single score, mapped that to a risk level, and returned a hardcoded fund list via a giant `switch` statement. Every person with the same risk level got the identical basket — a 28-year-old salaried beginner wanting tax savings received the same funds as a 50-year-old experienced investor seeking income.

The new engine preserves individual answer dimensions so that two people with the same risk level but different profiles get different, personalized baskets.

## Architecture

```
Questionnaire Answers
        │
        ▼
┌─────────────────────┐
│  1. Investor Profile │  Extract structured dimensions from raw scores
│  (investor-profile)  │  → age, horizon, goal, experience, derived signals
└────────┬────────────┘
         │
         ▼
┌─────────────────────────┐
│  2. Allocation Strategy  │  Base allocation from risk level + profile adjustments
│  (allocation-strategy)   │  → equity/debt/hybrid/liquid % + hints
└────────┬────────────────┘
         │
         ▼
┌─────────────────────┐
│  3. Fund Scoring     │  Score every HDFC fund against profile
│  (fund-scorer)       │  → ranked list with reasons
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  4. Basket Building  │  Select top funds with diversification constraints
│  (basket-builder)    │  → final picks with allocations & rationale
└────────┬────────────┘
         │
         ▼
   RecommendationResult
```

## How It Differs From the Old Engine

| Aspect | Old (`advisor-engine.ts`) | New (`recommendation/`) |
|---|---|---|
| Input | Single total score | Full answer map (age, horizon, goal, etc.) |
| Personalization | None — same risk level = same basket | Profile-aware — different dimensions produce different baskets |
| Fund selection | Hardcoded per risk level | Scored dynamically against all available funds |
| Allocation | Fixed per risk level | Base + adjustments for horizon, goal, income stability, age |
| Extensibility | Edit a switch case | Add a scoring function or profile dimension |

The old engine is preserved as a fallback. When no questionnaire answers are available (e.g. slider-only usage or shared URLs), `buildRecommendation({}, riskLevel)` delegates to the legacy `recommendFundBasket()`.

## Modules

### `types.ts`

Shared TypeScript types used across all modules:

- **`InvestorProfile`** — structured dimensions extracted from answers
- **`AllocationResult`** — target percentages + allocation hints
- **`ScoredFund`** — a fund with its score, bucket, and selection reasons
- **`FundPick`** — final selection with allocation %, role label, and rationale
- **`PersonalizationSignals`** — goal/horizon labels and tags shown in the UI
- **`RecommendationResult`** — complete output matching the `FundBasket` shape plus personalization

### `investor-profile.ts`

Converts raw questionnaire scores into a rich `InvestorProfile`. Each answer maps to a structured dimension:

| Question ID | Score range | Mapped dimension | Values |
|---|---|---|---|
| `age` | 1-5 | `ageGroup` | `retired`, `pre-retirement`, `mid`, `young` |
| `horizon` | 1-5 | `horizon` | `short`, `medium`, `long`, `very-long` |
| `income_stability` | 1-4 | `incomeStability` | `low`, `medium`, `high` |
| `loss_tolerance` | 1-5 | `lossTolerance` | `low`, `medium`, `high` |
| `goal` | 1-5 | `goal` | `preservation`, `income`, `growth`, `aggressive-growth` |
| `experience` | 1-5 | `experience` | `beginner`, `intermediate`, `advanced` |

**Derived signals** (computed, not directly from answers):
- **`needsTaxSaving`** — `true` when young + salaried (age score ≥ 5, income_stability ≥ 4)
- **`needsLiquidity`** — `true` when horizon is short OR income stability is low

### `allocation-strategy.ts`

Starts with base allocation percentages per risk level, then applies profile-driven adjustments:

**Base allocations:**

| Risk Level | Equity | Debt | Hybrid | Liquid |
|---|---|---|---|---|
| Low | 0% | 75% | 15% | 10% |
| Low to Moderate | 15% | 55% | 20% | 10% |
| Moderate | 35% | 35% | 25% | 5% |
| Moderately High | 55% | 20% | 20% | 5% |
| High | 75% | 10% | 15% | 0% |
| Very High | 90% | 5% | 5% | 0% |

**Adjustments applied in order:**

1. **Short horizon** → shift up to 10% from equity to debt
2. **Medium horizon** → shift up to 5% from equity to debt
3. **Goal = income** → shift 5% from equity to hybrid
4. **Goal = preservation** → cap equity at 20%, excess goes to debt
5. **Low income stability** → shift 5% from debt to liquid
6. **Pre-retirement / retired** → enforce minimum 25% debt floor

After adjustments, percentages are normalized to sum to 100%.

**Allocation hints** (booleans passed to the fund scorer):
- `allowSmallCap` — young + aggressive-growth, or Very High risk
- `preferIndex` — beginner experience
- `boostTaxSaver` — needsTaxSaving is true
- `needsLiquidity` — needsLiquidity is true
- `incomeOriented` — goal is income

### `fund-scorer.ts`

Scores every fund in `HDFC_FUNDS` against the investor profile. Each fund receives a weighted score from 0 to 1:

| Criterion | Weight | How it's calculated |
|---|---|---|
| **Category fit** | 30% | 1.0 if the fund's category matches the target bucket, 0.0 otherwise |
| **Risk alignment** | 20% | 1.0 for exact match, 0.7 for ±1 level, 0.3 for ±2, 0.0 beyond |
| **Track record** | 20% | Weighted average of returns (5Y×0.4, 3Y×0.3, 10Y×0.2, 1Y×0.1), normalized to 0-1 scale where 25%+ CAGR = 1.0. New funds with no data score 0.1 |
| **Cost efficiency** | 15% | `1.0 - (expenseRatio / 2.0)`, so 0% ER = 1.0, 2% ER = 0.0 |
| **Goal alignment** | 15% | Base 0.5, then bonuses/penalties based on hints |

**Goal alignment bonuses:**
- ELSS fund + `boostTaxSaver` → +0.5
- Dividend Yield / Conservative Hybrid / Equity Savings + `incomeOriented` → +0.4
- Liquid / Overnight / Ultra Short / Money Market + `needsLiquidity` → +0.4
- Index fund + `preferIndex` → +0.3
- Small Cap + `allowSmallCap` → +0.3

**Goal alignment penalties:**
- Small Cap when `allowSmallCap` is false → -0.5
- Sectoral/Thematic funds for non-advanced investors → -0.3

**Fund categorization** into buckets:
- Debt funds with sub-category Liquid / Overnight / Ultra Short Duration / Money Market → `liquid`
- Other debt → `debt`
- Hybrid → `hybrid`
- Everything else (equity, index, solution, FoF) → `equity`

### `basket-builder.ts`

Selects the final funds from the scored list with diversification constraints:

1. **Fund count**: 5 for simple profiles (beginner or preservation goal), up to 8 for complex
2. **Per-bucket allocation**: Funds are distributed proportionally across equity/debt/hybrid/liquid
3. **Diversification**: Maximum 1 fund per sub-category (e.g., only one Large Cap fund)
4. **Core/Satellite split**: ~65% of each bucket's funds are "core" (stable, diversified), ~35% are "satellite" (growth, thematic)
5. **Minimum allocation**: No fund gets less than 5%
6. **Normalization**: Allocations are adjusted so they sum to exactly 100%

Each selected fund gets:
- A **role label** (e.g., "Core - Diversified", "Satellite - High Growth", "Stability - Corporate Bond")
- A **rationale string** generated from the scoring reasons and fund characteristics

### `index.ts`

Public API entry point. Orchestrates the pipeline:

```ts
import { buildRecommendation } from '@/lib/recommendation';

// With full questionnaire answers (personalized)
const result = buildRecommendation(answers, optionalRiskLevelOverride);

// Without answers — falls back to legacy engine
const fallback = buildRecommendation({}, riskLevel);
```

Also generates:
- **Profile summary** — a paragraph explaining the basket in terms of the user's profile
- **Personalization signals** — goal label, horizon label, and tags for the UI badges
- **Wisdom note** — Warren Buffett quote matched to risk level (same as legacy)

## Frontend Integration

### `page.tsx` (Discover)
- Stores `answers` in state alongside `riskLevel`
- Passes answers to `buildRecommendation()` instead of `recommendFundBasket()`
- Persists answers in localStorage for page reload
- When using the slider (override), re-runs the engine with current answers + new risk level
- Share URL encodes risk level, goal, and horizon as query params

### `FundBasket.tsx`
- Detects personalization signals via `'personalization' in basket`
- Shows a "Personalized for you" badge section with tags like "Wealth Growth", "Horizon: 5-10 years", "Tax Saving Included"
- Accepts both `RecommendationResult` and legacy `FundBasket` types

### `RiskProfiler.tsx`
- Already passes `{ riskLevel, answers }` via `onComplete` callback (no changes needed)

### API Route (`/api/recommend`)
- Accepts `answers` object in POST body
- Backward compatible: if only `riskLevel` is provided, uses legacy path via empty answers

## Examples: How Different Profiles Produce Different Baskets

**Profile A: Young beginner wanting tax savings**
- Age: Under 25 (5), Horizon: 10+ years (5), Income: Salaried (4), Goal: Growth (3), Experience: Never invested (1)
- Risk level: High
- Engine: `needsTaxSaving=true`, `preferIndex=true`, `allowSmallCap=false`
- Result: ELSS gets boosted, index funds get boosted, no small-cap, beginner-friendly 5-fund basket

**Profile B: Experienced investor seeking aggressive growth**
- Age: 25-35 (4), Horizon: 10+ years (5), Income: Salaried (4), Goal: Maximize returns (5), Experience: Active 5+ years (5)
- Risk level: Very High
- Engine: `allowSmallCap=true`, `preferIndex=false`, `needsTaxSaving=true`
- Result: Small-cap included, actively managed funds preferred, 8-fund basket with satellite thematic picks

**Profile C: Pre-retirement income seeker**
- Age: 46-55 (2), Horizon: 3-5 years (3), Income: Business owner (3), Goal: Regular income (2), Experience: Some MFs (3)
- Risk level: Moderate
- Engine: `incomeOriented=true`, debt floor enforced, equity shifted to hybrid
- Result: Dividend yield and conservative hybrid boosted, more debt allocation, 6-fund basket

## Extending the Engine

- **New scoring factor**: Add a scoring function in `fund-scorer.ts`, adjust weights (must sum to 1.0)
- **New fund category**: Update `categorizeFund()` in `fund-scorer.ts` and `categorizePick()` in `basket-builder.ts`
- **New profile dimension**: Add to `InvestorProfile` in `types.ts`, map from answers in `investor-profile.ts`, use in allocation adjustments and/or scoring
- **New allocation hint**: Add to `AllocationHints` in `types.ts`, set in `allocation-strategy.ts`, consume in `fund-scorer.ts`

## Changelog

- **v0.2.0** (2026-02-02) — Initial modular engine replacing the monolithic switch-based approach
