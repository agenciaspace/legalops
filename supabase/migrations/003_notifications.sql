-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Channels
  email_enabled boolean NOT NULL DEFAULT false,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT false,
  -- Contact info
  email_address text,
  whatsapp_number text, -- E.164 format: +5511999999999
  -- What to notify
  notify_new_jobs boolean NOT NULL DEFAULT true,
  notify_status_change boolean NOT NULL DEFAULT true,
  notify_interview_reminder boolean NOT NULL DEFAULT true,
  notify_follow_up_reminder boolean NOT NULL DEFAULT true,
  notify_weekly_summary boolean NOT NULL DEFAULT true,
  -- Quiet hours (UTC)
  quiet_start_hour int DEFAULT 22,
  quiet_end_hour int DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_owner" ON notification_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notification log
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL, -- 'email', 'whatsapp', 'push'
  event_type text NOT NULL,
  title text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log_owner" ON notification_log
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Push subscriptions (Web Push API)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_sub_owner" ON push_subscriptions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
