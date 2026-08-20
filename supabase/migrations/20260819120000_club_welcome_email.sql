ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS club_welcome_email_sent_at timestamptz;