create table public.community_event_whatsapp_configs (
  event_id uuid primary key references public.community_events(id) on delete cascade,
  group_jid text not null unique check (group_jid ~ '^[0-9-]+@g[.]us$'),
  enabled boolean not null default false,
  summary_hour_local smallint not null default 18 check (summary_hour_local between 0 and 23),
  time_zone text not null default 'America/Sao_Paulo',
  first_run_at timestamptz not null,
  next_run_at timestamptz not null,
  last_status text not null default 'scheduled' check (last_status in ('scheduled','generating','published','empty','error')),
  last_period_end timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_event_whatsapp_summaries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  title text not null check (length(title) between 3 and 180),
  summary text not null check (length(summary) between 10 and 5000),
  key_points text[] not null default '{}' check (cardinality(key_points) <= 5),
  source_message_count integer not null check (source_message_count > 0),
  source_participant_count integer not null check (source_participant_count > 0),
  omitted_media_count integer not null default 0 check (omitted_media_count >= 0),
  model text not null,
  published_at timestamptz not null default now(),
  whatsapp_sent_at timestamptz,
  unique (event_id, period_end),
  check (period_end - period_start = interval '24 hours')
);

alter table public.community_event_whatsapp_configs enable row level security;
alter table public.community_event_whatsapp_summaries enable row level security;
revoke all on public.community_event_whatsapp_configs, public.community_event_whatsapp_summaries from anon, authenticated;
grant select on public.community_event_whatsapp_summaries to anon, authenticated;
grant all on public.community_event_whatsapp_configs, public.community_event_whatsapp_summaries to service_role;
create policy event_whatsapp_summaries_public_read on public.community_event_whatsapp_summaries
  for select to anon, authenticated
  using (exists (
    select 1 from public.community_events event
    where event.id = community_event_whatsapp_summaries.event_id
      and event.is_published = true
  ));

insert into public.community_event_whatsapp_configs (
  event_id, group_jid, enabled, summary_hour_local, time_zone, first_run_at, next_run_at
)
select id, '120363432116359544@g.us', true, 18, 'America/Sao_Paulo', '2026-09-30T21:00:00Z', '2026-09-30T21:00:00Z'
from public.community_events
where slug = 'bench-netlex-2026'
on conflict (event_id) do update set
  group_jid = excluded.group_jid,
  enabled = excluded.enabled,
  summary_hour_local = excluded.summary_hour_local,
  time_zone = excluded.time_zone,
  first_run_at = excluded.first_run_at,
  next_run_at = excluded.next_run_at,
  updated_at = now();
