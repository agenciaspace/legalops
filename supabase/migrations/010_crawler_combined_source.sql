ALTER TABLE crawler_runs
  DROP CONSTRAINT IF EXISTS crawler_runs_discovery_source_check;

ALTER TABLE crawler_runs
  ADD CONSTRAINT crawler_runs_discovery_source_check
  CHECK (discovery_source IN ('firecrawl', 'legacy', 'combined'));
