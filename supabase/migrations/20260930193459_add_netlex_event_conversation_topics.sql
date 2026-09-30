alter table public.community_forum_topics
  add column if not exists event_id uuid references public.community_events(id) on delete cascade,
  add column if not exists display_order smallint not null default 0;

create unique index if not exists community_forum_topics_event_title_unique
  on public.community_forum_topics(event_id, title)
  where event_id is not null;
create index if not exists community_forum_topics_event_order_idx
  on public.community_forum_topics(event_id, display_order, created_at);

grant select on public.community_forum_topics to anon;
create policy community_forum_topics_event_public_read on public.community_forum_topics
  for select to anon, authenticated
  using (
    event_id is not null and exists (
      select 1 from public.community_events event
      where event.id = community_forum_topics.event_id and event.is_published = true
    )
  );

with event as (
  select id from public.community_events where slug = 'bench-netlex-2026'
), owner as (
  select id from auth.users where lower(email) = 'leonhatori@gmail.com' limit 1
), topics(title, description, display_order) as (
  values
    ('Implantação e roll-out', 'Planejamento, migração, fases, prazos e aprendizados da entrada em produção.', 1),
    ('Integrações e dados', 'ERP, assinatura, APIs, cadastros, migração de dados e qualidade das informações.', 2),
    ('Fluxos, templates e automações', 'Desenho de workflows, modelos, aprovações, alertas e automações que funcionaram na prática.', 3),
    ('Governança, segurança e permissões', 'Papéis, acessos, auditoria, privacidade, controles e decisões de governança.', 4),
    ('Adoção, suporte e valor', 'Engajamento dos usuários, treinamento, suporte, indicadores e como demonstrar resultado.', 5)
)
insert into public.community_forum_topics (event_id, category, title, description, display_order, created_by)
select event.id, 'contratos-clm', topics.title, topics.description, topics.display_order, owner.id
from event cross join owner cross join topics
on conflict (event_id, title) where event_id is not null do update set
  description = excluded.description,
  display_order = excluded.display_order,
  status = 'active';

with event as (
  select id from public.community_events where slug = 'bench-netlex-2026'
), owner as (
  select id from auth.users where lower(email) = 'leonhatori@gmail.com' limit 1
), starters(slug, title, body) as (
  values
    ('bench-netlex-implantacao-rollout', 'Implantação e roll-out', 'Compartilhe como foi a implantação: fases, migração, prazo, equipe envolvida e o que faria diferente.'),
    ('bench-netlex-integracoes-dados', 'Integrações e dados', 'Quais integrações foram necessárias? O que funcionou com ERP, assinatura, APIs e migração de dados?'),
    ('bench-netlex-fluxos-automacoes', 'Fluxos, templates e automações', 'Quais workflows, templates, aprovações e automações trouxeram mais resultado ou mais dificuldade?'),
    ('bench-netlex-governanca-seguranca', 'Governança, segurança e permissões', 'Como vocês organizaram papéis, acessos, auditoria, privacidade e controles?'),
    ('bench-netlex-adocao-valor', 'Adoção, suporte e valor', 'Como foi a adoção pelos usuários, o suporte e a mensuração de valor depois da implantação?')
)
insert into public.community_posts (slug, author_id, author_name, author_role, category, title, body, visibility, is_pinned, event_id, topic_id, source_locale)
select starters.slug, owner.id, 'Leon Hatori', 'legalops.club', 'contratos-clm', starters.title, starters.body, 'members', true, event.id, topic.id, 'pt-BR'
from event cross join owner cross join starters
join public.community_forum_topics topic on topic.event_id = event.id and topic.title = starters.title
on conflict (slug) do update set
  title = excluded.title,
  body = excluded.body,
  event_id = excluded.event_id,
  topic_id = excluded.topic_id,
  is_pinned = true;
