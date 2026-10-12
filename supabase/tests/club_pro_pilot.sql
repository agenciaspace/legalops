-- Operators run simulated subscriptions inside a transaction that rolls back.
begin;
insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at)
values('11111111-1818-4818-8818-111111111111','pilot-check@example.invalid','authenticated','authenticated',now(),now(),now()),
('22222222-1818-4818-8818-222222222222','pilot-other@example.invalid','authenticated','authenticated',now(),now(),now());
insert into public.account_profiles(user_id,full_name) values('11111111-1818-4818-8818-111111111111','Pilot test'),('22222222-1818-4818-8818-222222222222','Other test') on conflict(user_id) do nothing;
update public.community_members set club_access_status='active',club_access_expires_at=null,club_pro_status='inactive',club_pro_expires_at=null where user_id in ('11111111-1818-4818-8818-111111111111','22222222-1818-4818-8818-222222222222');
insert into public.club_pro_orders(id,user_id,price_cents,period_months,status,receipt_path,payment_mode,payment_url,trial_days)
values('33333333-1818-4818-8818-333333333333','11111111-1818-4818-8818-111111111111',4900,1,'submitted','test.pdf','mercadopago_subscription','https://mpago.la/2gCAVGU',7);
set local role authenticated;
do $$ begin
  assert not has_function_privilege('authenticated','public.approve_club_pro_subscription_order(uuid,uuid,text,timestamptz,boolean,text)','execute'),'Members cannot activate subscriptions';
  assert not has_function_privilege('anon','public.record_club_pro_subscription_payment(uuid,uuid,text,timestamptz)','execute'),'Visitors cannot forge recurring payments';
  assert not has_function_privilege('authenticated','public.claim_club_pro_notices(integer)','execute'),'Members cannot claim email deliveries';
  assert not has_function_privilege('authenticated','public.record_club_pro_refund(uuid,uuid,text)','execute'),'Members cannot record refunds';
  assert not has_table_privilege('authenticated','public.club_pro_subscriptions','update'),'Members cannot change billing records';
  assert not has_table_privilege('authenticated','public.club_pro_pilot','select'),'Members cannot read private conversion metrics';
end $$;
reset role;
set local role service_role;
do $$ declare denied boolean:=false; expiry timestamptz; paid_id uuid; begin
  begin perform public.approve_club_pro_order('33333333-1818-4818-8818-333333333333','11111111-1818-4818-8818-111111111111');exception when others then denied:=true;end;
  assert denied,'PIX approval cannot grant a subscription month or trial';
  expiry:=public.approve_club_pro_subscription_order('33333333-1818-4818-8818-333333333333','11111111-1818-4818-8818-111111111111','11111111111111111111111111111111',now()+interval '6 days',true,null);
  assert expiry=now()+interval '6 days','Trial uses the verified provider date';
  assert (select club_pro_expires_at=expiry from public.community_members where user_id='11111111-1818-4818-8818-111111111111'),'Trial enables Pro';
  denied:=false;
  begin perform public.approve_club_pro_subscription_order('33333333-1818-4818-8818-333333333333','11111111-1818-4818-8818-111111111111','11111111111111111111111111111111',now()+interval '6 days',true,null);exception when others then denied:=true;end;
  assert denied,'Operators cannot approve the same order twice';
  paid_id:=public.record_club_pro_subscription_payment('11111111-1818-4818-8818-111111111111','11111111-1818-4818-8818-111111111111','987654321012',now()+interval '30 days');
  denied:=false;
  begin perform public.record_club_pro_subscription_payment('11111111-1818-4818-8818-111111111111','11111111-1818-4818-8818-111111111111','987654321012',now()+interval '31 days');exception when unique_violation then denied:=true;end;
  assert denied,'One provider payment cannot fund two periods';
  assert (select club_pro_expires_at=now()+interval '30 days' from public.community_members where user_id='11111111-1818-4818-8818-111111111111'),'Duplicate payments leave expiry unchanged';
  perform public.record_club_pro_refund(paid_id,'11111111-1818-4818-8818-111111111111','Provider refund verified, subscription canceled');
  assert (select club_access_status='active' and club_pro_expires_at=now()+interval '6 days' from public.community_members where user_id='11111111-1818-4818-8818-111111111111'),'Refund preserves community and the previous valid period';
  assert (select state='canceled' from public.club_pro_subscriptions where user_id='11111111-1818-4818-8818-111111111111'),'Refund stops subscription notices';
end $$;
insert into public.club_pro_orders(id,user_id,price_cents,period_months,status,receipt_path,payment_mode,payment_url,trial_days)
values('44444444-1818-4818-8818-444444444444','11111111-1818-4818-8818-111111111111',4900,1,'submitted','test.pdf','mercadopago_subscription','https://mpago.la/2gCAVGU',7);
do $$ declare denied boolean:=false; begin
  begin perform public.approve_club_pro_subscription_order('44444444-1818-4818-8818-444444444444','11111111-1818-4818-8818-111111111111','22222222222222222222222222222222',now()+interval '6 days',true,null);exception when others then denied:=true;end;
  assert denied,'Canceling does not allow another free trial';
end $$;
reset role;
select set_config('request.jwt.claim.sub','22222222-1818-4818-8818-222222222222',true);
set local role authenticated;
do $$ begin
  assert (select count(*)=0 from public.club_pro_subscriptions),'Members cannot read another subscription';
  assert (select count(*)=0 from public.club_pro_orders),'Members cannot read another payment';
end $$;
reset role;
select 'Pilot trial, payments, refunds and authorization passed' as result;
rollback;
