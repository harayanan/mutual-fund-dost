-- Mutual Fund Dost - Consolidated Schema Migration
-- Run this in the Supabase SQL editor to set up all tables
-- All tables prefixed with mfd_ to avoid conflicts with other projects
-- Combines: schema.sql + migration-v2.sql + migration-v3-daily-brief.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ FUNDS TABLE ============
CREATE TABLE IF NOT EXISTS mfd_funds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('equity', 'debt', 'hybrid', 'solution', 'index', 'fof')),
  sub_category TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  aum_crores NUMERIC,
  benchmark TEXT,
  expense_ratio NUMERIC,
  min_investment NUMERIC DEFAULT 100,
  inception_date DATE,
  fund_manager TEXT,
  investment_objective TEXT,
  suitable_for TEXT,
  min_horizon_months INTEGER,
  amfi_scheme_code INTEGER,
  nav NUMERIC,
  nav_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ FUND PERFORMANCE TABLE ============
CREATE TABLE IF NOT EXISTS mfd_fund_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id TEXT NOT NULL REFERENCES mfd_funds(id) ON DELETE CASCADE,
  return_1y NUMERIC,
  return_3y NUMERIC,
  return_5y NUMERIC,
  return_10y NUMERIC,
  return_since_inception NUMERIC,
  as_of_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fund_id, as_of_date)
);

-- ============ NEWS CACHE TABLE ============
CREATE TABLE IF NOT EXISTS mfd_news_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMPTZ,
  summary TEXT,
  ai_analysis TEXT,
  category TEXT,
  impact TEXT CHECK (impact IN ('positive', 'negative', 'neutral')),
  significance TEXT CHECK (significance IN ('high', 'medium', 'low')),
  impacted_funds JSONB DEFAULT '[]'::jsonb,
  investor_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ DATA METADATA TABLE ============
CREATE TABLE IF NOT EXISTS mfd_data_metadata (
  key TEXT PRIMARY KEY,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB DEFAULT '{}'::jsonb
);

-- ============ DAILY BRIEFS TABLE ============
CREATE TABLE IF NOT EXISTS mfd_daily_briefs (
  brief_date DATE PRIMARY KEY,
  top_stories JSONB DEFAULT '[]'::jsonb,
  conversation_starters JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  daily_wisdom TEXT DEFAULT '',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_mfd_funds_category ON mfd_funds(category);
CREATE INDEX IF NOT EXISTS idx_mfd_funds_risk_level ON mfd_funds(risk_level);
CREATE INDEX IF NOT EXISTS idx_mfd_fund_performance_fund_id ON mfd_fund_performance(fund_id);
CREATE INDEX IF NOT EXISTS idx_mfd_news_cache_created_at ON mfd_news_cache(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mfd_news_cache_category ON mfd_news_cache(category);
CREATE INDEX IF NOT EXISTS idx_mfd_daily_briefs_generated_at ON mfd_daily_briefs(generated_at DESC);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE mfd_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfd_fund_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfd_news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfd_data_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfd_daily_briefs ENABLE ROW LEVEL SECURITY;

-- Funds: public read, service write
CREATE POLICY "Allow public read on mfd_funds" ON mfd_funds FOR SELECT USING (true);
CREATE POLICY "Allow service insert on mfd_funds" ON mfd_funds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on mfd_funds" ON mfd_funds FOR UPDATE USING (true);

-- Fund Performance: public read, service write
CREATE POLICY "Allow public read on mfd_fund_performance" ON mfd_fund_performance FOR SELECT USING (true);
CREATE POLICY "Allow service insert on mfd_fund_performance" ON mfd_fund_performance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on mfd_fund_performance" ON mfd_fund_performance FOR UPDATE USING (true);

-- News Cache: public read, service insert
CREATE POLICY "Allow public read on mfd_news_cache" ON mfd_news_cache FOR SELECT USING (true);
CREATE POLICY "Allow insert on mfd_news_cache" ON mfd_news_cache FOR INSERT WITH CHECK (true);

-- Data Metadata: public read, service write
CREATE POLICY "Allow public read on mfd_data_metadata" ON mfd_data_metadata FOR SELECT USING (true);
CREATE POLICY "Allow insert on mfd_data_metadata" ON mfd_data_metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on mfd_data_metadata" ON mfd_data_metadata FOR UPDATE USING (true);

-- Daily Briefs: public read, service write
CREATE POLICY "Allow public read on mfd_daily_briefs" ON mfd_daily_briefs FOR SELECT USING (true);
CREATE POLICY "Allow insert on mfd_daily_briefs" ON mfd_daily_briefs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on mfd_daily_briefs" ON mfd_daily_briefs FOR UPDATE USING (true);

-- ============ SEED METADATA ============
INSERT INTO mfd_data_metadata (key, last_updated, status, details)
VALUES
  ('fund_data', NOW(), 'pending', '{"message": "Awaiting first refresh"}'::jsonb),
  ('news_data', NOW(), 'pending', '{"message": "Awaiting first refresh"}'::jsonb),
  ('daily_brief_data', NOW(), 'pending', '{"message": "Awaiting first refresh"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
