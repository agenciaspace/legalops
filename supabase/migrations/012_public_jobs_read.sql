-- Allow anonymous (unauthenticated) users to read jobs on the public homepage
CREATE POLICY "jobs_read_public" ON jobs
  FOR SELECT TO anon USING (true);
