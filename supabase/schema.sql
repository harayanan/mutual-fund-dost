-- Mutual Fund Dost - Supabase Schema
-- Run this in the Supabase SQL editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ FUNDS TABLE ============
CREATE TABLE IF NOT EXISTS funds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('equity', 'debt', 'hybrid', 'solution', 'index')),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ FUND PERFORMANCE TABLE ============
CREATE TABLE IF NOT EXISTS fund_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS news_cache (
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

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_funds_category ON funds(category);
CREATE INDEX IF NOT EXISTS idx_funds_risk_level ON funds(risk_level);
CREATE INDEX IF NOT EXISTS idx_fund_performance_fund_id ON fund_performance(fund_id);
CREATE INDEX IF NOT EXISTS idx_news_cache_created_at ON news_cache(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_cache_category ON news_cache(category);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (stateless app)
CREATE POLICY "Allow public read on funds" ON funds FOR SELECT USING (true);
CREATE POLICY "Allow public read on fund_performance" ON fund_performance FOR SELECT USING (true);
CREATE POLICY "Allow public read on news_cache" ON news_cache FOR SELECT USING (true);

-- Allow insert/update for service role (API routes)
CREATE POLICY "Allow service insert on news_cache" ON news_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service insert on funds" ON funds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service insert on fund_performance" ON fund_performance FOR INSERT WITH CHECK (true);
