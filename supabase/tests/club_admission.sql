-- Run against a migrated database; all fixtures are rolled back.
begin;
insert into auth.users (id,email,aud,role,email_confirmed_at,created_at,updated_at)
values ('11111111-1616-4616-8616-111111111111','club-test@example.invalid','authenticated','authenticated',now(),now(),now());
update public.account_profiles
set avatar_path='11111111-1616-4616-8616-111111111111/22222222-2222-4222-8222-222222222222.jpg'
where user_id='11111111-1616-4616-8616-111111111111';
select set_config('request.jwt.claim.sub','11111111-1616-4616-8616-111111111111',true);
set local role authenticated;
do $$
declare
  profile jsonb := '{"full_name":"Teste Comunidade","current_role":"Legal Ops","organization_name":"Teste","city":"São Paulo","public_bio":"Trabalho com operações jurídicas e contratos.","linkedin_url":"https://www.linkedin.com/in/club-test","sector":"legal_ops","interests":["Contratos / CLM"],"accepted_rules":true,"club_pro_status":"active","club_plan":"founder199"}';
  denied boolean := false;
begin
  begin
    perform public.join_club(profile || '{"linkedin_url":"https://example.com/in/fake"}');
  exception when others then denied := true; end;
  assert denied, 'Invalid LinkedIn must be rejected';
  perform public.join_club(profile);
  assert private.has_active_club_access(), 'Community admission failed';
  assert not private.has_club_pro_access(), 'Admission must not grant Pro';
  assert exists(select 1 from public.community_members where user_id=auth.uid() and club_plan='free' and club_pro_status='inactive' and profile_verification_status='verified'), 'Admission must automatically mark a complete profile';
  assert not has_column_privilege('authenticated','public.community_members','club_pro_status','UPDATE'), 'Pro must not be user writable';
  assert not has_function_privilege('anon','public.join_club(jsonb)','EXECUTE'), 'Anonymous admission must be blocked';
end;
$$;
reset role;
update public.community_members set club_pro_status='active',club_pro_expires_at=now()-interval '1 day' where user_id='11111111-1616-4616-8616-111111111111';
set local role authenticated;
do $$ begin
  assert private.has_active_club_access(), 'Expired Pro must preserve membership';
  assert not private.has_club_pro_access(), 'Expired Pro must be blocked';
end $$;
reset role;
update auth.users set email_confirmed_at=null where id='11111111-1616-4616-8616-111111111111';
set local role authenticated;
do $$ declare denied boolean := false; begin
  begin perform public.join_club('{}'); exception when others then denied := true; end;
  assert denied, 'Unconfirmed email must be blocked';
end $$;
reset role;
update public.account_profiles set linkedin_url='https://www.linkedin.com/in/changed' where user_id='11111111-1616-4616-8616-111111111111';
do $$ begin
  assert exists(select 1 from public.community_members where user_id='11111111-1616-4616-8616-111111111111' and profile_verification_status='verified'), 'Complete profile edits must stay automatically verified';
end $$;
select 'All admission, entitlement and automatic completeness assertions passed' as result;
rollback;
