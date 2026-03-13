CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS account_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER account_profiles_set_updated_at
  BEFORE UPDATE ON account_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE account_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_profiles_owner_read" ON account_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

INSERT INTO account_profiles (user_id)
SELECT id
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.bootstrap_account_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.account_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_account_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_account_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.bootstrap_account_profile();

CREATE TABLE IF NOT EXISTS email_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT 'Primary domain',
  is_active boolean NOT NULL DEFAULT true,
  allow_random boolean NOT NULL DEFAULT true,
  allow_custom boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER email_domains_set_updated_at
  BEFORE UPDATE ON email_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE email_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_domains_active_read" ON email_domains
  FOR SELECT TO authenticated
  USING (is_active = true);

INSERT INTO email_domains (domain, label)
VALUES ('mail.legalops.test', 'Managed test domain')
ON CONFLICT (domain) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_user_email_alias_address()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  selected_domain text;
BEGIN
  SELECT domain
  INTO selected_domain
  FROM public.email_domains
  WHERE id = NEW.domain_id;

  IF selected_domain IS NULL THEN
    RAISE EXCEPTION 'email domain not found for alias';
  END IF;

  NEW.local_part = lower(trim(NEW.local_part));
  NEW.address = NEW.local_part || '@' || lower(selected_domain);

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS user_email_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES email_domains(id) ON DELETE RESTRICT,
  local_part text NOT NULL,
  address text NOT NULL,
  source text NOT NULL CHECK (source IN ('random', 'custom')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  is_primary boolean NOT NULL DEFAULT false,
  provider text,
  provider_alias_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_email_aliases_local_part_format CHECK (
    local_part ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'
  )
);

CREATE TRIGGER user_email_aliases_set_updated_at
  BEFORE UPDATE ON user_email_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

CREATE TRIGGER user_email_aliases_sync_address
  BEFORE INSERT OR UPDATE OF local_part, domain_id ON user_email_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email_alias_address();

CREATE UNIQUE INDEX user_email_aliases_address_unique_idx
  ON user_email_aliases (lower(address));

CREATE UNIQUE INDEX user_email_aliases_domain_local_unique_idx
  ON user_email_aliases (domain_id, lower(local_part));

CREATE UNIQUE INDEX user_email_aliases_single_primary_idx
  ON user_email_aliases (user_id)
  WHERE is_primary = true AND status = 'active';

ALTER TABLE user_email_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_email_aliases_owner" ON user_email_aliases
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
