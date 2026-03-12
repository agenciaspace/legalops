-- User profiles: stores custom email alias and preferences
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_alias text UNIQUE, -- e.g. 'leon' => leon+tag@legalops.work
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_owner" ON user_profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add custom_email to pipeline entries (the personalized version alongside tracking_email)
ALTER TABLE user_pipeline_entries ADD COLUMN IF NOT EXISTS custom_email text;
