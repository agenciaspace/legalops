-- Migration: Marketplace tables for Four Fits product structure
-- Adds: public profiles, companies, job posts, candidate matching, subscriptions

-- 1. Extend account_profiles with public profile fields
ALTER TABLE account_profiles
  ADD COLUMN IF NOT EXISTS public_headline TEXT,
  ADD COLUMN IF NOT EXISTS public_bio TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tools_used TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_to_opportunities BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS desired_salary_min INTEGER,
  ADD COLUMN IF NOT EXISTS desired_salary_max INTEGER,
  ADD COLUMN IF NOT EXISTS desired_salary_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS preferred_remote TEXT CHECK (preferred_remote IN ('remote', 'hybrid', 'onsite', 'any')),
  ADD COLUMN IF NOT EXISTS preferred_locations TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_views INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Update tier check to support new plans
ALTER TABLE account_profiles DROP CONSTRAINT IF EXISTS account_profiles_tier_check;
ALTER TABLE account_profiles ADD CONSTRAINT account_profiles_tier_check
  CHECK (tier IN ('free', 'pro', 'expert'));

-- 2. Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  logo_url TEXT,
  description TEXT,
  size TEXT CHECK (size IN ('startup', 'smb', 'midmarket', 'enterprise')),
  industry TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Public read for active companies
CREATE POLICY "companies_public_read" ON companies
  FOR SELECT TO authenticated
  USING (true);

-- 3. Company accounts (link users to companies)
CREATE TABLE company_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'recruiter', 'viewer')) DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

ALTER TABLE company_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_accounts_owner_read" ON company_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "company_accounts_admin_manage" ON company_accounts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_accounts ca
      WHERE ca.company_id = company_accounts.company_id
        AND ca.user_id = auth.uid()
        AND ca.role = 'admin'
    )
  );

-- 4. Paid job posts (B2B)
CREATE TABLE job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  remote_type TEXT CHECK (remote_type IN ('remote', 'hybrid', 'onsite')),
  location TEXT,
  experience_min INTEGER,
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  tools_required TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'closed', 'expired')) DEFAULT 'draft',
  expires_at TIMESTAMPTZ,
  views INTEGER NOT NULL DEFAULT 0,
  applications INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;

-- Active job posts are publicly readable
CREATE POLICY "job_posts_public_read" ON job_posts
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Company members can manage their posts
CREATE POLICY "job_posts_company_manage" ON job_posts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_accounts ca
      WHERE ca.company_id = job_posts.company_id
        AND ca.user_id = auth.uid()
        AND ca.role IN ('admin', 'recruiter')
    )
  );

CREATE INDEX idx_job_posts_status ON job_posts(status);
CREATE INDEX idx_job_posts_company ON job_posts(company_id);
CREATE INDEX idx_job_posts_expires ON job_posts(expires_at) WHERE status = 'active';

-- 5. Candidate matches (AI-powered)
CREATE TABLE candidate_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2) NOT NULL DEFAULT 0, -- 0.00 to 100.00
  match_reasons JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('suggested', 'viewed', 'contacted', 'applied', 'rejected')) DEFAULT 'suggested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_post_id, candidate_id)
);

ALTER TABLE candidate_matches ENABLE ROW LEVEL SECURITY;

-- Candidates can see their own matches
CREATE POLICY "candidate_matches_candidate_read" ON candidate_matches
  FOR SELECT TO authenticated
  USING (candidate_id = auth.uid());

-- Company members can see matches for their posts
CREATE POLICY "candidate_matches_company_read" ON candidate_matches
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_posts jp
      JOIN company_accounts ca ON ca.company_id = jp.company_id
      WHERE jp.id = candidate_matches.job_post_id
        AND ca.user_id = auth.uid()
    )
  );

CREATE INDEX idx_candidate_matches_job ON candidate_matches(job_post_id, match_score DESC);
CREATE INDEX idx_candidate_matches_candidate ON candidate_matches(candidate_id);

-- 6. Subscriptions (billing)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'expert', 'job_post', 'talent_access', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')) DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR company_id IS NOT NULL)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_owner_read" ON subscriptions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM company_accounts ca
      WHERE ca.company_id = subscriptions.company_id
        AND ca.user_id = auth.uid()
    )
  );

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id) WHERE company_id IS NOT NULL;

-- 7. Public profile read policy (for professionals directory)
CREATE POLICY "account_profiles_public_read" ON account_profiles
  FOR SELECT TO authenticated
  USING (is_public = true OR user_id = auth.uid());
