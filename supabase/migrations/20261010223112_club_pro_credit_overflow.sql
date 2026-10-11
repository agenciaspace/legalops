-- Shared Pro wallet. Prices remain closed until explicitly configured by an admin.
create table public.club_credit_settings (
  id boolean primary key default true check(id),
  allowance integer not null default 30 check(allowance between 0 and 1000000),
  period text not null default 'day' check(period in ('day','month')),
  pack_credits integer check(pack_credits between 1 and 1000000),
  pack_price_cents integer check(pack_price_cents between 100 and 10000000),
  sales_active boolean not null default false,
  check(not sales_active or (pack_credits is not null and pack_price_cents is not null))
);
insert into public.club_credit_settings(id) values(true);
create table public.club_credit_costs (
  action text primary key check(action in ('agent_question','agent_summary','personalized_cv','cover_letter','interview_prep','linkedin_insights')),
  credits integer not null check(credits between 1 and 1000000)
);
-- Preserve one unit per generation until the administrator changes individual costs.
insert into public.club_credit_costs values ('agent_question',1),('agent_summary',1),('personalized_cv',1),('cover_letter',1),('interview_prep',1),('linkedin_insights',1);
create table public.club_credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  purchased integer not null default 0 check(purchased>=0)
);
create table public.club_credit_periods (
  user_id uuid references auth.users(id) on delete cascade,
  period text not null check(period in ('day','month')),
  starts_on date not null,
  used integer not null default 0 check(used>=0),
  primary key(user_id,period,starts_on)
);
-- Existing usage remains spent when the shared wallet is introduced.
insert into public.club_credit_periods(user_id,period,starts_on,used)
select user_id,'day',day,used from public.club_agent_usage;
create table public.club_credit_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credits integer not null check(credits>0), price_cents integer not null check(price_cents>0),
  status text not null default 'pending' check(status in ('pending','submitted','approved','rejected','canceled')),
  receipt_path text, review_note text check(length(review_note)<=1000),
  reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index club_credit_orders_one_pending on public.club_credit_orders(user_id) where status in ('pending','submitted');
create table public.club_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check(action in ('agent_question','agent_summary','personalized_cv','cover_letter','interview_prep','linkedin_insights','purchase')),
  status text not null default 'pending' check(status in ('pending','completed','failed')),
  funding text not null check(funding in ('club','api','purchase')),
  included integer not null default 0 check(included>=0),
  purchased integer not null default 0 check(purchased>=0),
  cost integer not null check(cost>0),
  period text check(period in ('day','month')), starts_on date,
  order_id uuid unique references public.club_credit_orders(id),
  created_at timestamptz not null default now(), completed_at timestamptz
);
create index club_credit_transactions_owner_time on public.club_credit_transactions(user_id,created_at desc);
create index club_credit_transactions_pending on public.club_credit_transactions(user_id) where status='pending';
alter table public.club_agent_turns add column credit_transaction_id uuid unique references public.club_credit_transactions(id);

-- Only service-role code can reserve, settle, sell or change prices.
do $$ declare t text; begin
  foreach t in array array['club_credit_settings','club_credit_costs','club_credit_wallets','club_credit_periods','club_credit_orders','club_credit_transactions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    if t in ('club_credit_settings','club_credit_costs') then
      execute format('create policy credit_catalog_read on public.%I for select to authenticated using(true)',t);
    else
      execute format('create policy credit_owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
    end if;
  end loop;
end $$;

create function public.reserve_club_credits(member_id uuid,action_name text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare settings public.club_credit_settings; price integer; used_count integer; balance integer;
  period_start date; included_count integer; paid_count integer; funding_source text; reservation_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  if not exists(select 1 from public.community_members where user_id=member_id
    and club_access_status in ('active','complimentary') and (club_access_expires_at is null or club_access_expires_at>now())
    and club_pro_status in ('active','complimentary') and (club_pro_expires_at is null or club_pro_expires_at>now())) then raise exception 'PRO_REQUIRED'; end if;
  select * into strict settings from public.club_credit_settings where id;
  select credits into price from public.club_credit_costs where action=action_name;
  if price is null then raise exception 'INVALID_ACTION'; end if;
  if exists(select 1 from public.club_credit_transactions where user_id=member_id and status='pending' and created_at>now()-interval '2 minutes')
    or exists(select 1 from public.club_agent_turns where user_id=member_id and status='pending' and created_at>now()-interval '2 minutes')
    then raise exception 'QUESTION_IN_PROGRESS'; end if;
  period_start := case when settings.period='month' then date_trunc('month',now() at time zone 'UTC')::date else (now() at time zone 'UTC')::date end;
  insert into public.club_credit_wallets(user_id) values(member_id) on conflict do nothing;
  insert into public.club_credit_periods(user_id,period,starts_on) values(member_id,settings.period,period_start) on conflict do nothing;
  select purchased into balance from public.club_credit_wallets where user_id=member_id for update;
  select used into used_count from public.club_credit_periods where user_id=member_id and period=settings.period and starts_on=period_start for update;
  included_count := least(price,greatest(0,settings.allowance-used_count));
  paid_count := price-included_count;
  if balance>=paid_count then
    funding_source:='club';
    update public.club_credit_periods set used=used+included_count where user_id=member_id and period=settings.period and starts_on=period_start;
    update public.club_credit_wallets set purchased=purchased-paid_count where user_id=member_id;
  elsif exists(select 1 from public.club_member_api_keys where user_id=member_id) then
    funding_source:='api';included_count:=0;paid_count:=0;
  else raise exception 'INSUFFICIENT_CREDITS'; end if;
  insert into public.club_credit_transactions(user_id,action,funding,included,purchased,cost,period,starts_on)
    values(member_id,action_name,funding_source,included_count,paid_count,price,settings.period,period_start) returning id into reservation_id;
  return jsonb_build_object('id',reservation_id,'funding',funding_source,'cost',price);
end $$;

create function public.finish_club_credits(transaction_id uuid,failed boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare tx public.club_credit_transactions;
begin
  select * into tx from public.club_credit_transactions where id=transaction_id;
  if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended(tx.user_id::text,0));
  select * into tx from public.club_credit_transactions where id=transaction_id for update;
  if tx.status<>'pending' then return; end if;
  if failed and tx.funding='club' then
    update public.club_credit_periods set used=greatest(0,used-tx.included) where user_id=tx.user_id and period=tx.period and starts_on=tx.starts_on;
    update public.club_credit_wallets set purchased=purchased+tx.purchased where user_id=tx.user_id;
  end if;
  update public.club_credit_transactions set status=case when failed then 'failed' else 'completed' end,completed_at=now() where id=transaction_id;
end $$;

create function public.reserve_club_credit_agent_turn(member_id uuid,question_text text,conversation_uuid uuid default null,action_name text default 'agent_question')
returns jsonb language plpgsql security invoker set search_path='' as $$
declare reservation jsonb; turn_id uuid; selected_conversation uuid:=conversation_uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  if question_text is null or length(btrim(question_text)) not between 3 and 2000 then raise exception 'INVALID_QUESTION'; end if;
  if action_name not in ('agent_question','agent_summary') then raise exception 'INVALID_ACTION'; end if;
  if selected_conversation is not null and not exists(select 1 from public.club_agent_conversations where id=selected_conversation and user_id=member_id) then raise exception 'CONVERSATION_NOT_FOUND'; end if;
  reservation:=public.reserve_club_credits(member_id,action_name);
  if selected_conversation is null then
    insert into public.club_agent_conversations(user_id,title) values(member_id,left(btrim(question_text),80)) returning id into selected_conversation;
  else
    update public.club_agent_conversations set updated_at=now(),title=case when not exists(select 1 from public.club_agent_turns where conversation_id=selected_conversation) then left(btrim(question_text),80) else title end where id=selected_conversation and user_id=member_id;
  end if;
  insert into public.club_agent_turns(user_id,conversation_id,question,credit_transaction_id)
    values(member_id,selected_conversation,btrim(question_text),(reservation->>'id')::uuid) returning id into turn_id;
  return reservation || jsonb_build_object('turn_id',turn_id,'conversation_id',selected_conversation);
end $$;

create or replace function public.finish_club_agent_turn(turn_id uuid, answer_text text, source_links jsonb, failed boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare turn public.club_agent_turns;
begin
  select * into turn from public.club_agent_turns where id=turn_id;
  if not found then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(turn.user_id::text,0));
  select * into turn from public.club_agent_turns where id=turn_id for update;
  if turn.status<>'pending' then return; end if;
  update public.club_agent_turns set status=case when failed then 'failed' else 'completed' end,
    answer=case when failed then null else answer_text end,sources=case when failed then '[]'::jsonb else source_links end where id=turn_id;
  if turn.credit_transaction_id is not null then
    perform public.finish_club_credits(turn.credit_transaction_id,failed);
  elsif failed then
    update public.club_agent_usage set used=greatest(0,used-1) where user_id=turn.user_id and day=(turn.created_at at time zone 'UTC')::date;
  end if;
end $$;

create function public.create_club_credit_order(member_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare settings public.club_credit_settings; order_uuid uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  if not exists(select 1 from public.community_members where user_id=member_id
    and club_access_status in ('active','complimentary') and (club_access_expires_at is null or club_access_expires_at>now())
    and club_pro_status in ('active','complimentary') and (club_pro_expires_at is null or club_pro_expires_at>now())) then raise exception 'PRO_REQUIRED'; end if;
  select id into order_uuid from public.club_credit_orders where user_id=member_id and status in ('pending','submitted');
  if order_uuid is not null then return order_uuid; end if;
  select * into strict settings from public.club_credit_settings where id;
  if not settings.sales_active then raise exception 'SALES_CLOSED'; end if;
  insert into public.club_credit_orders(user_id,credits,price_cents) values(member_id,settings.pack_credits,settings.pack_price_cents) returning id into order_uuid;
  return order_uuid;
end $$;

create function public.approve_club_credit_order(order_id uuid,operator_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare purchase public.club_credit_orders;
begin
  select * into purchase from public.club_credit_orders where id=order_id;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended(purchase.user_id::text,0));
  select * into purchase from public.club_credit_orders where id=order_id for update;
  if purchase.status='approved' then return; end if;
  if purchase.status<>'submitted' or purchase.receipt_path is null then raise exception 'ORDER_NOT_SUBMITTED'; end if;
  insert into public.club_credit_wallets(user_id,purchased) values(purchase.user_id,purchase.credits)
    on conflict(user_id) do update set purchased=public.club_credit_wallets.purchased+excluded.purchased;
  insert into public.club_credit_transactions(user_id,action,status,funding,cost,purchased,order_id,completed_at)
    values(purchase.user_id,'purchase','completed','purchase',purchase.credits,purchase.credits,order_id,now());
  update public.club_credit_orders set status='approved',reviewed_by=operator_id,reviewed_at=now() where id=order_id;
end $$;

revoke all on function public.reserve_club_credits(uuid,text),public.finish_club_credits(uuid,boolean),public.reserve_club_credit_agent_turn(uuid,text,uuid,text),public.create_club_credit_order(uuid),public.approve_club_credit_order(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_club_credits(uuid,text),public.finish_club_credits(uuid,boolean),public.reserve_club_credit_agent_turn(uuid,text,uuid,text),public.create_club_credit_order(uuid),public.approve_club_credit_order(uuid,uuid) to service_role;

create function public.configure_club_credits(included_allowance integer,allowance_period text,pack_amount integer,pack_price integer,sales_enabled boolean,action_costs jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare item record;
begin
  if jsonb_typeof(action_costs)<>'object' or (select count(*) from jsonb_object_keys(action_costs))<>6 then raise exception 'INVALID_COSTS'; end if;
  for item in select action from public.club_credit_costs loop
    if not action_costs ? item.action or jsonb_typeof(action_costs->item.action)<>'number' or (action_costs->>item.action)!~'^[0-9]+$' then raise exception 'INVALID_COSTS'; end if;
    update public.club_credit_costs set credits=(action_costs->>item.action)::integer where action=item.action;
  end loop;
  update public.club_credit_settings set allowance=included_allowance,period=allowance_period,pack_credits=pack_amount,pack_price_cents=pack_price,sales_active=sales_enabled where id;
end $$;
revoke all on function public.configure_club_credits(integer,text,integer,integer,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.configure_club_credits(integer,text,integer,integer,boolean,jsonb) to service_role;
