-- Credentials are envelope-encrypted by the application before reaching Postgres.
-- Only server code may access this table, always filtering by authenticated user.
create table public.club_member_api_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_key text not null check (length(encrypted_key) between 40 and 2048 and encrypted_key like 'v1.%'),
  key_last_four text not null check (key_last_four ~ '^[A-Za-z0-9_-]{4}$'),
  updated_at timestamptz not null default now()
);

alter table public.club_member_api_keys enable row level security;
revoke all on public.club_member_api_keys from public, anon, authenticated;
grant select, insert, update, delete on public.club_member_api_keys to service_role;

comment on table public.club_member_api_keys is 'Member-owned OpenAI API credentials. AES-256-GCM ciphertext only; no browser grants or policies.';
