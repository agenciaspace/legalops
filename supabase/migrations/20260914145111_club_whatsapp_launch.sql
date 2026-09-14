create table if not exists public.club_launch_config (
  id boolean primary key default true check (id),
  whatsapp_group_jid text unique,
  whatsapp_invite_url text,
  launched_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.club_launch_config enable row level security;
revoke all on public.club_launch_config from anon, authenticated;
