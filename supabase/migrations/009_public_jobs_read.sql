-- Allow unauthenticated (anon) users to read enriched jobs.
-- This powers the landing page job listing preview.
CREATE POLICY "jobs_read_anon" ON jobs
  FOR SELECT TO anon USING (enrichment_status = 'done');
