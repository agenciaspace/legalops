-- Publication outbox for the explicitly configured legalops.news announcement group.
-- Existing stories are intentionally not backfilled.
create table public.news_whatsapp_deliveries (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null unique references public.news_articles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sending','accepted','failed','uncertain','cancelled')),
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  claim_token uuid,
  destination text,
  provider_message_id text,
  error_code text check (length(error_code) <= 100)
);
alter table public.news_whatsapp_deliveries enable row level security;
revoke all on public.news_whatsapp_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.news_whatsapp_deliveries to service_role;
create index news_whatsapp_pending_idx on public.news_whatsapp_deliveries (queued_at, id) where status = 'pending';

create function public.news_queue_whatsapp_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' and new.published_at is not null then
    if TG_OP = 'INSERT' then
      insert into public.news_whatsapp_deliveries(article_id) values (new.id) on conflict (article_id) do nothing;
    elsif old.status <> 'published' then
      insert into public.news_whatsapp_deliveries(article_id) values (new.id) on conflict (article_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.news_queue_whatsapp_publication() from public, anon, authenticated;
create trigger news_queue_whatsapp_after_publish after insert or update of status on public.news_articles
for each row execute function public.news_queue_whatsapp_publication();

create function public.news_whatsapp_claim(p_group_id text, p_limit integer default 2)
returns setof public.news_whatsapp_deliveries
language plpgsql security invoker set search_path = '' as $$
begin
  if p_group_id is null or p_group_id !~ '^[0-9]+(-[0-9]+)?@g\.us$' then
    raise exception 'invalid_news_group';
  end if;
  return query
  with ready as (
    select d.id from public.news_whatsapp_deliveries d
    join public.news_articles a on a.id = d.article_id
    where d.status = 'pending' and a.status = 'published' and a.published_at <= now()
    order by d.queued_at, d.id limit greatest(1, least(coalesce(p_limit, 2), 2))
    for update of d skip locked
  )
  update public.news_whatsapp_deliveries d
  set status = 'sending', started_at = now(), claim_token = gen_random_uuid(), destination = p_group_id
  from ready where ready.id = d.id returning d.*;
end;
$$;
revoke all on function public.news_whatsapp_claim(text, integer) from public, anon, authenticated;
grant execute on function public.news_whatsapp_claim(text, integer) to service_role;

comment on table public.news_whatsapp_deliveries is 'Service-only publication outbox. One automatic provider attempt per article; uncertain or interrupted sends require reconciliation, never automatic resend.';
comment on function public.news_whatsapp_claim(text, integer) is 'Service-only atomic claims. Sending rows are never reclaimed automatically because a provider may already have accepted the message.';
