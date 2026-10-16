create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 140),
  title text not null check (length(title) between 10 and 200),
  summary text not null check (length(summary) between 30 and 600),
  body text not null check (length(body) between 80 and 30000),
  audiences text[] not null check (cardinality(audiences) > 0 and audiences <@ array['escritorios','departamentos-juridicos','prestadores']),
  topics text[] not null check (cardinality(topics) > 0 and topics <@ array['ia-tecnologia','operacoes-contratos','negocios-mercado','pessoas-competencias','governanca']),
  impact jsonb not null default '{}',
  sources jsonb not null check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) > 0),
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  event_date date,
  author_name text not null default 'Redação legalops.news',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);
create index news_articles_published on public.news_articles(published_at desc, id) where status = 'published';
create index news_articles_audiences on public.news_articles using gin(audiences);
create index news_articles_topics on public.news_articles using gin(topics);
alter table public.news_articles enable row level security;
revoke all on public.news_articles from anon, authenticated;
grant select on public.news_articles to anon, authenticated;
grant all on public.news_articles to service_role;
create policy news_articles_public on public.news_articles for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create table public.news_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  audiences text[] not null default '{}' check (audiences <@ array['escritorios','departamentos-juridicos','prestadores']),
  topics text[] not null default '{}' check (topics <@ array['ia-tecnologia','operacoes-contratos','negocios-mercado','pessoas-competencias','governanca']),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.news_preferences enable row level security;
revoke all on public.news_preferences from anon, authenticated;
grant select, insert, update, delete on public.news_preferences to authenticated;
grant all on public.news_preferences to service_role;
create policy news_preferences_read on public.news_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy news_preferences_create on public.news_preferences for insert to authenticated with check ((select auth.uid()) = user_id and private.has_active_club_access());
create policy news_preferences_update on public.news_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and private.has_active_club_access());
create policy news_preferences_delete on public.news_preferences for delete to authenticated using ((select auth.uid()) = user_id);

-- Email subscription is independent of Club membership. Anonymous clients never
-- receive table access; the server records explicit consent through a bounded RPC.
create table public.news_email_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email)) and length(email) between 5 and 254),
  audiences text[] not null default '{}' check (audiences <@ array['escritorios','departamentos-juridicos','prestadores']),
  topics text[] not null default '{}' check (topics <@ array['ia-tecnologia','operacoes-contratos','negocios-mercado','pessoas-competencias','governanca']),
  source text not null check (source in ('news','club')),
  consent_version text not null default 'news-email-v1',
  consent_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','sent_to_provider','cancelled')),
  provider_subscription_id text,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.news_email_signups enable row level security;
revoke all on public.news_email_signups from anon, authenticated;
grant all on public.news_email_signups to service_role;
create index news_signups_queue on public.news_email_signups(next_attempt_at) where status = 'pending';

create table public.news_signup_limits (
  network_key text not null check (length(network_key) = 64),
  window_start timestamptz not null,
  attempts integer not null default 1,
  primary key(network_key, window_start)
);
alter table public.news_signup_limits enable row level security;
revoke all on public.news_signup_limits from anon, authenticated;
grant all on public.news_signup_limits to service_role;

create function public.register_news_signup(contact_email text, selected_audiences text[], selected_topics text[], network_key text, signup_source text)
returns void language plpgsql security invoker set search_path = '' as $$
declare tries integer;
begin
  insert into public.news_signup_limits(network_key, window_start) values (network_key, date_trunc('hour',now()))
    on conflict on constraint news_signup_limits_pkey do update set attempts = public.news_signup_limits.attempts + 1 returning attempts into tries;
  if tries > 5 then raise exception 'NEWS_RATE_LIMIT'; end if;
  insert into public.news_email_signups(email,audiences,topics,source)
    values(lower(trim(contact_email)), selected_audiences, selected_topics, signup_source)
    on conflict(email) do nothing;
  delete from public.news_signup_limits where window_start < now() - interval '2 days';
end;
$$;
revoke all on function public.register_news_signup(text,text[],text[],text,text) from public, anon, authenticated;
grant execute on function public.register_news_signup(text,text[],text[],text,text) to service_role;

create function public.claim_news_signups()
returns setof public.news_email_signups language sql security invoker set search_path = '' as $$
  update public.news_email_signups s set lease_token = gen_random_uuid(), lease_until = now() + interval '5 minutes', attempts = attempts + 1
  where s.id in (
    select id from public.news_email_signups where status = 'pending' and next_attempt_at <= now() and attempts < 5
      and (lease_until is null or lease_until < now()) order by created_at for update skip locked limit 5
  ) returning s.*;
$$;
revoke all on function public.claim_news_signups() from public, anon, authenticated;
grant execute on function public.claim_news_signups() to service_role;

create table public.news_candidates (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text not null,
  excerpt text not null,
  source_name text not null,
  discovered_at timestamptz not null default now(),
  status text not null default 'pending' check(status in ('pending','dismissed','published'))
);
alter table public.news_candidates enable row level security;
revoke all on public.news_candidates from anon, authenticated;
grant all on public.news_candidates to service_role;
