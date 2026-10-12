-- Leon approved R$49/month and selected the supplied recurring plan with a seven-day trial.
alter table public.club_pro_offer
  add column payment_mode text not null default 'pix' check(payment_mode in ('pix','mercadopago_subscription')),
  add column payment_url text check(payment_url is null or payment_url ~ '^https://mpago[.]la/[A-Za-z0-9]+$'),
  add column trial_days integer not null default 0 check(trial_days in (0,7));
alter table public.club_pro_offer add constraint pro_subscription_offer_complete
  check(payment_mode<>'mercadopago_subscription' or (payment_url is not null and period_months=1));

alter table public.club_pro_orders
  add column payment_mode text not null default 'pix' check(payment_mode in ('pix','mercadopago_subscription')),
  add column payment_url text,
  add column trial_days integer not null default 0 check(trial_days in (0,7)),
  add column grant_kind text check(grant_kind in ('trial','paid')),
  add column provider_subscription_id text check(provider_subscription_id ~ '^[a-f0-9]{32}$'),
  add column provider_payment_id text check(provider_payment_id ~ '^[0-9]{1,32}$'),
  add column refunded_at timestamptz;
create unique index club_pro_order_payment_once on public.club_pro_orders(provider_payment_id) where provider_payment_id is not null;
create unique index club_pro_trial_once on public.club_pro_orders(user_id) where grant_kind='trial' and status='approved';

create table public.club_pro_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_subscription_id text not null unique check(provider_subscription_id ~ '^[a-f0-9]{32}$'),
  price_cents integer not null check(price_cents>0),
  state text not null check(state in ('trial','active','canceled')),
  next_charge_at timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table public.club_pro_subscriptions enable row level security;
revoke all on public.club_pro_subscriptions from public,anon,authenticated;
grant select on public.club_pro_subscriptions to authenticated;
grant all on public.club_pro_subscriptions to service_role;
create policy pro_subscription_owner_read on public.club_pro_subscriptions for select to authenticated using(user_id=(select auth.uid()));

create table public.club_pro_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('activation','renewal')),
  access_expires_at timestamptz not null,
  status text not null default 'pending' check(status in ('pending','sending','sent','failed','skipped')),
  claimed_at timestamptz, sent_at timestamptz, message_id text,
  unique(user_id,kind,access_expires_at)
);
alter table public.club_pro_notices enable row level security;
revoke all on public.club_pro_notices from public,anon,authenticated;
grant all on public.club_pro_notices to service_role;

create function public.approve_club_pro_subscription_order(order_id uuid,operator_id uuid,subscription_id text,cycle_expires_at timestamptz,is_trial boolean,payment_id text default null)
returns timestamptz language plpgsql security invoker set search_path='' as $$
declare purchase public.club_pro_orders; member public.community_members;
begin
  select * into purchase from public.club_pro_orders where id=order_id for update;
  if not found or purchase.status<>'submitted' or purchase.receipt_path is null or purchase.payment_mode<>'mercadopago_subscription' then raise exception 'ORDER_NOT_SUBMITTED'; end if;
  select * into member from public.community_members where user_id=purchase.user_id for update;
  if not found or member.club_access_status not in ('active','complimentary') or member.club_access_expires_at<=now() then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  if subscription_id !~ '^[a-f0-9]{32}$' or cycle_expires_at is null or cycle_expires_at<=now() then raise exception 'INVALID_SUBSCRIPTION'; end if;
  if is_trial then
    if purchase.trial_days<>7 or cycle_expires_at>now()+interval '7 days' or exists(select 1 from public.club_pro_orders where user_id=purchase.user_id and grant_kind='trial' and status='approved') then raise exception 'TRIAL_UNAVAILABLE'; end if;
    if payment_id is not null then raise exception 'INVALID_TRIAL'; end if;
  elsif payment_id is null or payment_id !~ '^[0-9]{1,32}$' or cycle_expires_at>now()+interval '35 days' then raise exception 'INVALID_PAID_CYCLE'; end if;
  if exists(select 1 from public.club_pro_subscriptions where user_id=purchase.user_id and state<>'canceled' and provider_subscription_id<>subscription_id) then raise exception 'SUBSCRIPTION_MISMATCH'; end if;
  insert into public.club_pro_subscriptions(user_id,provider_subscription_id,price_cents,state,next_charge_at)
    values(purchase.user_id,subscription_id,purchase.price_cents,case when is_trial then 'trial' else 'active' end,cycle_expires_at)
    on conflict(user_id) do update set provider_subscription_id=excluded.provider_subscription_id,price_cents=excluded.price_cents,state=excluded.state,next_charge_at=excluded.next_charge_at,updated_at=now();
  if not (member.club_pro_status='complimentary' and member.club_pro_expires_at is null) then
    update public.community_members set club_pro_status='active',club_pro_expires_at=greatest(cycle_expires_at,member.club_pro_expires_at),updated_at=now() where user_id=purchase.user_id;
  end if;
  update public.club_pro_orders set status='approved',grant_kind=case when is_trial then 'trial' else 'paid' end,
    provider_subscription_id=subscription_id,provider_payment_id=payment_id,reviewed_by=operator_id,reviewed_at=now(),access_expires_at=cycle_expires_at where id=order_id;
  insert into public.club_pro_notices(user_id,kind,access_expires_at) values(purchase.user_id,'activation',cycle_expires_at) on conflict do nothing;
  return cycle_expires_at;
end $$;

create function public.record_club_pro_subscription_payment(member_id uuid,operator_id uuid,payment_id text,cycle_expires_at timestamptz)
returns uuid language plpgsql security invoker set search_path='' as $$
declare subscription public.club_pro_subscriptions; member public.community_members; purchase_id uuid;
begin
  select * into member from public.community_members where user_id=member_id for update;
  if not found or member.club_access_status not in ('active','complimentary') or member.club_access_expires_at<=now() then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  select * into subscription from public.club_pro_subscriptions where user_id=member_id for update;
  if not found or subscription.state='canceled' then raise exception 'SUBSCRIPTION_REQUIRED'; end if;
  if payment_id is null or payment_id !~ '^[0-9]{1,32}$' or cycle_expires_at is null or cycle_expires_at<=now() or cycle_expires_at>now()+interval '35 days' or cycle_expires_at<=subscription.next_charge_at then raise exception 'INVALID_PAID_CYCLE'; end if;
  insert into public.club_pro_orders(user_id,price_cents,period_months,status,payment_mode,grant_kind,provider_subscription_id,provider_payment_id,reviewed_by,reviewed_at,access_expires_at)
    values(member_id,subscription.price_cents,1,'approved','mercadopago_subscription','paid',subscription.provider_subscription_id,payment_id,operator_id,now(),cycle_expires_at) returning id into purchase_id;
  if not (member.club_pro_status='complimentary' and member.club_pro_expires_at is null) then
    update public.community_members set club_pro_status='active',club_pro_expires_at=greatest(cycle_expires_at,member.club_pro_expires_at),updated_at=now() where user_id=member_id;
  end if;
  update public.club_pro_subscriptions set state='active',next_charge_at=cycle_expires_at,updated_at=now() where user_id=member_id;
  insert into public.club_pro_notices(user_id,kind,access_expires_at) values(member_id,'activation',cycle_expires_at) on conflict do nothing;
  return purchase_id;
end $$;

create function public.claim_club_pro_notices(batch_size integer default 10)
returns setof public.club_pro_notices language plpgsql security invoker set search_path='' as $$
begin
  -- Operators inspect ambiguous deliveries before retrying, including transport timeouts.
  update public.club_pro_notices set status='failed' where status='sending' and claimed_at<now()-interval '10 minutes';
  insert into public.club_pro_notices(user_id,kind,access_expires_at)
    select s.user_id,'renewal',s.next_charge_at from public.club_pro_subscriptions s
    join public.community_members m on m.user_id=s.user_id
    where s.state in ('trial','active') and s.next_charge_at>now() and s.next_charge_at<=now()+interval '3 days'
    and m.club_access_status in ('active','complimentary') and (m.club_access_expires_at is null or m.club_access_expires_at>now())
    on conflict do nothing;
  return query with candidates as (select n.id from public.club_pro_notices n where n.status='pending' order by n.access_expires_at for update skip locked limit least(greatest(batch_size,1),10))
    update public.club_pro_notices n set status='sending',claimed_at=now() from candidates c where n.id=c.id returning n.*;
end $$;

create function public.record_club_pro_refund(order_id uuid,operator_id uuid,reason text)
returns void language plpgsql security invoker set search_path='' as $$
declare purchase public.club_pro_orders; member public.community_members; previous_expiry timestamptz;
begin
  select * into purchase from public.club_pro_orders where id=order_id for update;
  if not found or purchase.status<>'approved' or purchase.grant_kind is distinct from 'paid' or purchase.refunded_at is not null or reason is null or length(btrim(reason)) not between 10 and 1000 then raise exception 'INVALID_REFUND'; end if;
  select * into member from public.community_members where user_id=purchase.user_id for update;
  update public.club_pro_orders set refunded_at=now(),review_note=btrim(reason),reviewed_by=operator_id where id=order_id;
  if member.club_pro_expires_at=purchase.access_expires_at then
    select max(access_expires_at) into previous_expiry from public.club_pro_orders where user_id=purchase.user_id and status='approved' and refunded_at is null;
    update public.community_members set club_pro_expires_at=greatest(now(),previous_expiry),updated_at=now() where user_id=purchase.user_id;
  end if;
  update public.club_pro_subscriptions set state='canceled',updated_at=now() where user_id=purchase.user_id;
end $$;
revoke all on function public.approve_club_pro_subscription_order(uuid,uuid,text,timestamptz,boolean,text),public.record_club_pro_subscription_payment(uuid,uuid,text,timestamptz),public.claim_club_pro_notices(integer),public.record_club_pro_refund(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.approve_club_pro_subscription_order(uuid,uuid,text,timestamptz,boolean,text),public.record_club_pro_subscription_payment(uuid,uuid,text,timestamptz),public.claim_club_pro_notices(integer),public.record_club_pro_refund(uuid,uuid,text) to service_role;

alter table public.club_credit_transactions
  add column provider_model text,
  add column provider_cost_usd numeric check(provider_cost_usd>=0),
  add column input_tokens integer check(input_tokens>=0),
  add column output_tokens integer check(output_tokens>=0);

create table public.club_pro_pilot (
  id boolean primary key default true check(id),
  invited integer not null default 0 check(invited between 0 and 100000),
  demonstrations integer not null default 0 check(demonstrations between 0 and invited),
  updated_at timestamptz not null default now()
);
insert into public.club_pro_pilot(id) values(true);
alter table public.club_pro_pilot enable row level security;
revoke all on public.club_pro_pilot from public,anon,authenticated;
grant all on public.club_pro_pilot to service_role;
create function public.club_pro_pilot_metrics()
returns jsonb language sql security invoker set search_path='' as $$
  select jsonb_build_object(
    'invited',(select invited from public.club_pro_pilot where id=true),
    'demonstrations',(select demonstrations from public.club_pro_pilot where id=true),
    'trial_members',(select count(distinct user_id) from public.club_pro_orders where status='approved' and grant_kind='trial'),
    'paid_members',(select count(distinct user_id) from public.club_pro_orders where status='approved' and grant_kind='paid' and refunded_at is null),
    'paid_cents',(select coalesce(sum(price_cents),0) from public.club_pro_orders where status='approved' and grant_kind='paid' and refunded_at is null),
    'renewing_members',(select count(*) from (select user_id from public.club_pro_orders where status='approved' and grant_kind='paid' and refunded_at is null group by user_id having count(*)>1) r),
    'first_task_members',(select count(distinct t.user_id) from public.club_credit_transactions t join (select user_id,min(reviewed_at) first_activation from public.club_pro_orders where status='approved' and payment_mode='mercadopago_subscription' group by user_id) s on s.user_id=t.user_id where t.status='completed' and t.action<>'purchase' and t.created_at>=s.first_activation),
    'week_one_members',(select count(distinct t.user_id) from public.club_credit_transactions t join (select user_id,min(reviewed_at) first_activation from public.club_pro_orders where status='approved' and payment_mode='mercadopago_subscription' group by user_id) s on s.user_id=t.user_id where t.status='completed' and t.action<>'purchase' and t.created_at>=s.first_activation and t.created_at<s.first_activation+interval '7 days'),
    'month_cost_usd',(select coalesce(sum(provider_cost_usd),0) from public.club_credit_transactions where funding='club' and created_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'),
    'month_unmeasured',(select count(*) from public.club_credit_transactions where funding='club' and status='completed' and provider_cost_usd is null and created_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC')
  );
$$;
revoke all on function public.club_pro_pilot_metrics() from public,anon,authenticated;
grant execute on function public.club_pro_pilot_metrics() to service_role;

-- Open sales after deploying the checkout that understands this payment mode.
update public.club_pro_offer set price_cents=4900,period_months=1,payment_mode='mercadopago_subscription',payment_url='https://mpago.la/2gCAVGU',trial_days=7,active=false where id=true;
