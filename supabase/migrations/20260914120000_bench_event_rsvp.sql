-- Bench Nubank: event details and member RSVP/profile data.
create table if not exists public.community_event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  response text not null default 'pending' check (response in ('pending', 'confirmed', 'declined')),
  guest_name text not null check (char_length(guest_name) between 2 and 120),
  guest_role text not null check (char_length(guest_role) between 2 and 120),
  organization_name text not null check (char_length(organization_name) between 2 and 120),
  guest_email text not null check (position('@' in guest_email) > 1),
  guest_phone text,
  dietary_restrictions text,
  accessibility_needs text,
  arrival_notes text,
  confirmed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists community_event_rsvps_event_idx on public.community_event_rsvps (event_id, response);
alter table public.community_event_rsvps enable row level security;

create policy community_event_rsvps_select_own on public.community_event_rsvps
  for select to authenticated using ((select auth.uid()) = user_id and private.has_active_club_access());
create policy community_event_rsvps_insert_own on public.community_event_rsvps
  for insert to authenticated with check ((select auth.uid()) = user_id and private.has_active_club_access());
create policy community_event_rsvps_update_own on public.community_event_rsvps
  for update to authenticated
  using ((select auth.uid()) = user_id and private.has_active_club_access())
  with check ((select auth.uid()) = user_id and private.has_active_club_access());
grant select, insert, update on public.community_event_rsvps to authenticated;

insert into public.community_events
  (slug, title, description, host_name, starts_at, ends_at, location_label, location_url, event_type, is_published)
values
  ('bench-nubank-2026-09-17', 'Bench LegalOps no Nubank', 'O primeiro Bench do LegalOps Club: uma conversa presencial e prática sobre como operações jurídicas se conectam ao negócio, com espaço para troca entre participantes.', 'LegalOps Club + Nubank', '2026-09-17 19:00:00-03', '2026-09-17 21:00:00-03', 'Nubank — Rua Capote Valente, 39, Pinheiros, São Paulo — SP', 'https://www.google.com/maps/search/?api=1&query=Nubank%20Rua%20Capote%20Valente%2039%20Pinheiros%20S%C3%A3o%20Paulo', 'networking', true)
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, host_name = excluded.host_name,
  starts_at = excluded.starts_at, ends_at = excluded.ends_at, location_label = excluded.location_label,
  location_url = excluded.location_url, event_type = excluded.event_type, is_published = excluded.is_published;
