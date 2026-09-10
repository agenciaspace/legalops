-- Distributed regional leadership for legalops.club.

CREATE TABLE IF NOT EXISTS public.community_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  country_code text NOT NULL DEFAULT 'BR',
  region_type text NOT NULL DEFAULT 'state'
    CHECK (region_type IN ('country', 'macroregion', 'state', 'city', 'metro')),
  macro_region text,
  state_code text,
  status text NOT NULL DEFAULT 'forming'
    CHECK (status IN ('forming', 'active', 'paused', 'archived')),
  description text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  whatsapp_url text,
  meeting_cadence text,
  is_public boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_regions_public_idx
  ON public.community_regions (is_public, status, sort_order, name);
CREATE INDEX IF NOT EXISTS community_regions_state_idx
  ON public.community_regions (country_code, state_code);

ALTER TABLE public.community_regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_regions_public_read ON public.community_regions;
CREATE POLICY community_regions_public_read
  ON public.community_regions FOR SELECT TO anon, authenticated
  USING (is_public = true AND status <> 'archived');

REVOKE ALL ON public.community_regions FROM anon, authenticated;
GRANT SELECT (id, slug, name, country_code, region_type, macro_region, state_code,
  status, description, timezone, whatsapp_url, meeting_cadence, is_public, sort_order,
  created_at, updated_at)
  ON public.community_regions TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.community_regional_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.community_regions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  title text,
  organization text,
  linkedin_url text,
  role text NOT NULL DEFAULT 'co_lead'
    CHECK (role IN ('lead', 'co_lead', 'organizer')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'declined')),
  motivation text,
  responsibilities text[] NOT NULL DEFAULT '{}',
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS community_regional_leaders_region_email_idx
  ON public.community_regional_leaders (region_id, lower(email));
CREATE INDEX IF NOT EXISTS community_regional_leaders_active_idx
  ON public.community_regional_leaders (region_id, status, role);
CREATE INDEX IF NOT EXISTS community_regional_leaders_user_idx
  ON public.community_regional_leaders (user_id);

ALTER TABLE public.community_regional_leaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_regional_leaders_public_read ON public.community_regional_leaders;
CREATE POLICY community_regional_leaders_public_read
  ON public.community_regional_leaders FOR SELECT TO anon, authenticated
  USING (status = 'active');

REVOKE ALL ON public.community_regional_leaders FROM anon, authenticated;
GRANT SELECT (id, region_id, display_name, title, organization, linkedin_url,
  role, status, responsibilities, approved_at, created_at, updated_at)
  ON public.community_regional_leaders TO anon, authenticated;
