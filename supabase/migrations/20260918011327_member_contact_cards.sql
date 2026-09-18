create table public.community_contact_cards (
  user_id uuid primary key references public.community_members(user_id) on delete cascade,
  email text check (email is null or length(email) <= 254),
  phone text check (phone is null or phone ~ '^\+[0-9]{8,15}$'),
  website text check (website is null or (length(website) <= 500 and website like 'https://%')),
  public_enabled boolean not null default false
);
alter table public.community_contact_cards enable row level security;
grant select, insert, update on public.community_contact_cards to authenticated;
revoke all on public.community_contact_cards from anon;
create policy contact_cards_read on public.community_contact_cards for select to authenticated
  using (user_id = (select auth.uid()) or private.has_active_club_access());
create policy contact_cards_insert on public.community_contact_cards for insert to authenticated
  with check (user_id = (select auth.uid()) and private.has_active_club_access());
create policy contact_cards_update on public.community_contact_cards for update to authenticated
  using (user_id = (select auth.uid()) and private.has_active_club_access())
  with check (user_id = (select auth.uid()) and private.has_active_club_access());

create table public.community_saved_contacts (
  user_id uuid not null references public.community_members(user_id) on delete cascade,
  member_id uuid not null references public.community_members(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, member_id),
  check (user_id <> member_id)
);
create index community_saved_contacts_member on public.community_saved_contacts(member_id);
alter table public.community_saved_contacts enable row level security;
grant select, insert, delete on public.community_saved_contacts to authenticated;
revoke all on public.community_saved_contacts from anon;
create policy saved_contacts_read on public.community_saved_contacts for select to authenticated
  using (user_id = (select auth.uid()) and private.has_active_club_access());
create policy saved_contacts_insert on public.community_saved_contacts for insert to authenticated
  with check (user_id = (select auth.uid()) and user_id <> member_id and private.has_active_club_access());
create policy saved_contacts_delete on public.community_saved_contacts for delete to authenticated
  using (user_id = (select auth.uid()) and private.has_active_club_access());
