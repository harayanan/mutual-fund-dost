-- Migration V3: Add daily_briefs table for distributor daily brief feature
-- Run this in the Supabase SQL editor

-- ============ DAILY BRIEFS TABLE ============
CREATE TABLE IF NOT EXISTS daily_briefs (
  brief_date DATE PRIMARY KEY,
  top_stories JSONB DEFAULT '[]'::jsonb,
  conversation_starters JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  daily_wisdom TEXT DEFAULT '',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_daily_briefs_generated_at ON daily_briefs(generated_at DESC);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on daily_briefs" ON daily_briefs FOR SELECT USING (true);

-- Allow insert/update for service role (API routes)
CREATE POLICY "Allow insert on daily_briefs" ON daily_briefs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on daily_briefs" ON daily_briefs FOR UPDATE USING (true);

-- ============ SEED METADATA ============
INSERT INTO data_metadata (key, last_updated, status, details)
VALUES ('daily_brief_data', NOW(), 'pending', '{"message": "Awaiting first refresh"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
