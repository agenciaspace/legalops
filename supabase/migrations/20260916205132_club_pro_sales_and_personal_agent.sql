create table public.club_pro_offer (
  id boolean primary key default true check(id),
  price_cents integer check(price_cents between 100 and 10000000),
  period_months integer check(period_months in (1,12)),
  active boolean not null default false,
  check(not active or (price_cents is not null and period_months is not null))
);
insert into public.club_pro_offer(id) values(true);
alter table public.club_pro_offer enable row level security;
revoke all on public.club_pro_offer from anon, authenticated;
grant select on public.club_pro_offer to anon, authenticated;
grant all on public.club_pro_offer to service_role;
create policy pro_offer_read on public.club_pro_offer for select to anon, authenticated using(true);

create table public.club_pro_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  price_cents integer not null check(price_cents>0),
  period_months integer not null check(period_months in (1,12)),
  status text not null default 'pending' check(status in ('pending','submitted','approved','rejected','canceled')),
  receipt_path text,
  review_note text check(length(review_note)<=1000),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  access_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index club_pro_orders_user_created on public.club_pro_orders(user_id,created_at desc);
create unique index club_pro_orders_one_pending on public.club_pro_orders(user_id) where status in ('pending','submitted');
alter table public.club_pro_orders enable row level security;
revoke all on public.club_pro_orders from anon,authenticated;
grant select on public.club_pro_orders to authenticated;
grant all on public.club_pro_orders to service_role;
create policy pro_orders_owner_read on public.club_pro_orders for select to authenticated using(user_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('club-pro-receipts','club-pro-receipts',false,5242880,array['application/pdf','image/png','image/jpeg']);
-- Receipt uploads/download URLs are issued only by authenticated server actions.
-- No anonymous or client-side object policy is granted for this private bucket.

create or replace function public.approve_club_pro_order(order_id uuid, operator_id uuid)
returns timestamptz language plpgsql security invoker set search_path='' as $$
declare purchase public.club_pro_orders; expires_at timestamptz;
begin
  select * into purchase from public.club_pro_orders where id=order_id for update;
  if not found or purchase.status<>'submitted' or purchase.receipt_path is null then
    raise exception 'ORDER_NOT_SUBMITTED';
  end if;
  perform 1 from public.community_members where user_id=purchase.user_id
    and club_access_status in ('active','complimentary')
    and (club_access_expires_at is null or club_access_expires_at>now()) for update;
  if not found then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  select greatest(now(),coalesce(club_pro_expires_at,now())) + make_interval(months=>purchase.period_months)
    into expires_at from public.community_members where user_id=purchase.user_id;
  update public.community_members set club_pro_status='active',club_pro_expires_at=expires_at,updated_at=now()
    where user_id=purchase.user_id;
  update public.club_pro_orders set status='approved',reviewed_by=operator_id,reviewed_at=now(),access_expires_at=expires_at where id=order_id;
  return expires_at;
end $$;
revoke all on function public.approve_club_pro_order(uuid,uuid) from public,anon,authenticated;
grant execute on function public.approve_club_pro_order(uuid,uuid) to service_role;

create table public.club_agent_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  focus text not null default '' check(length(focus)<=2000),
  topics text[] not null default '{}' check(cardinality(topics)<=12),
  updated_at timestamptz not null default now()
);
alter table public.club_agent_preferences enable row level security;
revoke all on public.club_agent_preferences from anon,authenticated;
grant select,insert,update on public.club_agent_preferences to authenticated;
grant all on public.club_agent_preferences to service_role;
create policy agent_preferences_owner_read on public.club_agent_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy agent_preferences_owner_insert on public.club_agent_preferences for insert to authenticated with check(user_id=(select auth.uid()) and private.has_club_pro_access());
create policy agent_preferences_owner_update on public.club_agent_preferences for update to authenticated using(user_id=(select auth.uid()) and private.has_club_pro_access()) with check(user_id=(select auth.uid()) and private.has_club_pro_access());

create table public.club_agent_turns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check(length(question) between 3 and 2000),
  answer text check(length(answer)<=16000),
  sources jsonb not null default '[]' check(jsonb_typeof(sources)='array'),
  status text not null default 'pending' check(status in ('pending','completed','failed')),
  created_at timestamptz not null default now()
);
create index club_agent_turns_owner_time on public.club_agent_turns(user_id,created_at desc);
alter table public.club_agent_turns enable row level security;
revoke all on public.club_agent_turns from anon,authenticated;
grant select on public.club_agent_turns to authenticated;
grant all on public.club_agent_turns to service_role;
create policy agent_turns_owner_read on public.club_agent_turns for select to authenticated using(user_id=(select auth.uid()));

create table public.club_agent_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  used integer not null default 0 check(used between 0 and 30),
  primary key(user_id,day)
);
alter table public.club_agent_usage enable row level security;
revoke all on public.club_agent_usage from anon,authenticated;
grant select on public.club_agent_usage to authenticated;
grant all on public.club_agent_usage to service_role;
create policy agent_usage_owner_read on public.club_agent_usage for select to authenticated using(user_id=(select auth.uid()));

create or replace function public.reserve_club_agent_turn(member_id uuid, question_text text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare turn_id uuid; used_count integer; today date := (now() at time zone 'UTC')::date;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  if length(btrim(question_text)) not between 3 and 2000 then raise exception 'INVALID_QUESTION'; end if;
  if not exists(select 1 from public.community_members where user_id=member_id
    and club_access_status in ('active','complimentary') and (club_access_expires_at is null or club_access_expires_at>now())
    and club_pro_status in ('active','complimentary') and (club_pro_expires_at is null or club_pro_expires_at>now()))
    then raise exception 'PRO_REQUIRED'; end if;
  if exists(select 1 from public.club_agent_turns where user_id=member_id and status='pending' and created_at>now()-interval '2 minutes')
    then raise exception 'QUESTION_IN_PROGRESS'; end if;
  insert into public.club_agent_usage(user_id,day,used) values(member_id,today,0) on conflict do nothing;
  update public.club_agent_usage set used=used+1 where user_id=member_id and day=today and used<30 returning used into used_count;
  if not found then raise exception 'DAILY_LIMIT'; end if;
  insert into public.club_agent_turns(user_id,question) values(member_id,btrim(question_text)) returning id into turn_id;
  return turn_id;
end $$;
revoke all on function public.reserve_club_agent_turn(uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_club_agent_turn(uuid,text) to service_role;

create or replace function public.finish_club_agent_turn(turn_id uuid, answer_text text, source_links jsonb, failed boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare turn public.club_agent_turns;
begin
  select * into turn from public.club_agent_turns where id=turn_id for update;
  if not found or turn.status<>'pending' then return; end if;
  update public.club_agent_turns set status=case when failed then 'failed' else 'completed' end,
    answer=case when failed then null else answer_text end,sources=case when failed then '[]'::jsonb else source_links end where id=turn_id;
  if failed then update public.club_agent_usage set used=greatest(0,used-1)
    where user_id=turn.user_id and day=(turn.created_at at time zone 'UTC')::date; end if;
end $$;
revoke all on function public.finish_club_agent_turn(uuid,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.finish_club_agent_turn(uuid,text,jsonb,boolean) to service_role;
