-- Add tracking email to pipeline entries for per-job email aliases
ALTER TABLE user_pipeline_entries ADD COLUMN IF NOT EXISTS tracking_email text UNIQUE;

-- Inbound emails received on tracking addresses
CREATE TABLE IF NOT EXISTS inbound_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES user_pipeline_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  body_html text,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inbound_emails_owner" ON inbound_emails
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- INSERT via service role only (webhook uses service role key)

-- Index for fast lookup by tracking_email
CREATE INDEX IF NOT EXISTS idx_pipeline_tracking_email ON user_pipeline_entries(tracking_email);
