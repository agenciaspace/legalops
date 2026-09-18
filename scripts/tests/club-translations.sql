begin;
select set_config('test.club_user',gen_random_uuid()::text,true),set_config('test.club_post',gen_random_uuid()::text,true),set_config('test.club_public',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values(current_setting('test.club_user')::uuid,'authenticated','authenticated','translation-transaction-test@resend.dev',now(),'{}','{}',now(),now());
update public.community_members set club_access_status='active',club_pro_status='inactive' where user_id=current_setting('test.club_user')::uuid;
insert into public.community_posts(id,author_id,title,body,visibility) values
(current_setting('test.club_post')::uuid,current_setting('test.club_user')::uuid,'Prueba privada','Texto privado 22/09','members'),
(current_setting('test.club_public')::uuid,current_setting('test.club_user')::uuid,'Prueba pública','Texto público','public');
set local role anon;
select set_config('test.anon_private',count(*)::text,true) from public.club_translation_sources where post_id=current_setting('test.club_post')::uuid;
select set_config('test.anon_public',count(*)::text,true) from public.club_translation_sources where post_id=current_setting('test.club_public')::uuid;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.club_user'),true);
set local role authenticated;
select set_config('test.member_private',count(*)::text,true) from public.club_translation_sources where post_id=current_setting('test.club_post')::uuid;
reset role;
update public.community_members set club_access_status='inactive' where user_id=current_setting('test.club_user')::uuid;
set local role authenticated;
select set_config('test.revoked_private',count(*)::text,true) from public.club_translation_sources where post_id=current_setting('test.club_post')::uuid;
reset role;
update public.community_members set club_access_status='active' where user_id=current_setting('test.club_user')::uuid;
update public.club_translation_sources set status='ready',translations='{"en":{"title":"Private test","body":"Confidential translated 22/09"}}',detected_locale='es' where post_id=current_setting('test.club_post')::uuid;
set local role authenticated;
select set_config('test.search_translation',count(*)::text,true) from public.search_club_posts('Confidential translated','en') where id=current_setting('test.club_post')::uuid;
reset role;
update public.community_posts set title='Prueba editada' where id=current_setting('test.club_post')::uuid;
select set_config('test.edit_invalidates',(count(*)=1)::text,true) from public.club_translation_sources where post_id=current_setting('test.club_post')::uuid and revision=2 and translations='{}' and status='pending';
update public.club_translation_sources set next_attempt_at=now()+interval '1 day';
update public.club_translation_sources set next_attempt_at=now() where post_id in(current_setting('test.club_post')::uuid,current_setting('test.club_public')::uuid);
update public.club_translation_config set generation_enabled=true,daily_budget_usd=0.10;
select set_config('test.budget_first',count(*)::text,true) from public.claim_club_translations(3);
select set_config('test.budget_second',count(*)::text,true) from public.claim_club_translations(3);
select set_config('test.leased_post',post_id::text,true),set_config('test.lease',lease_token::text,true),set_config('test.revision',revision::text,true) from public.club_translation_sources where status='processing' and post_id in(current_setting('test.club_post')::uuid,current_setting('test.club_public')::uuid);
update public.community_posts set body='Otra revisión' where id=current_setting('test.leased_post')::uuid;
with applied as(update public.club_translation_sources set translations='{"en":{"body":"STALE"}}',status='ready' where post_id=current_setting('test.leased_post')::uuid and revision=current_setting('test.revision')::bigint and lease_token=current_setting('test.lease')::uuid returning id) select set_config('test.stale_applied',count(*)::text,true) from applied;
delete from public.community_posts where id=current_setting('test.club_post')::uuid;
select set_config('test.deleted_cache',count(*)::text,true) from public.club_translation_sources where post_id=current_setting('test.club_post')::uuid;
select jsonb_build_object('anon_private',current_setting('test.anon_private'),'anon_public',current_setting('test.anon_public'),'member_private',current_setting('test.member_private'),'revoked_private',current_setting('test.revoked_private'),'translated_search',current_setting('test.search_translation'),'edit_invalidates',current_setting('test.edit_invalidates'),'budget_first',current_setting('test.budget_first'),'budget_second',current_setting('test.budget_second'),'stale_applied',current_setting('test.stale_applied'),'deleted_cache',current_setting('test.deleted_cache')) as results;
rollback;
