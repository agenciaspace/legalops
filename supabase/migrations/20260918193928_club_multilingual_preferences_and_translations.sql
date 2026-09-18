-- One original, one revision, three shared translations. No per-reader model calls.
alter table public.account_profiles
  add column preferred_locale text check (preferred_locale in ('pt-BR','en','es')),
  add column country_code text check (country_code ~ '^[A-Z]{2}$'),
  add column timezone text check (length(timezone) between 1 and 80);
alter table public.community_posts add column source_locale text check (source_locale in ('pt-BR','en','es'));
alter table public.community_comments add column source_locale text check (source_locale in ('pt-BR','en','es'));

create table public.club_translation_config (
  id boolean primary key default true check (id),
  generation_enabled boolean not null default false,
  reading_enabled boolean not null default false,
  daily_budget_usd numeric not null default 1 check (daily_budget_usd between 0 and 20)
);
insert into public.club_translation_config(id) values(true);
alter table public.club_translation_config enable row level security;
revoke all on public.club_translation_config from anon, authenticated;
grant select on public.club_translation_config to anon, authenticated;
create policy translation_config_read on public.club_translation_config for select to anon, authenticated using(true);

create table public.club_translation_sources (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  post_id uuid unique references public.community_posts(id) on delete cascade,
  comment_id uuid unique references public.community_comments(id) on delete cascade,
  event_id uuid unique references public.community_events(id) on delete cascade,
  topic_id uuid unique references public.community_forum_topics(id) on delete cascade,
  member_id uuid unique references public.community_members(user_id) on delete cascade,
  summary_id uuid unique references public.community_discussion_summaries(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1,
  locale_hint text check (locale_hint in ('pt-BR','en','es')),
  detected_locale text,
  translations jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','processing','ready','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  model text,
  updated_at timestamptz not null default now(),
  unique(entity_type,entity_id),
  check (num_nonnulls(post_id,comment_id,event_id,topic_id,member_id,summary_id)=1),
  check (entity_id=coalesce(post_id,comment_id,event_id,topic_id,member_id,summary_id)),
  check ((entity_type='post' and post_id is not null) or (entity_type='comment' and comment_id is not null)
    or (entity_type='event' and event_id is not null) or (entity_type='topic' and topic_id is not null)
    or (entity_type='member' and member_id is not null) or (entity_type='summary' and summary_id is not null))
);
create index club_translation_queue on public.club_translation_sources(status,next_attempt_at);
alter table public.club_translation_sources enable row level security;
revoke all on public.club_translation_sources from anon, authenticated;
grant select on public.club_translation_sources to anon, authenticated;
create policy translations_public_original on public.club_translation_sources for select to anon using (
  (post_id is not null and exists(select 1 from public.community_posts p where p.id=post_id)) or
  (event_id is not null and exists(select 1 from public.community_events e where e.id=event_id)) or
  (summary_id is not null and exists(select 1 from public.community_discussion_summaries s where s.id=summary_id))
);
-- Each EXISTS uses the original table's RLS. Permission changes apply immediately.
create policy translations_follow_original on public.club_translation_sources for select to authenticated using (
  (post_id is not null and exists(select 1 from public.community_posts o where o.id=post_id)) or
  (comment_id is not null and exists(select 1 from public.community_comments o where o.id=comment_id)) or
  (event_id is not null and exists(select 1 from public.community_events o where o.id=event_id)) or
  (topic_id is not null and exists(select 1 from public.community_forum_topics o where o.id=topic_id)) or
  (member_id is not null and exists(select 1 from public.community_members o where o.user_id=member_id)) or
  (summary_id is not null and exists(select 1 from public.community_discussion_summaries o where o.id=summary_id))
);
create table public.club_translation_runs (
  id uuid primary key,
  source_id uuid references public.club_translation_sources(id) on delete set null,
  revision bigint not null,
  reserved_usd numeric not null default 0.10,
  actual_usd numeric check(actual_usd >= 0),
  input_tokens integer,
  output_tokens integer,
  status text not null default 'reserved',
  created_at timestamptz not null default now()
);
create index translation_runs_day on public.club_translation_runs(created_at);
alter table public.club_translation_runs enable row level security;
revoke all on public.club_translation_runs from anon, authenticated;
grant all on public.club_translation_config, public.club_translation_sources, public.club_translation_runs to service_role;

-- A trigger must write the private queue atomically with each authorized original.
-- It has no public execute grant and writes only whitelisted fields from NEW.
create function private.queue_club_translation() returns trigger language plpgsql security definer set search_path='' as $$
declare doc jsonb:=to_jsonb(new); selected jsonb; source_key uuid; hint text;
begin
  select coalesce(jsonb_object_agg(key,value),'{}') into selected from jsonb_each(doc) where key=any(string_to_array(tg_argv[2],','));
  source_key:=(doc->>tg_argv[1])::uuid;
  hint:=doc->>'source_locale';
  insert into public.club_translation_sources(entity_type,entity_id,post_id,comment_id,event_id,topic_id,member_id,summary_id,payload,locale_hint)
  values(tg_argv[0],source_key,
    case when tg_argv[0]='post' then source_key end,case when tg_argv[0]='comment' then source_key end,
    case when tg_argv[0]='event' then source_key end,case when tg_argv[0]='topic' then source_key end,
    case when tg_argv[0]='member' then source_key end,case when tg_argv[0]='summary' then source_key end,selected,hint)
  on conflict(entity_type,entity_id) do update set
    payload=excluded.payload,locale_hint=excluded.locale_hint,revision=club_translation_sources.revision+1,
    detected_locale=null,translations='{}',status='pending',attempts=0,next_attempt_at=now(),lease_token=null,lease_expires_at=null,updated_at=now()
  where club_translation_sources.payload is distinct from excluded.payload or club_translation_sources.locale_hint is distinct from excluded.locale_hint;
  return new;
end $$;
revoke all on function private.queue_club_translation() from public,anon,authenticated;
create trigger queue_translation after insert or update on public.community_posts for each row execute function private.queue_club_translation('post','id','title,body');
insert into public.club_translation_sources(entity_type,entity_id,post_id,payload,locale_hint) select 'post',o.id,o.id,jsonb_build_object('title',o.title,'body',o.body),o.source_locale from public.community_posts o;
create trigger queue_translation after insert or update on public.community_comments for each row execute function private.queue_club_translation('comment','id','body');
insert into public.club_translation_sources(entity_type,entity_id,comment_id,payload,locale_hint) select 'comment',o.id,o.id,jsonb_build_object('body',o.body),o.source_locale from public.community_comments o;
create trigger queue_translation after insert or update on public.community_events for each row execute function private.queue_club_translation('event','id','title,description,location_label,participation_details');
insert into public.club_translation_sources(entity_type,entity_id,event_id,payload,locale_hint) select 'event',o.id,o.id,jsonb_build_object('title',o.title,'description',o.description,'location_label',o.location_label,'participation_details',o.participation_details),null from public.community_events o;
create trigger queue_translation after insert or update on public.community_forum_topics for each row execute function private.queue_club_translation('topic','id','title,description');
insert into public.club_translation_sources(entity_type,entity_id,topic_id,payload,locale_hint) select 'topic',o.id,o.id,jsonb_build_object('title',o.title,'description',o.description),null from public.community_forum_topics o;
create trigger queue_translation after insert or update on public.community_members for each row execute function private.queue_club_translation('member','user_id','current_role,public_headline,public_bio,organization_description,areas_of_expertise');
insert into public.club_translation_sources(entity_type,entity_id,member_id,payload,locale_hint) select 'member',o.user_id,o.user_id,jsonb_build_object('current_role',o.current_role,'public_headline',o.public_headline,'public_bio',o.public_bio,'organization_description',o.organization_description,'areas_of_expertise',o.areas_of_expertise),null from public.community_members o;
create trigger queue_translation after insert or update on public.community_discussion_summaries for each row execute function private.queue_club_translation('summary','id','title,summary,key_points');
insert into public.club_translation_sources(entity_type,entity_id,summary_id,payload,locale_hint) select 'summary',o.id,o.id,jsonb_build_object('title',o.title,'summary',o.summary,'key_points',o.key_points),null from public.community_discussion_summaries o;

-- Service-role-only leases plus budget reservations prevent parallel double spending.
create function public.claim_club_translations(batch_size integer default 3)
returns setof public.club_translation_sources language plpgsql security invoker set search_path='' as $$
declare item public.club_translation_sources; spent numeric; budget numeric; claim uuid; processed integer:=0;
begin
  if current_user <> 'service_role' and current_user <> 'postgres' then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(71342189);
  update public.club_translation_sources set status='failed' where status='processing' and attempts>=3 and lease_expires_at<now();
  select daily_budget_usd into budget from public.club_translation_config where id and generation_enabled;
  if budget is null then return; end if;
  select coalesce(sum(coalesce(actual_usd,reserved_usd)),0) into spent from public.club_translation_runs where created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  for item in select * from public.club_translation_sources
    where attempts < 3 and ((status='pending' and next_attempt_at<=now()) or (status='processing' and lease_expires_at<now()))
    order by updated_at desc for update skip locked
  loop
    exit when processed>=least(greatest(batch_size,1),3) or spent+0.10>budget;
    claim:=gen_random_uuid();
    update public.club_translation_sources set status='processing',attempts=attempts+1,lease_token=claim,lease_expires_at=now()+interval '5 minutes' where id=item.id returning * into item;
    insert into public.club_translation_runs(id,source_id,revision) values(claim,item.id,item.revision);
    spent:=spent+0.10; processed:=processed+1;
    return next item;
  end loop;
end $$;
revoke all on function public.claim_club_translations(integer) from public,anon,authenticated;
grant execute on function public.claim_club_translations(integer) to service_role;

create function public.search_club_posts(search_text text, target_locale text, category_filter text default null)
returns table(id uuid) language sql stable security invoker set search_path='' as $$
  select p.id from public.community_posts p
  where (category_filter is null or p.category=category_filter) and (
    strpos(lower(p.title||' '||p.body),lower(left(search_text,80)))>0
    or exists(select 1 from public.club_translation_sources t where t.post_id=p.id and t.status='ready'
      and strpos(lower((t.translations->target_locale)::text),lower(left(search_text,80)))>0)
    or exists(select 1 from public.community_comments c where c.post_id=p.id and (
      strpos(lower(c.body),lower(left(search_text,80)))>0 or exists(
        select 1 from public.club_translation_sources t where t.comment_id=c.id and t.status='ready'
        and strpos(lower((t.translations->target_locale)::text),lower(left(search_text,80)))>0)))
  ) order by p.created_at desc,p.id desc limit 301;
$$;
revoke all on function public.search_club_posts(text,text,text) from public,anon;
grant execute on function public.search_club_posts(text,text,text) to authenticated;

create table public.club_translation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.club_translation_sources(id) on delete cascade,
  revision bigint not null,
  locale text not null check(locale in ('pt-BR','en','es')),
  reason text not null check(length(reason) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique(user_id,source_id,revision,locale)
);
alter table public.club_translation_feedback enable row level security;
revoke all on public.club_translation_feedback from anon, authenticated;
grant select,insert on public.club_translation_feedback to authenticated;
grant all on public.club_translation_feedback to service_role;
create policy translation_feedback_owner_read on public.club_translation_feedback for select to authenticated using(user_id=(select auth.uid()));
create policy translation_feedback_owner_insert on public.club_translation_feedback for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.club_translation_sources s where s.id=club_translation_feedback.source_id and s.revision=club_translation_feedback.revision));
