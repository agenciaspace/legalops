-- Organization-scoped agent work. Browser roles can read authorized rows only;
-- writes and worker leases go through authenticated server handlers.
create table public.chat_workspaces (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null check(length(name) between 2 and 120), kind text not null check(kind in ('firm','department')),
 professional_role text not null check(length(professional_role) between 2 and 100),
 team_size text not null check(team_size in ('1','2-10','11-50','51+')),
 goals text not null default '' check(length(goals)<=3000), created_at timestamptz not null default now()
);
create table public.chat_members (
 workspace_id uuid not null references public.chat_workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','member')), created_at timestamptz not null default now(),
 primary key(workspace_id,user_id)
);
create index chat_members_user on public.chat_members(user_id);
create table public.chat_agents (
 workspace_id uuid not null references public.chat_workspaces(id) on delete cascade,
 key text not null check(key in ('intake','contracts','policies','coordinator')),
 name text not null, mission text not null, primary key(workspace_id,key)
);
create table public.chat_matters (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.chat_workspaces(id),
 created_by uuid not null references auth.users(id), title text not null check(length(title) between 3 and 160),
 brief text not null check(length(brief) between 10 and 6000),
 visibility text not null default 'private' check(visibility in ('private','workspace')),
 status text not null default 'draft' check(status in ('draft','running','review','completed','changes_requested')),
 created_at timestamptz not null default now(), unique(id,workspace_id)
);
create index chat_matters_workspace on public.chat_matters(workspace_id,created_at desc);
create table public.chat_messages (
 id uuid primary key default gen_random_uuid(), matter_id uuid not null references public.chat_matters(id),
 author_id uuid not null references auth.users(id), body text not null check(length(body) between 5 and 6000),
 created_at timestamptz not null default now()
);
create index chat_messages_matter on public.chat_messages(matter_id,created_at);
create table public.chat_documents (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.chat_workspaces(id),
 matter_id uuid, created_by uuid not null references auth.users(id), name text not null check(length(name) between 1 and 180),
 kind text not null check(kind in ('model','policy','reference','contract')),
 content text not null check(length(content) between 30 and 120000),
 storage_path text, mime text not null, sha256 text not null, created_at timestamptz not null default now(),
 foreign key(matter_id,workspace_id) references public.chat_matters(id,workspace_id),
 check((kind='contract' and matter_id is not null) or kind<>'contract'), unique(id,workspace_id)
);
create index chat_documents_workspace on public.chat_documents(workspace_id,matter_id);
create table public.chat_runs (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.chat_workspaces(id),
 matter_id uuid not null, started_by uuid not null references auth.users(id),
 status text not null default 'queued' check(status in ('queued','running','review','failed','completed','changes_requested')),
 source_ids uuid[] not null, context jsonb, error text,
 created_at timestamptz not null default now(), completed_at timestamptz,
 foreign key(matter_id,workspace_id) references public.chat_matters(id,workspace_id), unique(id,workspace_id)
);
create unique index chat_one_active_run on public.chat_runs(matter_id) where status in ('queued','running','review');
create index chat_runs_workspace on public.chat_runs(workspace_id,created_at desc);
create table public.chat_steps (
 id uuid primary key default gen_random_uuid(), run_id uuid not null references public.chat_runs(id) on delete cascade,
 ordinal int not null check(ordinal between 0 and 3), agent_key text not null,
 status text not null default 'queued' check(status in ('queued','running','completed','failed')),
 output jsonb, error text, attempts int not null default 0, lease_token uuid, lease_until timestamptz,
 model text, cost_usd numeric, input_tokens int, output_tokens int,
 started_at timestamptz, completed_at timestamptz, unique(run_id,ordinal)
);
create index chat_steps_queue on public.chat_steps(status,lease_until);
create table public.chat_decisions (
 id uuid primary key default gen_random_uuid(), run_id uuid not null unique references public.chat_runs(id),
 workspace_id uuid not null references public.chat_workspaces(id), decided_by uuid not null references auth.users(id),
 outcome text not null check(outcome in ('approved','changes_requested')), note text not null check(length(note) between 5 and 3000),
 created_at timestamptz not null default now()
);
create table public.chat_memories (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.chat_workspaces(id),
 decision_id uuid not null unique references public.chat_decisions(id), content text not null check(length(content) between 5 and 3000),
 approved_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create index chat_memories_workspace on public.chat_memories(workspace_id);
create table public.chat_invitations (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.chat_workspaces(id),
 email text not null, token_hash text not null unique, invited_by uuid not null references auth.users(id),
 expires_at timestamptz not null default now()+interval '7 days', accepted_at timestamptz,
 created_at timestamptz not null default now()
);
create index chat_invitations_workspace on public.chat_invitations(workspace_id);

-- Private helpers avoid membership-policy recursion. Only return caller-scoped access.
create schema if not exists chat_private;
revoke all on schema chat_private from public,anon;
grant usage on schema chat_private to authenticated,service_role;
create function chat_private.member_of(w uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.chat_members m where m.workspace_id=w and m.user_id=auth.uid());
$$;
create function chat_private.owner_of(w uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.chat_members m where m.workspace_id=w and m.user_id=auth.uid() and m.role='owner');
$$;
create function chat_private.can_read_matter(m uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.chat_matters t join public.chat_members u on u.workspace_id=t.workspace_id
 where t.id=m and u.user_id=auth.uid() and (t.created_by=auth.uid() or t.visibility='workspace'));
$$;
create function chat_private.can_read_run(r uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.chat_runs t where t.id=r and chat_private.can_read_matter(t.matter_id));
$$;
revoke all on all functions in schema chat_private from public,anon;
grant execute on all functions in schema chat_private to authenticated,service_role;

do $$ declare t text; begin
 foreach t in array array['chat_workspaces','chat_members','chat_agents','chat_matters','chat_messages','chat_documents','chat_runs','chat_steps','chat_decisions','chat_memories','chat_invitations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
create policy chat_workspaces_read on public.chat_workspaces for select to authenticated using(chat_private.member_of(id));
create policy chat_members_read on public.chat_members for select to authenticated using(chat_private.member_of(workspace_id));
create policy chat_agents_read on public.chat_agents for select to authenticated using(chat_private.member_of(workspace_id));
create policy chat_matters_read on public.chat_matters for select to authenticated using(chat_private.can_read_matter(id));
create policy chat_messages_read on public.chat_messages for select to authenticated using(chat_private.can_read_matter(matter_id));
create policy chat_documents_read on public.chat_documents for select to authenticated using(chat_private.member_of(workspace_id) and (matter_id is null or chat_private.can_read_matter(matter_id)));
create policy chat_runs_read on public.chat_runs for select to authenticated using(chat_private.can_read_matter(matter_id));
create policy chat_steps_read on public.chat_steps for select to authenticated using(chat_private.can_read_run(run_id));
create policy chat_decisions_read on public.chat_decisions for select to authenticated using(chat_private.can_read_run(run_id));
create policy chat_memories_read on public.chat_memories for select to authenticated using(chat_private.member_of(workspace_id));
create policy chat_invitations_read on public.chat_invitations for select to authenticated using(chat_private.owner_of(workspace_id));

create function public.chat_provision(actor uuid, config jsonb) returns uuid language plpgsql set search_path='' as $$
declare w uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,14));
 if (select count(*) from public.chat_workspaces where owner_id=actor)>=3 then raise exception 'workspace_limit'; end if;
 insert into public.chat_workspaces(owner_id,name,kind,professional_role,team_size,goals) values(actor,config->>'name',config->>'kind',config->>'professional_role',config->>'team_size',config->>'goals') returning id into w;
 insert into public.chat_members(workspace_id,user_id,role) values(w,actor,'owner');
 insert into public.chat_agents(workspace_id,key,name,mission) values
 (w,'intake','Triagem',case when config->>'kind'='firm' then 'Identifique o cliente, escopo, documentos faltantes e próximos passos para o escritório.' else 'Identifique a área solicitante, escopo, prioridade e informações faltantes para o jurídico interno.' end),
 (w,'contracts','Contratos','Compare a minuta com os modelos fornecidos. Identifique divergências e proponha redações para revisão humana.'),
 (w,'policies','Políticas','Confira as políticas internas fornecidas. Identifique condições e decisões necessárias, sem conceder aprovações.'),
 (w,'coordinator','Coordenação','Consolide o trabalho dos especialistas, preserve divergências e apresente próximos passos ao responsável humano.');
 return w;
end $$;

create function public.chat_add_document(actor uuid, doc jsonb) returns uuid language plpgsql set search_path='' as $$
declare w uuid:=(doc->>'workspace_id')::uuid; m uuid:=nullif(doc->>'matter_id','')::uuid; d uuid;
begin
 perform 1 from public.chat_workspaces where id=w for update;
 if not exists(select 1 from public.chat_members where workspace_id=w and user_id=actor) then raise exception 'forbidden'; end if;
 if m is null and not exists(select 1 from public.chat_members where workspace_id=w and user_id=actor and role='owner') then raise exception 'owner_required'; end if;
 if m is not null and not exists(select 1 from public.chat_matters where id=m and workspace_id=w and (created_by=actor or visibility='workspace')) then raise exception 'forbidden'; end if;
 if (select count(*) from public.chat_documents where workspace_id=w)>=40 then raise exception 'document_limit'; end if;
 if exists(select 1 from public.chat_documents where workspace_id=w and matter_id is not distinct from m and sha256=doc->>'sha256') then raise exception 'duplicate_document'; end if;
 insert into public.chat_documents(id,workspace_id,matter_id,created_by,name,kind,content,storage_path,mime,sha256)
 values((doc->>'id')::uuid,w,m,actor,doc->>'name',doc->>'kind',doc->>'content',doc->>'storage_path',doc->>'mime',doc->>'sha256') returning id into d;
 return d;
end $$;

create function public.chat_start_run(actor uuid, matter uuid, sources uuid[]) returns uuid language plpgsql set search_path='' as $$
declare w uuid; r uuid;
begin
 select workspace_id into w from public.chat_matters where id=matter and (created_by=actor or visibility='workspace');
 if w is null or not exists(select 1 from public.chat_members where workspace_id=w and user_id=actor) then raise exception 'forbidden'; end if;
 perform 1 from public.chat_workspaces where id=w for update;
 if (select count(*) from public.chat_runs where workspace_id=w and created_at>=date_trunc('day',now()))>=5 then raise exception 'daily_limit'; end if;
 if cardinality(sources) not between 1 and 12 or cardinality(sources)<>(select count(distinct d.id) from public.chat_documents d where d.id=any(sources) and d.workspace_id=w and (d.matter_id is null or d.matter_id=matter)) then raise exception 'invalid_sources'; end if;
 if not exists(select 1 from public.chat_documents where id=any(sources) and matter_id=matter and kind='contract') then raise exception 'contract_required'; end if;
 insert into public.chat_runs(workspace_id,matter_id,started_by,source_ids) values(w,matter,actor,sources) returning id into r;
 insert into public.chat_steps(run_id,ordinal,agent_key) values(r,0,'intake'),(r,1,'contracts'),(r,2,'policies'),(r,3,'coordinator');
 update public.chat_matters set status='running' where id=matter;
 return r;
end $$;

create function public.chat_claim_step(only_run uuid default null) returns setof public.chat_steps language plpgsql set search_path='' as $$
declare s public.chat_steps;
begin
 -- SKIP LOCKED and a fresh fencing token prevent duplicate commits after a lease expires.
 select t.* into s from public.chat_steps t join public.chat_runs r on r.id=t.run_id
 where r.status in ('queued','running') and (only_run is null or r.id=only_run)
 and t.attempts<3 and (t.status='queued' or (t.status='running' and t.lease_until<now()))
 and not exists(select 1 from public.chat_steps p where p.run_id=t.run_id and p.ordinal<t.ordinal and p.status<>'completed')
 order by r.created_at,t.ordinal for update of t skip locked limit 1;
 if s.id is null then return; end if;
 update public.chat_steps set status='running',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '90 seconds',started_at=now() where id=s.id returning * into s;
 update public.chat_runs set status='running' where id=s.run_id;
 return next s;
end $$;

create function public.chat_finish_step(step_id uuid, token uuid, result jsonb, failure text default null, usage_data jsonb default '{}'::jsonb) returns boolean language plpgsql set search_path='' as $$
declare s public.chat_steps; next_status text;
begin
 select * into s from public.chat_steps where id=step_id and lease_token=token and status='running' and lease_until>now() for update;
 if s.id is null then return false; end if;
 next_status:=case when failure is null then 'completed' when s.attempts>=3 then 'failed' else 'queued' end;
 update public.chat_steps set status=next_status,output=case when failure is null then result else null end,error=failure,lease_until=null,
 completed_at=case when next_status='completed' then now() else null end,
 model=usage_data->>'model',cost_usd=coalesce(cost_usd,0)+coalesce((usage_data->>'cost')::numeric,0),
 input_tokens=coalesce(input_tokens,0)+coalesce((usage_data->>'inputTokens')::int,0),output_tokens=coalesce(output_tokens,0)+coalesce((usage_data->>'outputTokens')::int,0)
 where id=s.id;
 if next_status='failed' then update public.chat_runs set status='failed',error=failure where id=s.run_id;
 elsif s.ordinal=3 and next_status='completed' then
 update public.chat_runs set status='review',completed_at=now() where id=s.run_id;
 update public.chat_matters set status='review' where id=(select matter_id from public.chat_runs where id=s.run_id);
 end if;
 return true;
end $$;

create function public.chat_record_decision(actor uuid, target_run uuid, verdict text, explanation text, remember boolean default false) returns uuid language plpgsql set search_path='' as $$
declare r public.chat_runs; d uuid;
begin
 select * into r from public.chat_runs where id=target_run for update;
 if r.id is null or not exists(select 1 from public.chat_members where workspace_id=r.workspace_id and user_id=actor) or not exists(select 1 from public.chat_matters where id=r.matter_id and (created_by=actor or visibility='workspace')) then raise exception 'forbidden'; end if;
 if r.status<>'review' then raise exception 'not_in_review'; end if;
 if remember and not exists(select 1 from public.chat_members where workspace_id=r.workspace_id and user_id=actor and role='owner') then raise exception 'owner_required'; end if;
 insert into public.chat_decisions(run_id,workspace_id,decided_by,outcome,note) values(r.id,r.workspace_id,actor,verdict,explanation) returning id into d;
 if remember then insert into public.chat_memories(workspace_id,decision_id,content,approved_by) values(r.workspace_id,d,explanation,actor); end if;
 update public.chat_runs set status=case when verdict='approved' then 'completed' else 'changes_requested' end where id=r.id;
 update public.chat_matters set status=case when verdict='approved' then 'completed' else 'changes_requested' end where id=r.matter_id;
 return d;
end $$;

create function public.chat_accept_invitation(actor uuid, verified_email text, digest text) returns uuid language plpgsql set search_path='' as $$
declare i public.chat_invitations;
begin
 select * into i from public.chat_invitations where token_hash=digest and lower(email)=lower(verified_email) and accepted_at is null and expires_at>now() for update;
 if i.id is null then raise exception 'invalid_invitation'; end if;
 if not exists(select 1 from auth.users where id=actor and lower(email)=lower(verified_email) and email_confirmed_at is not null) then raise exception 'email_unverified'; end if;
 insert into public.chat_members(workspace_id,user_id,role) values(i.workspace_id,actor,'member') on conflict do nothing;
 update public.chat_invitations set accepted_at=now() where id=i.id;
 return i.workspace_id;
end $$;

-- Recover abandoned final attempts rather than leaving the workspace running forever.
create function public.chat_recover_stale_runs() returns void language plpgsql set search_path='' as $$
begin
 update public.chat_steps set status='failed',error='A execução foi interrompida. Inicie uma nova análise.' where status='running' and lease_until<now() and attempts>=3;
 update public.chat_runs r set status='failed',error='Uma etapa não pôde ser concluída. Inicie uma nova análise.' where r.status in ('queued','running') and exists(select 1 from public.chat_steps s where s.run_id=r.id and s.status='failed');
 update public.chat_matters m set status='draft' where m.status='running' and not exists(select 1 from public.chat_runs r where r.matter_id=m.id and r.status in ('queued','running','review'));
end $$;

do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('chat_provision','chat_add_document','chat_start_run','chat_claim_step','chat_finish_step','chat_record_decision','chat_accept_invitation','chat_recover_stale_runs') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('chat-documents','chat-documents',false,8388608,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','text/markdown','text/csv','application/octet-stream']) on conflict(id) do nothing;
-- No browser Storage policies: downloads are authorized against document RLS by the API.
