#!/bin/bash
# Deploy mutual-fund-dost to Vercel production.
# Must be run from project root. Passes env vars as --build-env
# because `vercel deploy` from CLI doesn't use dashboard env vars.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "Error: .env.local not found"
  exit 1
fi

source .env.local

vercel deploy --prod \
  --build-env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-env GEMINI_API_KEY="$GEMINI_API_KEY" \
  --build-env CRON_SECRET="$CRON_SECRET"
