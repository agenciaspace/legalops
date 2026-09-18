-- Published sections are public; contributions and revision history are member-only.
create table public.contract_map_leads (
  user_id uuid primary key references public.community_members(user_id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.contract_map_leads enable row level security;
revoke all on public.contract_map_leads from anon, authenticated;
grant select on public.contract_map_leads to authenticated;
create policy map_leads_read on public.contract_map_leads for select to authenticated using (private.has_active_club_access());

create function private.is_contract_map_lead() returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_active_club_access() and exists (select 1 from public.contract_map_leads where user_id = (select auth.uid()));
$$;
revoke all on function private.is_contract_map_lead() from public, anon;
grant execute on function private.is_contract_map_lead() to authenticated;

create table public.contract_map_sections (
  id text primary key check (id in ('solicitacao','triagem','elaboracao','negociacao','aprovacao','assinatura','execucao','renovacao')),
  title text not null,
  position int not null unique,
  content jsonb not null check (jsonb_typeof(content) = 'object' and content->>'type' = 'doc' and octet_length(content::text) <= 100000),
  version int not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.contract_map_sections enable row level security;
revoke all on public.contract_map_sections from anon, authenticated;
grant select (id,title,position,content,version,updated_at) on public.contract_map_sections to anon, authenticated;
create policy map_sections_read on public.contract_map_sections for select to anon, authenticated using (true);

create table public.contract_map_contributions (
  id uuid primary key default gen_random_uuid(),
  section_id text not null references public.contract_map_sections(id),
  author_id uuid not null references auth.users(id),
  kind text not null check (kind in ('comment','suggestion')),
  body text not null check (length(trim(body)) between 3 and 4000),
  proposed_content jsonb,
  base_version int not null,
  status text not null default 'open' check (status in ('open','accepted','rejected','resolved')),
  license_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  reviewer_id uuid references auth.users(id),
  review_note text check (length(review_note) <= 1000),
  reviewed_at timestamptz,
  check ((kind = 'comment' and proposed_content is null) or (kind = 'suggestion' and proposed_content is not null and license_accepted))
);
create index map_contributions_section on public.contract_map_contributions(section_id,created_at desc);
create index map_contributions_author on public.contract_map_contributions(author_id,created_at desc);
alter table public.contract_map_contributions enable row level security;
revoke all on public.contract_map_contributions from anon, authenticated;
grant select on public.contract_map_contributions to authenticated;
create policy map_contributions_read on public.contract_map_contributions for select to authenticated using (private.has_active_club_access());

create table public.contract_map_revisions (
  id uuid primary key default gen_random_uuid(),
  section_id text not null references public.contract_map_sections(id),
  version int not null,
  content jsonb not null,
  editor_id uuid references auth.users(id),
  note text not null check (length(note) <= 1000),
  contribution_id uuid references public.contract_map_contributions(id),
  created_at timestamptz not null default now(),
  unique(section_id,version)
);
alter table public.contract_map_revisions enable row level security;
revoke all on public.contract_map_revisions from anon, authenticated;
grant select on public.contract_map_revisions to authenticated;
create policy map_revisions_read on public.contract_map_revisions for select to authenticated using (private.has_active_club_access());

-- Strict tree validation also protects direct RPC calls, outside the app UI.
create function private.valid_map_node(n jsonb, depth int default 0) returns boolean language plpgsql immutable set search_path = '' as $$
declare typ text; child jsonb; mark jsonb; permitted text[];
begin
  if n is null or jsonb_typeof(n) <> 'object' or depth > 12 or octet_length(n::text)>100000 then return false; end if;
  if depth=0 and not jsonb_path_exists(n, '$.** ? (@.type == "text" && @.text != "")') then return false; end if;
  typ := n->>'type';
  if typ is null or typ not in ('doc','paragraph','heading','bulletList','orderedList','listItem','blockquote','text','hardBreak') or (depth=0) <> (typ='doc') then return false; end if;
  if exists(select 1 from jsonb_object_keys(n) k where k not in ('type','text','content','attrs','marks')) then return false; end if;
  if typ='text' then
    if jsonb_typeof(n->'text') is distinct from 'string' or length(n->>'text') not between 1 and 20000 then return false; end if;
  elsif n ? 'text' then return false;
  end if;
  if n ? 'attrs' then
    if jsonb_typeof(n->'attrs') <> 'object' then return false; end if;
    if typ='heading' then
      if exists(select 1 from jsonb_object_keys(n->'attrs') k where k <> 'level') or (n->'attrs'->>'level') not in ('2','3') then return false; end if;
    elsif typ='orderedList' then
      if exists(select 1 from jsonb_object_keys(n->'attrs') k where k <> 'start') or coalesce(n->'attrs'->>'start','') !~ '^[0-9]{1,5}$' then return false; end if;
      if (n->'attrs'->>'start')::int not between 1 and 10000 then return false; end if;
    elsif n->'attrs' <> '{}'::jsonb then return false;
    end if;
  end if;
  if typ='heading' and coalesce(n->'attrs'->>'level','') not in ('2','3') then return false; end if;
  if n ? 'marks' then
    if typ <> 'text' or jsonb_typeof(n->'marks') <> 'array' then return false; end if;
    if jsonb_array_length(n->'marks')>2 then return false; end if;
    for mark in select value from jsonb_array_elements(n->'marks') loop
      if mark not in ('{"type":"bold"}'::jsonb,'{"type":"italic"}'::jsonb) then return false; end if;
    end loop;
  end if;
  permitted := case typ
    when 'doc' then array['paragraph','heading','bulletList','orderedList','blockquote']
    when 'paragraph' then array['text','hardBreak'] when 'heading' then array['text','hardBreak']
    when 'bulletList' then array['listItem'] when 'orderedList' then array['listItem']
    when 'listItem' then array['paragraph','bulletList','orderedList']
    when 'blockquote' then array['paragraph','heading','bulletList','orderedList'] else array[]::text[] end;
  if n ? 'content' then
    if jsonb_typeof(n->'content') <> 'array' then return false; end if;
    if jsonb_array_length(n->'content')>300 then return false; end if;
    for child in select value from jsonb_array_elements(n->'content') loop
      if not (coalesce(child->>'type','') = any(permitted)) or not private.valid_map_node(child,depth+1) then return false; end if;
    end loop;
  end if;
  return true;
end;
$$;
revoke all on function private.valid_map_node(jsonb,int) from public,anon,authenticated;

create function public.contract_map_contribute(p_section text,p_kind text,p_body text,p_version int,p_content jsonb default null,p_license boolean default false) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid; current_version int;
begin
  if not private.has_active_club_access() or auth.uid() is null then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  -- Serialize contributions by author so the daily limit also holds under concurrency.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,23));
  if (select count(*) from public.contract_map_contributions where author_id=auth.uid() and created_at>now()-interval '1 day')>=50 then raise exception 'DAILY_LIMIT'; end if;
  select version into current_version from public.contract_map_sections where id=p_section;
  if not found then raise exception 'SECTION_NOT_FOUND'; end if;
  if p_kind='suggestion' then
    if p_version is distinct from current_version then raise exception 'VERSION_CONFLICT'; end if;
    if p_license is distinct from true or p_content is null or not private.valid_map_node(p_content) then raise exception 'INVALID_CONTENT'; end if;
  end if;
  insert into public.contract_map_contributions(section_id,author_id,kind,body,base_version,proposed_content,license_accepted)
    values(p_section,auth.uid(),p_kind,trim(p_body),current_version,case when p_kind='suggestion' then p_content end,p_license) returning id into result;
  return result;
end;
$$;
revoke all on function public.contract_map_contribute(text,text,text,int,jsonb,boolean) from public,anon;
grant execute on function public.contract_map_contribute(text,text,text,int,jsonb,boolean) to authenticated;

create function public.contract_map_publish(p_section text,p_version int,p_content jsonb,p_note text,p_contribution uuid default null) returns int
language plpgsql security definer set search_path = '' as $$
declare current_section public.contract_map_sections; suggestion public.contract_map_contributions;
begin
  if auth.uid() is null or not private.is_contract_map_lead() then raise exception 'LEAD_REQUIRED'; end if;
  if p_content is null or not private.valid_map_node(p_content) or length(trim(coalesce(p_note,''))) not between 3 and 1000 then raise exception 'INVALID_CONTENT'; end if;
  select * into current_section from public.contract_map_sections where id=p_section for update;
  if not found then raise exception 'SECTION_NOT_FOUND'; end if;
  if p_version is distinct from current_section.version then raise exception 'VERSION_CONFLICT'; end if;
  if p_contribution is not null then
    select * into suggestion from public.contract_map_contributions where id=p_contribution for update;
    if not found or suggestion.section_id <> p_section or suggestion.kind <> 'suggestion' or suggestion.status <> 'open' then raise exception 'INVALID_SUGGESTION'; end if;
    if suggestion.base_version <> current_section.version then raise exception 'VERSION_CONFLICT'; end if;
    if p_content <> suggestion.proposed_content then raise exception 'INVALID_SUGGESTION'; end if;
  end if;
  update public.contract_map_sections set content=p_content,version=version+1,updated_at=now(),updated_by=auth.uid() where id=p_section;
  insert into public.contract_map_revisions(section_id,version,content,editor_id,note,contribution_id) values(p_section,p_version+1,p_content,auth.uid(),trim(p_note),p_contribution);
  if p_contribution is not null then update public.contract_map_contributions set status='accepted',reviewer_id=auth.uid(),review_note=trim(p_note),reviewed_at=now() where id=p_contribution; end if;
  return p_version+1;
end;
$$;
revoke all on function public.contract_map_publish(text,int,jsonb,text,uuid) from public,anon;
grant execute on function public.contract_map_publish(text,int,jsonb,text,uuid) to authenticated;

create function public.contract_map_review(p_id uuid,p_status text,p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_contract_map_lead() then raise exception 'LEAD_REQUIRED'; end if;
  if p_status not in ('rejected','resolved') or length(trim(coalesce(p_note,''))) not between 3 and 1000 then raise exception 'INVALID_REVIEW'; end if;
  update public.contract_map_contributions set status=p_status,reviewer_id=auth.uid(),review_note=trim(p_note),reviewed_at=now() where id=p_id and status='open' and (p_status='rejected' or kind='comment');
  if not found then raise exception 'INVALID_REVIEW'; end if;
end;
$$;
revoke all on function public.contract_map_review(uuid,text,text) from public,anon;
grant execute on function public.contract_map_review(uuid,text,text) to authenticated;

-- The community owner is the initial lead; roles are never derived from user metadata.
insert into public.contract_map_leads(user_id)
  select m.user_id from public.community_members m join auth.users u on u.id=m.user_id where lower(u.email)='leonhatori@gmail.com'
  on conflict do nothing;

insert into public.contract_map_sections(id,title,position,content) values ('solicitacao','Solicitar e priorizar',1,'{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Entender a demanda antes de começar."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Responsáveis sugeridos"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Área solicitante + Legal Ops"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Perguntas para o time"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Qual é o objeto, o valor, o prazo e a contraparte?"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Quem responde pelo negócio e qual é a prioridade?"}]}]}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Entrega da etapa"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Demanda registrada com informações mínimas e responsável."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "O que acompanhar"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Tempo até a triagem; demandas devolvidas por falta de informação."}]}]}'::jsonb);

insert into public.contract_map_sections(id,title,position,content) values ('triagem','Definir o caminho',2,'{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Escolher o fluxo e o nível de revisão."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Responsáveis sugeridos"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Legal Ops + jurídico"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Perguntas para o time"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Podemos usar um modelo aprovado?"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Quais áreas precisam participar, considerando o risco e o contexto?"}]}]}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Entrega da etapa"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Tipo de contrato, revisores e fluxo definidos."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "O que acompanhar"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Tempo de triagem; uso de modelos aprovados."}]}]}'::jsonb);

insert into public.contract_map_sections(id,title,position,content) values ('elaboracao','Preparar o contrato',3,'{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Criar a primeira versão com dados conferidos."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Responsáveis sugeridos"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Jurídico ou solicitante autorizado"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Perguntas para o time"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Qual versão do modelo e do playbook se aplica?"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Os dados da contratação e os anexos estão completos?"}]}]}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Entrega da etapa"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Minuta identificada, com versão e anexos."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "O que acompanhar"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Tempo de elaboração; retrabalho na primeira versão."}]}]}'::jsonb);

insert into public.contract_map_sections(id,title,position,content) values ('negociacao','Negociar e revisar',4,'{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Registrar propostas, concessões e pontos em aberto."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Responsáveis sugeridos"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Jurídico + responsável pelo negócio"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Perguntas para o time"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "O que está dentro das posições aceitas no playbook?"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Quais desvios precisam de decisão e quem decide?"}]}]}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Entrega da etapa"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Versão negociada e registro das exceções."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "O que acompanhar"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Rodadas de negociação; tempo aguardando cada parte."}]}]}'::jsonb);

insert into public.contract_map_sections(id,title,position,content) values ('aprovacao','Aprovar as exceções',5,'{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Obter as decisões necessárias antes de assinar."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Responsáveis sugeridos"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Aprovadores definidos pela empresa"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Perguntas para o time"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "As alçadas foram atendidas?"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "A aprovação corresponde à versão final e às condições negociadas?"}]}]}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Entrega da etapa"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Aprovações registradas e versão final identificada."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "O que acompanhar"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Tempo de aprovação; devoluções e exceções recorrentes."}]}]}'::jsonb);

insert into public.contract_map_sections(id,title,position,content) values ('assinatura','Coletar assinaturas',6,'{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Concluir a formalização e conferir o resultado."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Responsáveis sugeridos"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Responsável pelo contrato + signatários"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Perguntas para o time"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Os signatários e a versão estão corretos?"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Todas as assinaturas e evidências foram reunidas?"}]}]}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Entrega da etapa"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Instrumento assinado e evidências vinculadas."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "O que acompanhar"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Tempo de assinatura; envelopes cancelados ou corrigidos."}]}]}'::jsonb);

insert into public.contract_map_sections(id,title,position,content) values ('execucao','Guardar e acompanhar',7,'{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Transformar o contrato em compromissos acompanháveis."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Responsáveis sugeridos"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Gestor do contrato + áreas responsáveis"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Perguntas para o time"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Onde ficam o original e os dados principais?"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Quem acompanha entregas, pagamentos, obrigações e prazos?"}]}]}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Entrega da etapa"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Repositório organizado, responsáveis e alertas definidos."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "O que acompanhar"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Obrigações acompanhadas; prazos sem responsável."}]}]}'::jsonb);

insert into public.contract_map_sections(id,title,position,content) values ('renovacao','Renovar ou encerrar',8,'{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Decidir o próximo ciclo com antecedência."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Responsáveis sugeridos"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Gestor do contrato + jurídico + negócio"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Perguntas para o time"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Qual é o prazo para decidir e comunicar a decisão?"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Vamos renovar, renegociar ou encerrar? O que aprendemos?"}]}]}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "Entrega da etapa"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Decisão registrada, providências concluídas e melhorias propostas."}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "O que acompanhar"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Renovações decididas no prazo; ações de encerramento pendentes."}]}]}'::jsonb);

insert into public.contract_map_revisions(section_id,version,content,note) select id,version,content,'Estrutura inicial do mapa aberto (MIT)' from public.contract_map_sections;
