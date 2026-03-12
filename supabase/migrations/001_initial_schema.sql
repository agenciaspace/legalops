-- Jobs table (system-wide, written by service role only)
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  url text NOT NULL UNIQUE,
  source_board text NOT NULL,
  salary_min integer,
  salary_max integer,
  salary_currency text,
  benefits text[] NOT NULL DEFAULT '{}',
  remote_label text,
  remote_reality text NOT NULL DEFAULT 'unknown',
  remote_notes text,
  enrichment_status text NOT NULL DEFAULT 'pending',
  enrichment_attempts integer NOT NULL DEFAULT 0,
  posted_at timestamptz,
  raw_description text NOT NULL DEFAULT '',
  suggested_leader_name text,
  suggested_leader_title text,
  suggested_leader_linkedin text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for jobs: authenticated users can read, service role writes
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_read_authenticated" ON jobs
  FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE policy — service role bypasses RLS

-- User pipeline entries
CREATE TABLE IF NOT EXISTS user_pipeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'researching',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE user_pipeline_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_owner" ON user_pipeline_entries
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Leaders
CREATE TABLE IF NOT EXISTS leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES user_pipeline_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  title text,
  linkedin_url text,
  confirmed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entry_id)
);

ALTER TABLE leaders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaders_owner" ON leaders
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Job notes (append-only)
CREATE TABLE IF NOT EXISTS job_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES user_pipeline_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_notes_owner_read" ON job_notes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "job_notes_owner_insert" ON job_notes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- No UPDATE or DELETE policy intentionally (append-only)
