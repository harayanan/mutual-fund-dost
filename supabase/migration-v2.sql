-- Migration V2: Add data_metadata table, update funds table
-- Run this in the Supabase SQL editor

-- ============ DATA METADATA TABLE ============
CREATE TABLE IF NOT EXISTS data_metadata (
  key TEXT PRIMARY KEY,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE data_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on data_metadata" ON data_metadata FOR SELECT USING (true);
CREATE POLICY "Allow insert on data_metadata" ON data_metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on data_metadata" ON data_metadata FOR UPDATE USING (true);

-- Seed initial metadata rows
INSERT INTO data_metadata (key, last_updated, status, details)
VALUES
  ('fund_data', NOW(), 'pending', '{"message": "Awaiting first refresh"}'::jsonb),
  ('news_data', NOW(), 'pending', '{"message": "Awaiting first refresh"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============ UPDATE FUNDS TABLE ============
-- Add fof to category check constraint
ALTER TABLE funds DROP CONSTRAINT IF EXISTS funds_category_check;
ALTER TABLE funds ADD CONSTRAINT funds_category_check CHECK (category IN ('equity', 'debt', 'hybrid', 'solution', 'index', 'fof'));

-- Add new columns
ALTER TABLE funds ADD COLUMN IF NOT EXISTS amfi_scheme_code INTEGER;
ALTER TABLE funds ADD COLUMN IF NOT EXISTS nav NUMERIC;
ALTER TABLE funds ADD COLUMN IF NOT EXISTS nav_date DATE;

-- Add upsert policy for funds
CREATE POLICY "Allow update on funds" ON funds FOR UPDATE USING (true);

-- Add upsert policy for fund_performance
CREATE POLICY "Allow update on fund_performance" ON fund_performance FOR UPDATE USING (true);
