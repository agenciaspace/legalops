-- Dynamic slug discovery: stores company slugs found organically via Firecrawl/aggregators
-- so the legacy board scraper can query them directly in future cron runs.
CREATE TABLE IF NOT EXISTS discovered_board_slugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board text NOT NULL,          -- 'lever', 'greenhouse', 'workable', 'gupy'
  slug text NOT NULL,
  discovered_from text,         -- URL where slug was first seen
  created_at timestamptz DEFAULT now(),
  UNIQUE (board, slug)
);
