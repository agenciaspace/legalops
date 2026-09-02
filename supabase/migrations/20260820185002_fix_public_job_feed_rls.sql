-- Public jobs are publishable as soon as discovery and URL validation pass.
-- AI enrichment is optional and must not gate the public feed.
DROP POLICY IF EXISTS "jobs_read_anon" ON public.jobs;
DROP POLICY IF EXISTS "jobs_read_public" ON public.jobs;

CREATE POLICY "jobs_read_public" ON public.jobs
  FOR SELECT
  TO anon
  USING (
    url_status = 'live'
    AND eligibility_status = 'eligible'
  );;
