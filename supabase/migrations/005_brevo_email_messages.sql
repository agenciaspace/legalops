INSERT INTO email_domains (
  domain,
  label,
  is_active,
  allow_random,
  allow_custom
)
VALUES (
  'reply.legalops.work',
  'Brevo reply aliases',
  true,
  true,
  true
)
ON CONFLICT (domain) DO UPDATE
SET
  label = EXCLUDED.label,
  is_active = true,
  allow_random = true,
  allow_custom = true,
  updated_at = now();

UPDATE email_domains
SET
  is_active = false,
  updated_at = now()
WHERE domain = 'mail.legalops.test';

CREATE TABLE IF NOT EXISTS email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias_id uuid NOT NULL REFERENCES user_email_aliases(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'brevo',
  provider_message_id text,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status text NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'received')),
  from_name text,
  from_address text NOT NULL,
  reply_to_address text,
  to_addresses text[] NOT NULL DEFAULT ARRAY[]::text[],
  cc_addresses text[] NOT NULL DEFAULT ARRAY[]::text[],
  bcc_addresses text[] NOT NULL DEFAULT ARRAY[]::text[],
  subject text,
  text_body text,
  html_body text,
  error_message text,
  headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER email_messages_set_updated_at
  BEFORE UPDATE ON email_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

CREATE INDEX email_messages_user_created_idx
  ON email_messages (user_id, created_at DESC);

CREATE INDEX email_messages_alias_created_idx
  ON email_messages (alias_id, created_at DESC);

CREATE UNIQUE INDEX email_messages_provider_unique_idx
  ON email_messages (alias_id, provider, direction, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_messages_owner_read" ON email_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "email_messages_owner_insert" ON email_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "email_messages_owner_update" ON email_messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
