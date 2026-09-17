alter table public.community_events
  add column if not exists participation_mode text not null default 'remoto' check (participation_mode in ('presencial','remoto','hibrido')),
  add column if not exists participation_details text not null default '',
  add column if not exists pre_questions text[] not null default '{}',
  add column if not exists extra_registration_fields jsonb not null default '[]'::jsonb;
