-- Keep profile authorization efficient and make the shared update trigger deterministic.

ALTER FUNCTION public.set_row_updated_at() SET search_path = '';

DROP POLICY IF EXISTS account_profiles_owner_read ON public.account_profiles;
CREATE POLICY account_profiles_owner_read
  ON public.account_profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS account_profiles_owner_update ON public.account_profiles;
CREATE POLICY account_profiles_owner_update
  ON public.account_profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
;
