begin;
select set_config('test.member',(select user_id::text from public.community_members where club_access_status in ('active','complimentary') limit 1),true);
select set_config('test.other',(select user_id::text from public.community_members where user_id<>current_setting('test.member')::uuid limit 1),true);
update public.account_profiles set full_name='Teste Diretório Ágata',"current_role"='Gestora de contratos',organization_name='Empresa de teste',linkedin_url='https://www.linkedin.com/in/directory-test',public_bio='Contexto profissional de teste com experiência em operações.',areas_of_expertise=array['Operações jurídicas'],directory_country='BR',directory_region='São Paulo',directory_city='Campinas',directory_qualifications=array['Gestão de projetos'],professional_type='legal_dept',base_cv_text='private-cv-sentinel' where user_id=current_setting('test.member')::uuid;
update public.community_members set profile_verification_status='unverified' where user_id=current_setting('test.member')::uuid;
select set_config('test.entitlements',(select jsonb_build_array(club_access_status,club_pro_status)::text from public.community_members where user_id=current_setting('test.member')::uuid),true);
set local role anon;
do $$ begin
  begin perform public.search_club_members('{}'); raise exception 'anonymous directory allowed'; exception when insufficient_privilege then null; end;
  begin perform id from public.club_profile_reviews; raise exception 'anonymous reviews exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.member'),true);
set local role authenticated;
do $$ declare data jsonb; request_id uuid; again uuid; begin
  data:=public.search_club_members('{"q":"agata operacoes","country":"BR","region":"sao paulo","city":"Campinas","qualification":"gestao de projetos","type":"legal_dept"}');
  if (data->>'total')::int<>1 then raise exception 'accent insensitive combined search failed: %',data; end if;
  if data->'members'->0 ? 'base_cv_text' then raise exception 'private CV exposed'; end if;
  if (public.search_club_members('{"q":"private-cv-sentinel"}')->>'total')::int<>0 then raise exception 'private CV searched'; end if;
  if (public.search_club_members('{"q":"agata","region":"Madrid"}')->>'total')::int<>0 then raise exception 'filter ignored'; end if;
  if (public.search_club_members('{"q":"%"}')->>'total')::int<>0 then raise exception 'wildcard interpreted'; end if;
  if jsonb_array_length(public.search_club_members('{"q":"agata","page":2}')->'members')<>0 then raise exception 'pagination ignored'; end if;
  request_id:=public.request_club_profile_review(); again:=public.request_club_profile_review();
  if request_id<>again then raise exception 'duplicate pending requests'; end if;
  perform set_config('test.request',request_id::text,true);
  if not exists(select 1 from public.club_profile_reviews where id=request_id and status='pending') then raise exception 'owner request missing'; end if;
  if (select profile_verification_status from public.community_members where user_id=auth.uid())<>'pending' then raise exception 'pending badge missing'; end if;
  begin perform public.review_club_profile(request_id,auth.uid(),'verified','Self approval must fail'); raise exception 'self approval allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.other'),true);
set local role authenticated;
do $$ begin if exists(select 1 from public.club_profile_reviews where id=current_setting('test.request')::uuid) then raise exception 'review note exposed to other member'; end if; end $$;
reset role;
select public.review_club_profile(current_setting('test.request')::uuid,current_setting('test.other')::uuid,'verified','Conferência sintética para teste transacional.');
do $$ begin
  if (select profile_verification_status from public.community_members where user_id=current_setting('test.member')::uuid)<>'verified' then raise exception 'approval missing'; end if;
  if (select jsonb_build_array(club_access_status,club_pro_status)::text from public.community_members where user_id=current_setting('test.member')::uuid)<>current_setting('test.entitlements') then raise exception 'review changed entitlements'; end if;
  begin perform public.review_club_profile(current_setting('test.request')::uuid,current_setting('test.other')::uuid,'rejected','Duplicate decision must fail'); raise exception 'duplicate review accepted'; exception when others then if sqlerrm<>'ALREADY_REVIEWED' then raise; end if; end;
end $$;
-- Editing verified identity removes the seal; changing optional region does not.
update public.account_profiles set directory_city='Santos' where user_id=current_setting('test.member')::uuid;
do $$ begin if (select profile_verification_status from public.community_members where user_id=current_setting('test.member')::uuid)<>'verified' then raise exception 'non identity change revoked approval'; end if; end $$;
update public.account_profiles set full_name='Teste Diretório Nova Identidade' where user_id=current_setting('test.member')::uuid;
do $$ begin if (select profile_verification_status from public.community_members where user_id=current_setting('test.member')::uuid)<>'unverified' then raise exception 'identity change retained approval'; end if; end $$;
select set_config('request.jwt.claim.sub',current_setting('test.member'),true);
set local role authenticated;
select set_config('test.request2',public.request_club_profile_review()::text,true);
reset role;
update public.account_profiles set "current_role"='Novo cargo profissional' where user_id=current_setting('test.member')::uuid;
do $$ begin
 if (select status from public.club_profile_reviews where id=current_setting('test.request2')::uuid)<>'superseded' then raise exception 'changed pending snapshot retained'; end if;
 begin perform public.review_club_profile(current_setting('test.request2')::uuid,current_setting('test.other')::uuid,'verified','Stale snapshot must fail'); raise exception 'stale approved'; exception when others then if sqlerrm<>'ALREADY_REVIEWED' then raise; end if; end;
end $$;

set local role authenticated;
select set_config('test.request3',public.request_club_profile_review()::text,true);
reset role;
select public.review_club_profile(current_setting('test.request3')::uuid,current_setting('test.other')::uuid,'rejected','Atualize o contexto informado para a nova conferência.');
set local role authenticated;
select set_config('test.request4',public.request_club_profile_review()::text,true);
do $$ begin
 if current_setting('test.request3')=current_setting('test.request4') then raise exception 'resubmission did not preserve history'; end if;
 begin update public.community_members set profile_verification_status='verified' where user_id=auth.uid(); raise exception 'direct self verification allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.community_members set club_access_status='inactive' where user_id=current_setting('test.member')::uuid;
set local role authenticated;
do $$ begin
 begin perform public.search_club_members('{}'); raise exception 'inactive directory access'; exception when others then if sqlerrm<>'MEMBERSHIP_REQUIRED' then raise; end if; end;
 begin perform public.request_club_profile_review(); raise exception 'inactive request'; exception when others then if sqlerrm<>'MEMBERSHIP_REQUIRED' then raise; end if; end;
end $$;
reset role;
select 'Directory search, filters, privacy, review workflow and stale identity checks passed' as result;
rollback;
