-- Test fixtures and simulated payment never persist.
begin;
insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at)
values('11111111-1717-4717-8717-111111111111','pro-check@example.invalid','authenticated','authenticated',now(),now(),now()),
('22222222-1717-4717-8717-222222222222','other-check@example.invalid','authenticated','authenticated',now(),now(),now());
insert into public.account_profiles(user_id,full_name) values('11111111-1717-4717-8717-111111111111','Pro test'),('22222222-1717-4717-8717-222222222222','Other test') on conflict(user_id) do nothing;
update public.community_members set club_access_status='active',club_pro_status='inactive' where user_id in ('11111111-1717-4717-8717-111111111111','22222222-1717-4717-8717-222222222222');
select set_config('request.jwt.claim.sub','11111111-1717-4717-8717-111111111111',true);
set local role authenticated;
do $$ begin
  assert not has_function_privilege('authenticated','public.approve_club_pro_order(uuid,uuid)','execute'),'Members cannot approve payments';
  assert not has_function_privilege('authenticated','public.reserve_club_agent_turn(uuid,text)','execute'),'Clients cannot bypass agent API';
  assert not has_table_privilege('authenticated','public.club_pro_orders','insert'),'Members cannot forge price or order status';
  assert not has_table_privilege('authenticated','public.club_agent_usage','update'),'Members cannot reset usage';
end $$;
reset role;
insert into public.club_pro_orders(id,user_id,price_cents,period_months,status,receipt_path)
values('33333333-1717-4717-8717-333333333333','11111111-1717-4717-8717-111111111111',9900,1,'submitted','test-only.pdf');
set local role service_role;
select public.approve_club_pro_order('33333333-1717-4717-8717-333333333333','11111111-1717-4717-8717-111111111111');
do $$ declare denied boolean:=false; first_expiry timestamptz; begin
  select club_pro_expires_at into first_expiry from public.community_members where user_id='11111111-1717-4717-8717-111111111111';
  assert first_expiry>now()+interval '27 days','Approval must activate the paid period';
  begin perform public.approve_club_pro_order('33333333-1717-4717-8717-333333333333','11111111-1717-4717-8717-111111111111');exception when others then denied:=true;end;
  assert denied,'A receipt cannot activate twice';
  assert (select club_pro_expires_at=first_expiry from public.community_members where user_id='11111111-1717-4717-8717-111111111111'),'Duplicate approval cannot extend access';
end $$;
do $$ declare id uuid; denied boolean:=false; i integer; begin
  begin perform public.reserve_club_agent_turn('22222222-1717-4717-8717-222222222222','Test question');exception when others then denied:=true;end;
  assert denied,'Free accounts cannot reserve AI requests';
  id:=public.reserve_club_agent_turn('11111111-1717-4717-8717-111111111111','My private question');
  denied:=false;
  begin perform public.reserve_club_agent_turn('11111111-1717-4717-8717-111111111111','Parallel question');exception when others then denied:=true;end;
  assert denied,'Concurrent requests must be blocked';
  perform public.finish_club_agent_turn(id,null,'[]',true);
  assert (select used=0 from public.club_agent_usage where user_id='11111111-1717-4717-8717-111111111111'),'Failed responses should refund quota';
  for i in 1..30 loop
    id:=public.reserve_club_agent_turn('11111111-1717-4717-8717-111111111111','Private question');
    perform public.finish_club_agent_turn(id,'Private response','[]',false);
  end loop;
  denied:=false;
  begin perform public.reserve_club_agent_turn('11111111-1717-4717-8717-111111111111','Question above limit');exception when others then denied:=true;end;
  assert denied,'Daily allowance must be enforced';
end $$;
reset role;
select set_config('request.jwt.claim.sub','22222222-1717-4717-8717-222222222222',true);
set local role authenticated;
do $$ begin
  assert (select count(*)=0 from public.club_agent_turns),'Private conversations must be isolated';
  assert (select count(*)=0 from public.club_pro_orders),'Payment records must be isolated';
  assert (select count(*)=0 from public.club_agent_usage),'Usage must be isolated';
end $$;
reset role;
delete from public.club_agent_turns where user_id='11111111-1717-4717-8717-111111111111';
do $$ begin
  assert (select used=30 from public.club_agent_usage where user_id='11111111-1717-4717-8717-111111111111'),'Deleting history must not reset quota';
end $$;
select 'Pro approval, idempotency, isolation, concurrency and quotas passed' as result;
rollback;
