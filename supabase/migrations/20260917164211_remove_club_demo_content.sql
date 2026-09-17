-- User-requested removal of demonstration content from the paid-launch prototype.
-- Scope is the unchanged, migration-seeded content, never member-authored posts.
-- The actual Nubank event, accounts, memberships and payment configuration remain.
delete from public.community_discussion_summaries
where (model = 'seed-curated' and title = 'Radar LegalOps: os temas que estão movendo a operação')
   or (model = 'extractive-fallback'
       and title = 'Radar da semana: Bem-vindos ao LegalOps Club'
       and period_start = '2026-08-09T00:00:00Z' and period_end = '2026-08-16T00:00:00Z'
       and source_post_count = 14 and source_comment_count = 0);

delete from public.community_posts p
where p.author_id is null and p.author_name = 'Equipe LegalOps'
  and p.updated_at < '2026-08-15T00:00:00Z'
  and p.slug in (
    'bem-vindos-ao-legalops-club', 'apresente-se-em-tres-linhas', 'stack-legalops-2026',
    'ia-juridica-do-piloto-a-escala', 'metricas-que-mudam-decisoes', 'clm-alem-da-implantacao',
    'processos-projetos-sem-burocracia', 'spend-fornecedores-escritorios', 'governanca-conhecimento-vivo',
    'maturidade-legalops-roadmap', 'modelos-de-entrega-juridica', 'pessoas-carreira-lideranca',
    'como-usar-as-discussoes-gerais', 'cases-playbooks-sem-teatro'
  )
  and not exists (select 1 from public.community_comments c where c.post_id = p.id)
  and not exists (select 1 from public.community_post_likes l where l.post_id = p.id);

-- Modules and lessons are exclusively the original sample course outlines;
-- their foreign keys cascade on course deletion.
delete from public.community_courses
where slug in ('fundamentos-legal-ops','clm-na-pratica','ia-juridico')
  and updated_at < '2026-08-15T00:00:00Z';

delete from public.community_events e
where e.slug in ('office-hours-agosto-2026','clm-sem-caos-agosto-2026','networking-setembro-2026')
  and e.starts_at < '2026-09-04T00:00:00Z'
  and not exists (select 1 from public.community_event_rsvps r where r.event_id = e.id);
