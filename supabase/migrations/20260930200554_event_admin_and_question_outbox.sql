insert into public.community_event_admins (event_id, user_id, role)
select event.id, account.id, 'owner'
from public.community_events event
cross join auth.users account
where lower(account.email) = 'leonhatori@gmail.com'
on conflict (event_id, user_id) do update set role = 'owner';

revoke all on function public.assign_legalops_event_owner() from public, anon, authenticated;

create table if not exists public.community_event_whatsapp_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  comment_id uuid not null unique references public.community_comments(id) on delete cascade,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  provider_message_id text,
  created_at timestamptz not null default now()
);

create index if not exists community_event_whatsapp_outbox_pending_idx
  on public.community_event_whatsapp_outbox(created_at)
  where delivered_at is null;

alter table public.community_event_whatsapp_outbox enable row level security;
revoke all on public.community_event_whatsapp_outbox from anon, authenticated;
grant all on public.community_event_whatsapp_outbox to service_role;

create or replace function private.enqueue_event_whatsapp_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.community_event_whatsapp_outbox (event_id, comment_id)
  select post.event_id, new.id
  from public.community_posts post
  join public.community_event_whatsapp_configs config
    on config.event_id = post.event_id and config.enabled = true
  where post.id = new.post_id
    and post.event_id is not null
  on conflict (comment_id) do nothing;

  return new;
end;
$$;

revoke all on function private.enqueue_event_whatsapp_comment() from public, anon, authenticated;

drop trigger if exists enqueue_event_whatsapp_comment on public.community_comments;
create trigger enqueue_event_whatsapp_comment
  after insert on public.community_comments
  for each row execute function private.enqueue_event_whatsapp_comment();
