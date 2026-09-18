-- Transactional fixtures: no users, messages, preferences or usage persist.
begin;
insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at)
values('11111111-1818-4818-8818-111111111111','threads-one@example.invalid','authenticated','authenticated',now(),now(),now()),
('22222222-1818-4818-8818-222222222222','threads-two@example.invalid','authenticated','authenticated',now(),now(),now());
insert into public.account_profiles(user_id,full_name) values('11111111-1818-4818-8818-111111111111','Thread test'),('22222222-1818-4818-8818-222222222222','Other thread test') on conflict(user_id) do nothing;
update public.community_members set club_access_status='active',club_pro_status='active'
where user_id in ('11111111-1818-4818-8818-111111111111','22222222-1818-4818-8818-222222222222');
insert into public.club_agent_conversations(id,user_id) values
('33333333-1818-4818-8818-333333333333','11111111-1818-4818-8818-111111111111'),
('44444444-1818-4818-8818-444444444444','11111111-1818-4818-8818-111111111111'),
('55555555-1818-4818-8818-555555555555','22222222-1818-4818-8818-222222222222');
set local role service_role;
do $$ declare r jsonb; blocked boolean:=false; begin
  begin perform public.reserve_club_agent_conversation_turn('11111111-1818-4818-8818-111111111111','Foreign conversation','55555555-1818-4818-8818-555555555555');
  exception when others then blocked:=sqlerrm like '%CONVERSATION_NOT_FOUND%'; end;
  assert blocked,'Cannot reserve a turn in another user conversation';
  r:=public.reserve_club_agent_conversation_turn('11111111-1818-4818-8818-111111111111','First thread question','33333333-1818-4818-8818-333333333333');
  assert (r->>'conversation_id')::uuid='33333333-1818-4818-8818-333333333333','Reservation must bind the chosen conversation';
  blocked:=false;
  begin perform public.delete_club_agent_conversation('11111111-1818-4818-8818-111111111111','33333333-1818-4818-8818-333333333333');
  exception when others then blocked:=sqlerrm like '%QUESTION_IN_PROGRESS%'; end;
  assert blocked,'Deletion must not race with an in-flight answer';
  perform public.finish_club_agent_turn((r->>'turn_id')::uuid,'First thread answer','[]',false);
  r:=public.reserve_club_agent_conversation_turn('11111111-1818-4818-8818-111111111111','Second thread question','44444444-1818-4818-8818-444444444444');
  perform public.finish_club_agent_turn((r->>'turn_id')::uuid,'Second thread answer','[]',false);
  assert (select title='Second thread question' from public.club_agent_conversations where id='44444444-1818-4818-8818-444444444444'),'First question names its conversation';
  assert not public.delete_club_agent_conversation('11111111-1818-4818-8818-111111111111','55555555-1818-4818-8818-555555555555'),'Cannot delete a foreign conversation';
  assert public.delete_club_agent_conversation('11111111-1818-4818-8818-111111111111','33333333-1818-4818-8818-333333333333'),'Own conversation deleted';
  assert not exists(select 1 from public.club_agent_turns where conversation_id='33333333-1818-4818-8818-333333333333'),'Deleted conversation messages must disappear';
  assert (select count(*)=1 from public.club_agent_turns where conversation_id='44444444-1818-4818-8818-444444444444'),'Other conversation must remain';
  assert (select used=2 from public.club_agent_usage where user_id='11111111-1818-4818-8818-111111111111'),'Deleting a conversation cannot reset daily quota';
  blocked:=false;
  begin insert into public.club_agent_turns(user_id,conversation_id,question) values('11111111-1818-4818-8818-111111111111','55555555-1818-4818-8818-555555555555','Forged foreign key');
  exception when foreign_key_violation then blocked:=true;end;
  assert blocked,'Database foreign key must prevent cross-owner links';
end $$;
reset role;
select set_config('request.jwt.claim.sub','11111111-1818-4818-8818-111111111111',true);
set local role authenticated;
do $$ begin
  assert (select count(*)=1 from public.club_agent_conversations),'RLS returns only the remaining own conversation';
  assert not has_table_privilege('authenticated','public.club_agent_conversations','insert'),'Client writes cannot bypass the Pro API';
  assert not has_function_privilege('authenticated','public.delete_club_agent_conversation(uuid,uuid)','execute'),'Clients cannot forge member_id';
  assert not has_function_privilege('anon','public.reserve_club_agent_conversation_turn(uuid,text,uuid)','execute'),'Anonymous users cannot reserve questions';
  assert not has_table_privilege('anon','public.club_agent_conversations','select'),'Anonymous users cannot read conversations';
end $$;
reset role;
select 'Conversation ownership, history isolation, deletion, quota and RLS passed' as result;
rollback;
