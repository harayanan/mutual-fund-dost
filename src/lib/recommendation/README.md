# Personalized Recommendation Engine

## Architecture

```
answers ──► investor-profile ──► allocation-strategy ──► fund-scorer ──► basket-builder ──► result
              (Step 1)              (Step 2)              (Step 3)         (Step 4)
```

## Modules

### `types.ts`
Shared TypeScript types used across all modules.

### `investor-profile.ts`
Converts raw questionnaire answers (score-based) into a rich `InvestorProfile` with structured dimensions: age group, horizon, income stability, loss tolerance, goal, experience, plus derived signals like `needsTaxSaving` and `needsLiquidity`.

### `allocation-strategy.ts`
Takes an `InvestorProfile` and produces target allocation percentages (`equity`, `debt`, `hybrid`, `liquid`) plus allocation hints that guide fund scoring. Base allocations come from the risk level, then profile-specific adjustments shift percentages (e.g., short horizon shifts equity to debt).

### `fund-scorer.ts`
Scores every HDFC fund against the investor profile using weighted criteria:
- **Category fit** (30%): Does the fund belong to the target allocation bucket?
- **Risk alignment** (20%): Fund risk level vs. investor risk level
- **Track record** (20%): Weighted average of 1Y/3Y/5Y/10Y returns, favoring longer periods
- **Cost efficiency** (15%): Lower expense ratio scores higher
- **Goal alignment** (15%): Bonuses for ELSS (tax saving), dividend yield (income), liquid funds (liquidity), index funds (beginners), small-cap (aggressive growth)

### `basket-builder.ts`
Selects top-scored funds per allocation bucket with constraints:
- Max 1 fund per sub-category (diversification)
- 5 funds for simple profiles, up to 8 for complex
- Core/satellite split (~65/35)
- Minimum 5% allocation per fund
- Assigns role labels and generates rationale strings

### `index.ts`
Public API entry point. Calls steps 1→2→3→4 in sequence. Falls back to the legacy `recommendFundBasket()` if no answers are provided.

```ts
import { buildRecommendation } from '@/lib/recommendation';

const result = buildRecommendation(answers, optionalRiskLevelOverride);
```

## Extending

- **New scoring factor**: Add a scoring function in `fund-scorer.ts`, adjust weights to sum to 1.0
- **New fund category**: Update `categorizeFund()` in `fund-scorer.ts` and bucket handling in `basket-builder.ts`
- **New profile dimension**: Add to `InvestorProfile` in `types.ts`, map from answers in `investor-profile.ts`, use in allocation/scoring
