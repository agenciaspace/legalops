-- Company profiles (employers who pay to post jobs)
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  cnpj text,
  sector text,
  size text CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  website text,
  logo_url text,
  description text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
  plan_expires_at timestamptz,
  jobs_posted_count int NOT NULL DEFAULT 0,
  jobs_limit int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_profiles_owner" ON company_profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Company-posted jobs (paid listings, separate from crawled jobs)
CREATE TABLE IF NOT EXISTS company_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  remote_policy text NOT NULL DEFAULT 'unknown'
    CHECK (remote_policy IN ('fully_remote', 'remote_with_travel', 'hybrid', 'onsite', 'unknown')),
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'BRL',
  benefits text[] NOT NULL DEFAULT '{}',
  required_experience_years int,
  professional_type text
    CHECK (professional_type IN ('law_firm', 'legal_dept', 'public_sector', 'freelance', 'other')),
  areas_of_expertise text[] NOT NULL DEFAULT '{}',
  seniority text CHECK (seniority IN ('junior', 'mid', 'senior', 'lead', 'head')),
  contract_type text DEFAULT 'clt'
    CHECK (contract_type IN ('clt', 'pj', 'intern', 'temporary', 'freelance')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'paused', 'closed', 'expired')),
  featured boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  views_count int NOT NULL DEFAULT 0,
  applications_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE company_jobs ENABLE ROW LEVEL SECURITY;

-- Companies can manage their own jobs
CREATE POLICY "company_jobs_owner" ON company_jobs
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid()));

-- All authenticated users can read active company jobs (free for candidates)
CREATE POLICY "company_jobs_read_active" ON company_jobs
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Job-candidate matches (auto-generated)
CREATE TABLE IF NOT EXISTS job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_job_id uuid REFERENCES company_jobs(id) ON DELETE CASCADE,
  crawled_job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL DEFAULT 0,
  score_breakdown jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'viewed', 'interested', 'applied', 'dismissed')),
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_has_job CHECK (company_job_id IS NOT NULL OR crawled_job_id IS NOT NULL),
  UNIQUE(user_id, company_job_id),
  UNIQUE(user_id, crawled_job_id)
);

ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_matches_owner" ON job_matches
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Job applications from candidates to company jobs
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_job_id uuid NOT NULL REFERENCES company_jobs(id) ON DELETE CASCADE,
  match_id uuid REFERENCES job_matches(id),
  cover_letter text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired')),
  company_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_job_id)
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Candidates can manage their own applications
CREATE POLICY "job_applications_candidate" ON job_applications
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Companies can read applications for their jobs
CREATE POLICY "job_applications_company_read" ON job_applications
  FOR SELECT TO authenticated
  USING (company_job_id IN (
    SELECT cj.id FROM company_jobs cj
    JOIN company_profiles cp ON cp.id = cj.company_id
    WHERE cp.user_id = auth.uid()
  ));

-- Companies can update application status
CREATE POLICY "job_applications_company_update" ON job_applications
  FOR UPDATE TO authenticated
  USING (company_job_id IN (
    SELECT cj.id FROM company_jobs cj
    JOIN company_profiles cp ON cp.id = cj.company_id
    WHERE cp.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_jobs_status ON company_jobs(status);
CREATE INDEX IF NOT EXISTS idx_company_jobs_areas ON company_jobs USING gin(areas_of_expertise);
CREATE INDEX IF NOT EXISTS idx_company_jobs_company ON company_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_user ON job_matches(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_job_matches_status ON job_matches(user_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(company_job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
