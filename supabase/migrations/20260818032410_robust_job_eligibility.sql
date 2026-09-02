-- Persist crawler eligibility so the public feed does not rely on stale rows.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS accepts_brazil boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eligibility_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS eligibility_reason text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_eligibility_status_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_eligibility_status_check
  CHECK (eligibility_status IN ('pending', 'eligible', 'rejected', 'stale'));

CREATE INDEX IF NOT EXISTS jobs_feed_eligibility_idx
  ON public.jobs (eligibility_status, url_status, created_at DESC);

COMMENT ON COLUMN public.jobs.eligibility_status IS
  'Crawler market/title decision: pending, eligible, rejected, or stale.';;
