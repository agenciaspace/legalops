-- Free/public Bench discovery with private registration data.

CREATE TABLE IF NOT EXISTS public.bench_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 3000),
  category text NOT NULL DEFAULT 'geral',
  region_id uuid REFERENCES public.community_regions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'forming'
    CHECK (status IN ('forming', 'scheduled', 'completed', 'archived')),
  is_public boolean NOT NULL DEFAULT true,
  interest_count integer NOT NULL DEFAULT 0 CHECK (interest_count >= 0),
  min_participants integer NOT NULL DEFAULT 5 CHECK (min_participants > 0),
  ideal_participants integer NOT NULL DEFAULT 12 CHECK (ideal_participants > 0),
  summary text,
  key_findings text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ideal_participants >= min_participants)
);

CREATE INDEX IF NOT EXISTS bench_topics_public_idx
  ON public.bench_topics (is_public, status, interest_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS bench_topics_region_idx
  ON public.bench_topics (region_id, status);

ALTER TABLE public.bench_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bench_topics_public_read ON public.bench_topics;
CREATE POLICY bench_topics_public_read
  ON public.bench_topics FOR SELECT TO anon, authenticated
  USING (is_public = true AND status <> 'archived');

REVOKE ALL ON public.bench_topics FROM anon, authenticated;
GRANT SELECT (id, slug, title, description, category, region_id, status, is_public,
  interest_count, min_participants, ideal_participants, summary, key_findings,
  created_at, updated_at)
  ON public.bench_topics TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.bench_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.bench_topics(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'completed', 'canceled')),
  is_public boolean NOT NULL DEFAULT true,
  google_event_id text,
  meeting_url text,
  calendar_sync_status text NOT NULL DEFAULT 'pending'
    CHECK (calendar_sync_status IN ('pending', 'synced', 'error', 'not_configured')),
  calendar_sync_error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS bench_sessions_topic_idx
  ON public.bench_sessions (topic_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS bench_sessions_public_idx
  ON public.bench_sessions (is_public, status, starts_at);

ALTER TABLE public.bench_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bench_sessions_public_read ON public.bench_sessions;
CREATE POLICY bench_sessions_public_read
  ON public.bench_sessions FOR SELECT TO anon, authenticated
  USING (is_public = true AND status IN ('scheduled', 'completed'));

REVOKE ALL ON public.bench_sessions FROM anon, authenticated;
GRANT SELECT (id, topic_id, starts_at, ends_at, timezone, capacity, status,
  is_public, calendar_sync_status, created_at, updated_at)
  ON public.bench_sessions TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.bench_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.bench_topics(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.bench_sessions(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  organization text,
  "current_role" text,
  status text NOT NULL DEFAULT 'interested'
    CHECK (status IN ('interested', 'registered', 'waitlist', 'canceled')),
  calendar_invited_at timestamptz,
  calendar_invite_status text NOT NULL DEFAULT 'pending'
    CHECK (calendar_invite_status IN ('pending', 'sent', 'error', 'not_required')),
  calendar_invite_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bench_registrations_topic_email_idx
  ON public.bench_registrations (topic_id, lower(email));
CREATE INDEX IF NOT EXISTS bench_registrations_session_idx
  ON public.bench_registrations (session_id, status, created_at);
CREATE INDEX IF NOT EXISTS bench_registrations_user_idx
  ON public.bench_registrations (user_id);

ALTER TABLE public.bench_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bench_registrations FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.bench_topic_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  context text NOT NULL DEFAULT '',
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  organization text,
  region_id uuid REFERENCES public.community_regions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bench_topic_suggestions_status_idx
  ON public.bench_topic_suggestions (status, created_at DESC);

ALTER TABLE public.bench_topic_suggestions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bench_topic_suggestions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_bench_interest_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_topic uuid;
  previous_topic uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    current_topic := OLD.topic_id;
  ELSE
    current_topic := NEW.topic_id;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    previous_topic := OLD.topic_id;
  END IF;

  UPDATE public.bench_topics topic
  SET interest_count = (
    SELECT count(*)::integer
    FROM public.bench_registrations registration
    WHERE registration.topic_id = current_topic
      AND registration.status <> 'canceled'
  ),
  updated_at = now()
  WHERE topic.id = current_topic;

  IF previous_topic IS NOT NULL AND previous_topic <> current_topic THEN
    UPDATE public.bench_topics topic
    SET interest_count = (
      SELECT count(*)::integer
      FROM public.bench_registrations registration
      WHERE registration.topic_id = previous_topic
        AND registration.status <> 'canceled'
    ),
    updated_at = now()
    WHERE topic.id = previous_topic;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_bench_interest_count() FROM PUBLIC;
DROP TRIGGER IF EXISTS bench_registrations_refresh_interest ON public.bench_registrations;
CREATE TRIGGER bench_registrations_refresh_interest
  AFTER INSERT OR UPDATE OF status, topic_id OR DELETE
  ON public.bench_registrations
  FOR EACH ROW EXECUTE FUNCTION public.refresh_bench_interest_count();
