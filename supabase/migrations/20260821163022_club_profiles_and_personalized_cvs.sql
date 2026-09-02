-- Make the Club profile the source of truth for matching and create one CV per selected job.

ALTER TABLE public.account_profiles
  ADD COLUMN IF NOT EXISTS career_summary text,
  ADD COLUMN IF NOT EXISTS career_highlights text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS base_cv_text text,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

ALTER TABLE public.account_profiles
  DROP CONSTRAINT IF EXISTS account_profiles_career_summary_length_check,
  ADD CONSTRAINT account_profiles_career_summary_length_check
    CHECK (career_summary IS NULL OR char_length(career_summary) <= 3000),
  DROP CONSTRAINT IF EXISTS account_profiles_base_cv_text_length_check,
  ADD CONSTRAINT account_profiles_base_cv_text_length_check
    CHECK (base_cv_text IS NULL OR char_length(base_cv_text) <= 30000),
  DROP CONSTRAINT IF EXISTS account_profiles_career_highlights_count_check,
  ADD CONSTRAINT account_profiles_career_highlights_count_check
    CHECK (cardinality(career_highlights) <= 12);

-- Older onboarding did not collect the fields consumed by matching/CV generation.
-- Active members with an incomplete profile return to the new onboarding once.
UPDATE public.account_profiles AS profile
SET onboarding_completed = false
WHERE EXISTS (
  SELECT 1 FROM public.community_members AS member
  WHERE member.user_id = profile.user_id
    AND member.club_access_status IN ('active', 'complimentary')
    AND (member.club_access_expires_at IS NULL OR member.club_access_expires_at > now())
)
AND (
  nullif(trim(profile.full_name), '') IS NULL
  OR nullif(trim(profile.current_role), '') IS NULL
  OR cardinality(profile.desired_roles) = 0
  OR cardinality(profile.areas_of_expertise) = 0
  OR nullif(trim(profile.career_summary), '') IS NULL
  OR nullif(trim(profile.base_cv_text), '') IS NULL
);

-- Profile mutations are intentionally column-scoped. Billing/access fields are service-only.
REVOKE UPDATE ON public.account_profiles FROM authenticated;
GRANT UPDATE (
  full_name, "current_role", professional_type, years_experience,
  areas_of_expertise, linkedin_url, linkedin_data, onboarding_completed,
  public_headline, public_bio, organization_name, skills, certifications,
  tools_used, open_to_opportunities, preferred_remote, preferred_locations, is_public,
  desired_roles, job_alerts_enabled, cv_suggestions_enabled,
  career_summary, career_highlights, base_cv_text, profile_completed_at
) ON public.account_profiles TO authenticated;

CREATE TABLE IF NOT EXISTS public.personalized_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  pipeline_entry_id uuid NOT NULL REFERENCES public.user_pipeline_entries(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  job_track text NOT NULL CHECK (job_track IN ('technical', 'strategic', 'hybrid', 'operational')),
  headline text,
  summary text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  markdown text NOT NULL DEFAULT '',
  model text,
  error_message text,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id),
  UNIQUE (pipeline_entry_id)
);

CREATE INDEX IF NOT EXISTS personalized_cvs_user_created_idx
  ON public.personalized_cvs (user_id, created_at DESC);

ALTER TABLE public.personalized_cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personalized_cvs_club_owner_read ON public.personalized_cvs;
CREATE POLICY personalized_cvs_club_owner_read
  ON public.personalized_cvs FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND private.has_active_club_access()
  );

REVOKE ALL ON public.personalized_cvs FROM anon, authenticated;
GRANT SELECT ON public.personalized_cvs TO authenticated;
GRANT ALL ON public.personalized_cvs TO service_role;

DROP TRIGGER IF EXISTS personalized_cvs_set_updated_at ON public.personalized_cvs;
CREATE TRIGGER personalized_cvs_set_updated_at
  BEFORE UPDATE ON public.personalized_cvs
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();
;
