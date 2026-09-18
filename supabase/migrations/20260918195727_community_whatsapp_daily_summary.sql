create table public.club_whatsapp_summaries (
 id uuid primary key default gen_random_uuid(),
 period_start timestamptz not null,
 period_end timestamptz not null unique,
 title text not null check (length(title) between 3 and 180),
 summary text not null check (length(summary) between 10 and 5000),
 key_points text[] not null default '{}' check (cardinality(key_points) <= 5),
 source_message_count integer not null check (source_message_count > 0),
 source_participant_count integer not null check (source_participant_count > 0),
 omitted_media_count integer not null default 0 check (omitted_media_count >= 0),
 model text not null,
 published_at timestamptz not null default now(),
 whatsapp_sent_at timestamptz,
 check (period_end - period_start = interval '24 hours')
);
create table public.club_whatsapp_summary_schedule (
 id text primary key check (id = 'community'),
 enabled boolean not null default false,
 first_run_at timestamptz not null,
 next_run_at timestamptz not null,
 last_status text not null default 'scheduled' check (last_status in ('scheduled','generating','published','empty','error')),
 last_period_end timestamptz,
 last_checked_at timestamptz
);
alter table public.club_whatsapp_summaries enable row level security;
alter table public.club_whatsapp_summary_schedule enable row level security;
revoke all on public.club_whatsapp_summaries, public.club_whatsapp_summary_schedule from anon, authenticated;
grant select on public.club_whatsapp_summaries, public.club_whatsapp_summary_schedule to authenticated;
grant all on public.club_whatsapp_summaries, public.club_whatsapp_summary_schedule to service_role;
create policy whatsapp_summaries_members_read on public.club_whatsapp_summaries for select to authenticated using (private.has_active_club_access());
create policy whatsapp_schedule_members_read on public.club_whatsapp_summary_schedule for select to authenticated using (private.has_active_club_access());
insert into public.club_whatsapp_summary_schedule (id, first_run_at, next_run_at)
values ('community', '2026-09-18T21:00:00Z', '2026-09-18T21:00:00Z');
