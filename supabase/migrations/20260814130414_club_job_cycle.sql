-- Connect crawler jobs to paid Club profiles and add the employer intake flow.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS url_status text NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS url_checked_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_url_status_check'
  ) THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_url_status_check
      CHECK (url_status IN ('live', 'dead', 'unknown'));
  END IF;
END;
$$;

ALTER TABLE public.crawler_runs
  DROP CONSTRAINT IF EXISTS crawler_runs_discovery_source_check;

ALTER TABLE public.crawler_runs
  ADD CONSTRAINT crawler_runs_discovery_source_check
  CHECK (discovery_source IN ('firecrawl', 'legacy', 'combined'));

ALTER TABLE public.account_profiles
  ADD COLUMN IF NOT EXISTS desired_roles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_remote text,
  ADD COLUMN IF NOT EXISTS job_alerts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cv_suggestions_enabled boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_profiles_preferred_remote_check'
  ) THEN
    ALTER TABLE public.account_profiles
      ADD CONSTRAINT account_profiles_preferred_remote_check
      CHECK (preferred_remote IS NULL OR preferred_remote IN ('remote', 'hybrid', 'onsite', 'any'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.club_job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score smallint NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  match_reasons text[] NOT NULL DEFAULT '{}',
  cv_suggestions text[] NOT NULL DEFAULT '{}',
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS club_job_alerts_user_created_idx
  ON public.club_job_alerts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS club_job_alerts_user_unread_idx
  ON public.club_job_alerts (user_id, created_at DESC)
  WHERE read_at IS NULL AND dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS club_job_alerts_job_idx
  ON public.club_job_alerts (job_id);

ALTER TABLE public.club_job_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_job_alerts_member_read ON public.club_job_alerts;
CREATE POLICY club_job_alerts_member_read
  ON public.club_job_alerts FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND private.has_active_club_access()
  );

REVOKE ALL ON public.club_job_alerts FROM anon, authenticated;
GRANT SELECT ON public.club_job_alerts TO authenticated;
GRANT ALL ON public.club_job_alerts TO service_role;

CREATE TABLE IF NOT EXISTS public.employer_job_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_type text NOT NULL CHECK (employer_type IN ('law_firm', 'legal_department')),
  organization_name text NOT NULL CHECK (char_length(organization_name) BETWEEN 2 AND 160),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  location text,
  work_model text NOT NULL CHECK (work_model IN ('remote', 'hybrid', 'onsite')),
  description text NOT NULL CHECK (char_length(description) BETWEEN 30 AND 10000),
  application_url text,
  contact_email text NOT NULL,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'reviewing', 'approved', 'rejected', 'published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employer_job_requests_user_created_idx
  ON public.employer_job_requests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS employer_job_requests_status_created_idx
  ON public.employer_job_requests (status, created_at DESC);

ALTER TABLE public.employer_job_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employer_job_requests_owner_read ON public.employer_job_requests;
CREATE POLICY employer_job_requests_owner_read
  ON public.employer_job_requests FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS employer_job_requests_owner_insert ON public.employer_job_requests;
CREATE POLICY employer_job_requests_owner_insert
  ON public.employer_job_requests FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'submitted');

REVOKE ALL ON public.employer_job_requests FROM anon, authenticated;
GRANT SELECT, INSERT ON public.employer_job_requests TO authenticated;
GRANT ALL ON public.employer_job_requests TO service_role;
