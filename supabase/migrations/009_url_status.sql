-- Track whether a job's source URL is still reachable
ALTER TABLE jobs ADD COLUMN url_status text NOT NULL DEFAULT 'live';
ALTER TABLE jobs ADD COLUMN url_checked_at timestamptz;
