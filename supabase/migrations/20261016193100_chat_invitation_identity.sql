-- Keep auth-schema access in a private, service-only predicate. The service role
-- intentionally has no general SELECT grant on auth.users.
create function chat_private.confirmed_email(actor uuid, verified_email text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=actor and lower(email)=lower(verified_email) and email_confirmed_at is not null);
$$;
revoke all on function chat_private.confirmed_email(uuid,text) from public,anon,authenticated;
grant execute on function chat_private.confirmed_email(uuid,text) to service_role;
create or replace function public.chat_accept_invitation(actor uuid, verified_email text, digest text) returns uuid language plpgsql set search_path='' as $$
declare i public.chat_invitations;
begin
 select * into i from public.chat_invitations where token_hash=digest and lower(email)=lower(verified_email) and accepted_at is null and expires_at>now() for update;
 if i.id is null then raise exception 'invalid_invitation'; end if;
 if not chat_private.confirmed_email(actor,verified_email) then raise exception 'email_unverified'; end if;
 insert into public.chat_members(workspace_id,user_id,role) values(i.workspace_id,actor,'member') on conflict do nothing;
 update public.chat_invitations set accepted_at=now() where id=i.id;
 return i.workspace_id;
end $$;
