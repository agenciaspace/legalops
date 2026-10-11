-- Recover abandoned requests after the maximum execution window, without touching completed usage.
create function public.recover_club_credits(member_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare tx record;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  for tx in select id from public.club_credit_transactions where user_id=member_id and status='pending' and created_at<now()-interval '5 minutes' for update loop
    perform public.finish_club_credits(tx.id,true);
    update public.club_agent_turns set status='failed',answer=null,sources='[]' where credit_transaction_id=tx.id and status='pending';
  end loop;
end $$;
revoke all on function public.recover_club_credits(uuid) from public,anon,authenticated;
grant execute on function public.recover_club_credits(uuid) to service_role;

create or replace function public.reserve_club_credits(member_id uuid,action_name text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare settings public.club_credit_settings; price integer; used_count integer; balance integer;
  period_start date; included_count integer; paid_count integer; funding_source text; reservation_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  perform public.recover_club_credits(member_id);
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
