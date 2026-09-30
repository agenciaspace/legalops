alter table public.community_events
  add column if not exists google_event_id text,
  add column if not exists google_meet_url text,
  add column if not exists calendar_sync_status text not null default 'not_configured'
    check (calendar_sync_status in ('pending','synced','error','not_configured')),
  add column if not exists calendar_sync_error text,
  add column if not exists calendar_synced_at timestamptz,
  add column if not exists organizer_email text not null default 'hi@legalops.club';

create unique index if not exists community_events_google_event_unique
  on public.community_events(google_event_id)
  where google_event_id is not null;

alter table public.community_event_rsvps
  add column if not exists calendar_invite_status text not null default 'not_required'
    check (calendar_invite_status in ('pending','sent','error','not_required')),
  add column if not exists calendar_invited_at timestamptz,
  add column if not exists calendar_invite_error text;
