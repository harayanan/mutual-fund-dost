#!/bin/bash
# Refresh news and daily brief data by calling the local Next.js-compatible Node script.
# Runs from VPS where Indian RSS feeds are accessible (Vercel IPs are geo-blocked).
# Triggered by cron: twice daily at 6:30 AM and 6:30 PM IST.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/mfd-news-refresh.log"

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Starting MFD news refresh" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# Load env vars
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Run the Node.js refresh script
node scripts/refresh-news.mjs >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Finished with exit code $EXIT_CODE" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

# Keep log file from growing forever
tail -200 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"

exit $EXIT_CODE
