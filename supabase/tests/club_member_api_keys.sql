-- Run with a database administrator. Every assertion rolls back.
begin;
do $$
begin
  if not (select relrowsecurity from pg_class where oid='public.club_member_api_keys'::regclass) then
    raise exception 'RLS must be enabled';
  end if;
  if has_table_privilege('anon', 'public.club_member_api_keys', 'select,insert,update,delete')
    or has_table_privilege('authenticated', 'public.club_member_api_keys', 'select,insert,update,delete') then
    raise exception 'Browser roles must have no credential access';
  end if;
  if not has_table_privilege('service_role', 'public.club_member_api_keys', 'select,insert,update,delete') then
    raise exception 'Server credential operations are unavailable';
  end if;
end $$;
set local role authenticated;
do $$
begin
  begin
    perform encrypted_key from public.club_member_api_keys;
    raise exception 'Authenticated credential read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.club_member_api_keys where false;
    raise exception 'Authenticated credential deletion unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role anon;
do $$
begin
  begin
    perform encrypted_key from public.club_member_api_keys;
    raise exception 'Anonymous credential read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
