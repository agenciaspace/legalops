-- Preserve the existing owner-only RLS and narrow column update allowlist.
grant update (preferred_locale,country_code,timezone) on public.account_profiles to authenticated;
