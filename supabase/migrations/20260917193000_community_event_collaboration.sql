-- Event collaboration: members can organize events and contribute after attending.
alter table public.community_posts
  add column if not exists event_id uuid references public.community_events(id) on delete set null;
create index if not exists community_posts_event_idx on public.community_posts(event_id, created_at desc);

create table if not exists public.community_event_admins (
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'organizer' check (role in ('owner','organizer')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.community_event_admins enable row level security;
create policy community_event_admins_member_read on public.community_event_admins
  for select to authenticated using (private.has_active_club_access());
create policy community_event_admins_self_insert on public.community_event_admins
  for insert to authenticated with check ((select auth.uid()) = user_id and private.has_active_club_access());
grant select, insert on public.community_event_admins to authenticated;

create table if not exists public.community_event_resources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('foto','documento','link','outro')),
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  resource_url text not null check (resource_url ~ '^https://'),
  created_at timestamptz not null default now()
);
create index if not exists community_event_resources_event_idx on public.community_event_resources(event_id, created_at desc);
alter table public.community_event_resources enable row level security;
create policy community_event_resources_member_read on public.community_event_resources
  for select to authenticated using (
    private.has_active_club_access() and exists (
      select 1 from public.community_event_rsvps r
      where r.event_id = community_event_resources.event_id and r.user_id = (select auth.uid()) and r.response = 'confirmed'
    )
  );
create policy community_event_resources_member_insert on public.community_event_resources
  for insert to authenticated with check (
    (select auth.uid()) = uploader_id and private.has_active_club_access() and exists (
      select 1 from public.community_event_rsvps r
      where r.event_id = community_event_resources.event_id and r.user_id = (select auth.uid()) and r.response = 'confirmed'
    )
  );
grant select, insert on public.community_event_resources to authenticated;

create table if not exists public.community_event_attendees (
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.community_event_attendees enable row level security;
create policy community_event_attendees_own_read on public.community_event_attendees
  for select to authenticated using ((select auth.uid()) = user_id and private.has_active_club_access());
grant select, insert on public.community_event_attendees to authenticated;
