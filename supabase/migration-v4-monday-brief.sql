-- Migration V4: Monday Brief table
-- The Monday Brief feature stores weekly AI-generated briefs for distributors.
-- The API routes (src/app/api/monday-brief/) already reference this table
-- but it was never created. This migration adds it.

-- ============ MONDAY BRIEFS TABLE ============
CREATE TABLE IF NOT EXISTS mfd_monday_briefs (
  week_of DATE PRIMARY KEY,
  brief_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ INDEX ============
CREATE INDEX IF NOT EXISTS idx_mfd_monday_briefs_generated_at ON mfd_monday_briefs(generated_at DESC);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE mfd_monday_briefs ENABLE ROW LEVEL SECURITY;

-- Monday Briefs: public read, service write
CREATE POLICY "Allow public read on mfd_monday_briefs" ON mfd_monday_briefs FOR SELECT USING (true);
CREATE POLICY "Allow insert on mfd_monday_briefs" ON mfd_monday_briefs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on mfd_monday_briefs" ON mfd_monday_briefs FOR UPDATE USING (true);

-- Seed metadata for Monday brief tracking
INSERT INTO mfd_data_metadata (key, last_updated, status, details)
VALUES ('monday_brief_data', NOW(), 'pending', '{"message": "Awaiting first refresh"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
