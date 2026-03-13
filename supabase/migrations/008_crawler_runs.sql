CREATE TABLE IF NOT EXISTS crawler_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'firecrawl',
  discovery_source text NOT NULL CHECK (discovery_source IN ('firecrawl', 'legacy')),
  scraped_count integer NOT NULL DEFAULT 0,
  inserted_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  enriched_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  leaders_backfilled integer NOT NULL DEFAULT 0,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crawler_runs_completed_at_idx
  ON crawler_runs (completed_at DESC);

ALTER TABLE crawler_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crawler_runs_read_authenticated" ON crawler_runs
  FOR SELECT TO authenticated
  USING (true);
