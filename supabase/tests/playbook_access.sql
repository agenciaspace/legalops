begin;
-- Use transaction-local identities; no records or published content survive rollback.
select set_config('test.member', (select user_id::text from public.community_members where club_access_status in ('active','complimentary') and user_id not in (select user_id from public.contract_map_leads) limit 1), true);
select set_config('test.lead', (select user_id::text from public.contract_map_leads limit 1), true);
set local role anon;
do $$ begin
  if (select count(*) from public.contract_map_sections where journey='open-playbook') <> 5 then raise exception 'public sections missing'; end if;
  begin perform id from public.contract_map_contributions; raise exception 'private proposals exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.member'),true);
set local role authenticated;
do $$ declare v int; c jsonb; proposal_id uuid; begin
  if auth.uid() is null then raise exception 'member fixture missing'; end if;
  select version,content into v,c from public.contract_map_sections where id='playbook-posicoes';
  proposal_id := public.contract_map_contribute('playbook-posicoes','suggestion','Transactional verification',v,c,true);
  perform set_config('test.proposal',proposal_id::text,true);
  begin perform public.contract_map_publish('playbook-posicoes',v,c,'Must reject'); raise exception 'member published'; exception when others then if sqlerrm <> 'LEAD_REQUIRED' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.lead'),true);
set local role authenticated;
do $$ declare v int; c jsonb; begin
  select version,content into v,c from public.contract_map_sections where id='playbook-posicoes';
  perform public.contract_map_publish('playbook-posicoes',v,c,'Transaction test',current_setting('test.proposal')::uuid);
  if not exists(select 1 from public.contract_map_revisions where section_id='playbook-posicoes' and version=v+1) then raise exception 'revision missing'; end if;
  if not exists(select 1 from public.contract_map_contributions where id=current_setting('test.proposal')::uuid and status='accepted') then raise exception 'acceptance missing'; end if;
  begin perform public.contract_map_publish('playbook-posicoes',v,c,'Stale test'); raise exception 'stale publication accepted'; exception when others then if sqlerrm <> 'VERSION_CONFLICT' then raise; end if; end;
end $$;
reset role;
select 'Playbook public/private, member/lead, history and conflict checks passed' as result;
rollback;
