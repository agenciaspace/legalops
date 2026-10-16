-- Rollback-only fixtures exercise the actual database roles, RLS, quotas and leases.
begin;
select set_config('chat_test.owner',gen_random_uuid()::text,true),set_config('chat_test.member',gen_random_uuid()::text,true),set_config('chat_test.other',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at) values
 (current_setting('chat_test.owner')::uuid,current_setting('chat_test.owner')||'@chat-test.invalid',now()),
 (current_setting('chat_test.member')::uuid,current_setting('chat_test.member')||'@chat-test.invalid',now()),
 (current_setting('chat_test.other')::uuid,current_setting('chat_test.other')||'@chat-test.invalid',now());
set local role service_role;
select set_config('chat_test.workspace',public.chat_provision(current_setting('chat_test.owner')::uuid,'{"name":"QA firm","kind":"firm","professional_role":"Partner","team_size":"2-10","goals":"Contracts"}')::text,true);
select set_config('chat_test.foreign_workspace',public.chat_provision(current_setting('chat_test.other')::uuid,'{"name":"QA department","kind":"department","professional_role":"Manager","team_size":"2-10","goals":"Contracts"}')::text,true);
insert into public.chat_members(workspace_id,user_id,role) values(current_setting('chat_test.workspace')::uuid,current_setting('chat_test.member')::uuid,'member');
insert into public.chat_matters(workspace_id,created_by,title,brief,visibility) values
 (current_setting('chat_test.workspace')::uuid,current_setting('chat_test.owner')::uuid,'Private matter','A private fixture with contractual context.','private');
select set_config('chat_test.private_matter',id::text,true) from public.chat_matters where workspace_id=current_setting('chat_test.workspace')::uuid;
insert into public.chat_matters(workspace_id,created_by,title,brief,visibility) values
 (current_setting('chat_test.workspace')::uuid,current_setting('chat_test.owner')::uuid,'Shared matter','A shared fixture with contractual context.','workspace');
select set_config('chat_test.shared_matter',id::text,true) from public.chat_matters where workspace_id=current_setting('chat_test.workspace')::uuid and visibility='workspace';
insert into public.chat_matters(workspace_id,created_by,title,brief,visibility) values
 (current_setting('chat_test.foreign_workspace')::uuid,current_setting('chat_test.other')::uuid,'Other matter','An unrelated confidential contractual context.','private');
insert into public.chat_documents(workspace_id,matter_id,created_by,name,kind,content,mime,sha256) values
 (current_setting('chat_test.workspace')::uuid,null,current_setting('chat_test.owner')::uuid,'Organization policy','policy','Shared policy text available to authorized organization members.','text/plain','policy'),
 (current_setting('chat_test.workspace')::uuid,current_setting('chat_test.private_matter')::uuid,current_setting('chat_test.owner')::uuid,'Private contract','contract','Confidential private contract text for the owner only.','text/plain','private'),
 (current_setting('chat_test.workspace')::uuid,current_setting('chat_test.shared_matter')::uuid,current_setting('chat_test.owner')::uuid,'Shared contract','contract','Shared contract text available to authorized members.','text/plain','shared'),
 (current_setting('chat_test.foreign_workspace')::uuid,null,current_setting('chat_test.other')::uuid,'Other policy','policy','Unrelated organization confidential policy document.','text/plain','other');
select set_config('chat_test.contract',id::text,true) from public.chat_documents where matter_id=current_setting('chat_test.shared_matter')::uuid;
select set_config('chat_test.private_contract',id::text,true) from public.chat_documents where matter_id=current_setting('chat_test.private_matter')::uuid;
select set_config('chat_test.other_document',id::text,true) from public.chat_documents where workspace_id=current_setting('chat_test.foreign_workspace')::uuid;
reset role;
set local role anon;
do $$ declare t text; begin
 foreach t in array array['chat_workspaces','chat_members','chat_agents','chat_matters','chat_messages','chat_documents','chat_runs','chat_steps','chat_decisions','chat_memories','chat_invitations'] loop
 assert not has_table_privilege(current_user,'public.'||t,'select,insert,update,delete'),'Anonymous table access';
 end loop;
 assert not has_function_privilege(current_user,'public.chat_claim_step(uuid)','execute'),'Anonymous queue access';
 assert not exists(select 1 from storage.objects where bucket_id='chat-documents'),'Anonymous storage access';
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('chat_test.owner'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 assert (select count(*)=1 from public.chat_workspaces),'Workspace isolation';
 assert (select count(*)=4 from public.chat_agents),'Agent provisioning';
 assert (select count(*)=2 from public.chat_matters),'Owner matter access';
 assert (select count(*)=3 from public.chat_documents),'Owner document isolation';
 assert not has_table_privilege(current_user,'public.chat_members','insert,update,delete'),'Membership escalation';
 assert not has_function_privilege(current_user,'public.chat_provision(uuid,jsonb)','execute'),'Client can spoof provisioning actor';
 assert not has_function_privilege(current_user,'public.chat_finish_step(uuid,uuid,jsonb,text,jsonb)','execute'),'Client can forge agent output';
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('chat_test.member'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 assert (select count(*)=1 from public.chat_workspaces),'Member workspace access';
 assert (select count(*)=1 from public.chat_matters),'Private matter leaked to teammate';
 assert (select count(*)=2 from public.chat_documents),'Private or foreign document leaked';
 assert not chat_private.owner_of(current_setting('chat_test.workspace')::uuid),'Member gained owner role';
 assert not exists(select 1 from public.chat_invitations),'Member can read invitations';
end $$;
reset role;
set local role service_role;
do $$ declare blocked boolean:=false; begin
 begin perform public.chat_start_run(current_setting('chat_test.member')::uuid,current_setting('chat_test.private_matter')::uuid,array[current_setting('chat_test.private_contract')::uuid]); exception when others then blocked:=sqlerrm like '%forbidden%';end;
 assert blocked,'Member can execute private matter';blocked:=false;
 begin perform public.chat_start_run(current_setting('chat_test.owner')::uuid,current_setting('chat_test.shared_matter')::uuid,array[current_setting('chat_test.other_document')::uuid]); exception when others then blocked:=sqlerrm like '%invalid_sources%';end;
 assert blocked,'Foreign source accepted';
end $$;
select set_config('chat_test.run',public.chat_start_run(current_setting('chat_test.owner')::uuid,current_setting('chat_test.shared_matter')::uuid,array[current_setting('chat_test.contract')::uuid])::text,true);
do $$ declare s public.chat_steps; next_s public.chat_steps; old_token uuid;blocked boolean:=false; begin
 begin perform public.chat_start_run(current_setting('chat_test.owner')::uuid,current_setting('chat_test.shared_matter')::uuid,array[current_setting('chat_test.contract')::uuid]); exception when unique_violation then blocked:=true;end;
 assert blocked,'Duplicate active analysis allowed';
 select * into s from public.chat_claim_step(current_setting('chat_test.run')::uuid);
 assert s.ordinal=0 and s.attempts=1,'Wrong initial step';old_token:=s.lease_token;
 assert not public.chat_finish_step(s.id,gen_random_uuid(),'{}',null,'{}'),'Forged fencing token committed';
 assert not exists(select 1 from public.chat_claim_step(current_setting('chat_test.run')::uuid)),'Concurrent dependent step started';
 update public.chat_steps set lease_until=now()-interval '1 second' where id=s.id;
 select * into next_s from public.chat_claim_step(current_setting('chat_test.run')::uuid);
 assert next_s.id=s.id and next_s.lease_token<>old_token,'Expired step not reclaimed';
 assert not public.chat_finish_step(s.id,old_token,'{}',null,'{}'),'Expired worker committed';
 assert public.chat_finish_step(next_s.id,next_s.lease_token,'{}',null,'{}'),'Valid step could not commit';
 for n in 1..3 loop
 select * into s from public.chat_claim_step(current_setting('chat_test.run')::uuid);
 assert s.ordinal=n,'Step dependency order failed';
 assert public.chat_finish_step(s.id,s.lease_token,'{}',null,'{}'),'Step commit failed';
 end loop;
 assert (select status='review' from public.chat_runs where id=current_setting('chat_test.run')::uuid),'Run skipped human review';
 assert not exists(select 1 from public.chat_decisions where run_id=current_setting('chat_test.run')::uuid),'Model created a human decision';
 blocked:=false;
 begin perform public.chat_record_decision(current_setting('chat_test.member')::uuid,current_setting('chat_test.run')::uuid,'approved','Member cannot create a shared rule',true);exception when others then blocked:=sqlerrm like '%owner_required%';end;
 assert blocked,'Member promoted a case decision to organization memory';
 perform public.chat_record_decision(current_setting('chat_test.owner')::uuid,current_setting('chat_test.run')::uuid,'approved','Explicitly approved organization guidance.',true);
 assert (select count(*)=1 from public.chat_memories where workspace_id=current_setting('chat_test.workspace')::uuid),'Approved guidance missing';
 blocked:=false;
 begin perform public.chat_record_decision(current_setting('chat_test.owner')::uuid,current_setting('chat_test.run')::uuid,'approved','Duplicate decision must be rejected',false);exception when others then blocked:=sqlerrm like '%not_in_review%';end;
 assert blocked,'Decision could be submitted twice';
end $$;
-- Invitations are bound to a confirmed email; a link alone does not grant access.
insert into public.chat_invitations(workspace_id,email,token_hash,invited_by) values(current_setting('chat_test.workspace')::uuid,current_setting('chat_test.other')||'@chat-test.invalid','fixture-token',current_setting('chat_test.owner')::uuid);
do $$ declare blocked boolean:=false; begin
 begin perform public.chat_accept_invitation(current_setting('chat_test.member')::uuid,current_setting('chat_test.member')||'@chat-test.invalid','fixture-token');exception when others then blocked:=sqlerrm like '%invalid_invitation%';end;
 assert blocked,'Wrong email accepted an invitation';
 perform public.chat_accept_invitation(current_setting('chat_test.other')::uuid,current_setting('chat_test.other')||'@chat-test.invalid','fixture-token');
 assert exists(select 1 from public.chat_members where workspace_id=current_setting('chat_test.workspace')::uuid and user_id=current_setting('chat_test.other')::uuid and role='member'),'Valid invitation failed';
end $$;
reset role;
select 'Chat: organization isolation, private matters, grants, sources, ordered leases, fencing, human decisions and invitations passed' as result;
rollback;
