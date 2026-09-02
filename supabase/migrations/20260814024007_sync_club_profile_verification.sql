-- Profile verification follows the LinkedIn data already collected by the app,
-- so members never need permission to update their own verification flag.

CREATE OR REPLACE FUNCTION public.sync_community_member_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.community_members (
    user_id,
    display_name,
    "current_role",
    areas_of_expertise,
    public_headline,
    public_bio,
    organization_name,
    linkedin_url,
    profile_verification_status,
    profile_verified_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    COALESCE(NULLIF(NEW.full_name, ''), 'Membro LegalOps'),
    NEW."current_role",
    COALESCE(NEW.areas_of_expertise, '{}'),
    NEW.public_headline,
    NEW.public_bio,
    NEW.organization_name,
    NEW.linkedin_url,
    CASE
      WHEN NEW.linkedin_url IS NOT NULL AND NEW.linkedin_data IS NOT NULL THEN 'verified'
      WHEN NEW.linkedin_url IS NOT NULL THEN 'pending'
      ELSE 'unverified'
    END,
    CASE
      WHEN NEW.linkedin_url IS NOT NULL AND NEW.linkedin_data IS NOT NULL THEN now()
      ELSE NULL
    END,
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    "current_role" = EXCLUDED."current_role",
    areas_of_expertise = EXCLUDED.areas_of_expertise,
    public_headline = EXCLUDED.public_headline,
    public_bio = EXCLUDED.public_bio,
    organization_name = EXCLUDED.organization_name,
    linkedin_url = EXCLUDED.linkedin_url,
    profile_verification_status = EXCLUDED.profile_verification_status,
    profile_verified_at = EXCLUDED.profile_verified_at,
    updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_community_member_profile() FROM PUBLIC;

DROP TRIGGER IF EXISTS account_profiles_sync_community_member ON public.account_profiles;
CREATE TRIGGER account_profiles_sync_community_member
  AFTER INSERT OR UPDATE OF full_name, "current_role", areas_of_expertise, public_headline, public_bio, organization_name, linkedin_url, linkedin_data
  ON public.account_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_community_member_profile();
;
