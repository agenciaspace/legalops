-- Add professional profile fields to account_profiles

ALTER TABLE account_profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS current_role text,
  ADD COLUMN IF NOT EXISTS professional_type text
    CHECK (professional_type IN ('law_firm', 'legal_dept', 'public_sector', 'freelance', 'other')),
  ADD COLUMN IF NOT EXISTS years_experience int,
  ADD COLUMN IF NOT EXISTS areas_of_expertise text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS linkedin_data jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Allow authenticated users to update their own profile
CREATE POLICY "account_profiles_owner_update" ON account_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
