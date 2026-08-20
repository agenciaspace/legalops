ALTER TABLE public.account_profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;
