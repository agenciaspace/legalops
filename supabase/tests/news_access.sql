-- Rollback-only assertions against the actual public/authenticated grants and RLS.
begin;
select set_config('news_test.owner',gen_random_uuid()::text,true), set_config('news_test.other',gen_random_uuid()::text,true);
insert into auth.users(id,email) values
  (current_setting('news_test.owner')::uuid,current_setting('news_test.owner') || '@news-test.invalid'),
  (current_setting('news_test.other')::uuid,current_setting('news_test.other') || '@news-test.invalid');
insert into public.community_members(user_id,club_access_status) values
  (current_setting('news_test.owner')::uuid,'active'),(current_setting('news_test.other')::uuid,'active')
on conflict(user_id) do update set club_access_status='active';
insert into public.news_preferences(user_id,enabled) values
  (current_setting('news_test.owner')::uuid,true),(current_setting('news_test.other')::uuid,true);
insert into public.news_articles(slug,title,summary,body,audiences,topics,sources,status,published_at) values
 ('news-rls-draft-fixture','Private draft fixture','This draft must never be visible publicly.',repeat('Private text. ',10),array['escritorios'],array['governanca'],'[{"title":"Fixture","url":"https://example.com/source"}]','draft',null),
 ('news-rls-future-fixture','Future story fixture','This future story must not be visible yet.',repeat('Future text. ',10),array['escritorios'],array['governanca'],'[{"title":"Fixture","url":"https://example.com/source"}]','published',now()+interval '1 day');
set local role anon;
do $$ begin
 if exists(select 1 from public.news_articles where slug in ('news-rls-draft-fixture','news-rls-future-fixture')) then raise exception 'Draft or future article leaked'; end if;
 if has_table_privilege(current_user,'public.news_articles','insert,update,delete') then raise exception 'Anonymous article writes allowed'; end if;
 if has_table_privilege(current_user,'public.news_email_signups','select,insert,update,delete') then raise exception 'Anonymous signup access allowed'; end if;
 if has_table_privilege(current_user,'public.news_candidates','select') then raise exception 'Candidate leaked'; end if;
 if has_function_privilege(current_user,'public.claim_news_signups()','execute') then raise exception 'Anonymous queue claim allowed'; end if;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('news_test.owner'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.news_preferences) <> 1 then raise exception 'Preferences owner isolation failed'; end if;
 if exists(select 1 from public.news_preferences where user_id <> auth.uid()) then raise exception 'Other owner preferences leaked'; end if;
 update public.news_preferences set enabled=false where user_id=auth.uid();
 if not found then raise exception 'Owner cannot disable preference'; end if;
 if has_table_privilege(current_user,'public.news_email_signups','select') then raise exception 'Members can read email list'; end if;
end $$;
reset role;
-- Keep the reassignment target valid but without a conflicting preference key,
-- so only RLS (rather than uniqueness or an FK) can reject the reassignment.
delete from public.news_preferences where user_id=current_setting('news_test.other')::uuid;
set local role authenticated;
do $$ begin
 begin
  update public.news_preferences set user_id=current_setting('news_test.other')::uuid where user_id=auth.uid();
  raise exception 'Owner can reassign preferences';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
update public.community_members set club_access_status='inactive' where user_id=current_setting('news_test.owner')::uuid;
set local role authenticated;
do $$ begin
 begin
  update public.news_preferences set enabled=true where user_id=auth.uid();
  raise exception 'Inactive member can enable delivery';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
set local role service_role;
select public.register_news_signup('newsletter-fixture@example.invalid',array['escritorios'],array['governanca'],repeat('a',64),'news');
select public.register_news_signup('newsletter-fixture@example.invalid',array['escritorios'],array['governanca'],repeat('a',64),'news');
do $$ begin
 if (select count(*) from public.news_email_signups where email='newsletter-fixture@example.invalid') <> 1 then raise exception 'Duplicate signup created'; end if;
 if exists(select 1 from public.news_preferences where user_id=current_setting('news_test.other')::uuid and enabled=false) then raise exception 'Signup changed Club preferences'; end if;
end $$;
reset role;
rollback;
