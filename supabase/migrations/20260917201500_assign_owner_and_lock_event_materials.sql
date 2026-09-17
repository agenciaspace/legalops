-- Leon is the owner/admin for every community event, including events created later.
insert into public.community_event_admins (event_id, user_id, role)
select event.id, account.id, 'owner'
from public.community_events event
cross join auth.users account
where lower(account.email) = 'leonhatori@gmail.com'
on conflict (event_id, user_id) do update set role = 'owner';

create or replace function public.assign_legalops_event_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_event_admins (event_id, user_id, role)
  select new.id, id, 'owner'
  from auth.users
  where lower(email) = 'leonhatori@gmail.com'
  on conflict (event_id, user_id) do update set role = 'owner';
  return new;
end;
$$;
revoke all on function public.assign_legalops_event_owner() from public;
drop trigger if exists community_event_owner on public.community_events;
create trigger community_event_owner
  after insert on public.community_events
  for each row execute function public.assign_legalops_event_owner();

drop policy if exists community_event_resources_member_read on public.community_event_resources;
create policy community_event_resources_member_read on public.community_event_resources
  for select to authenticated using (
    private.has_active_club_access() and (
      exists (
        select 1 from public.community_event_admins a
        where a.event_id = community_event_resources.event_id and a.user_id = (select auth.uid())
      ) or exists (
        select 1 from public.community_event_rsvps r
        where r.event_id = community_event_resources.event_id and r.user_id = (select auth.uid()) and r.response = 'confirmed'
      )
    )
  );

drop policy if exists community_event_resources_member_insert on public.community_event_resources;
create policy community_event_resources_member_insert on public.community_event_resources
  for insert to authenticated with check (
    (select auth.uid()) = uploader_id and private.has_active_club_access() and (
      exists (
        select 1 from public.community_event_admins a
        where a.event_id = community_event_resources.event_id and a.user_id = (select auth.uid())
      ) or exists (
        select 1 from public.community_event_rsvps r
        where r.event_id = community_event_resources.event_id and r.user_id = (select auth.uid()) and r.response = 'confirmed'
      )
    )
  );
