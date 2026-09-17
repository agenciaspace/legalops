-- Remove only untouched seeded themes with no author, session or registration.
with seeds(slug,title,description,category,min_participants,ideal_participants,status,is_public) as (values
('harvey-na-pratica', 'Harvey na prática', 'Como times jurídicos estão usando Harvey de verdade: casos de uso, workflows, adoção, integrações e o que está funcionando no dia a dia.', 'ia-automacao', 5, 12, 'forming', true),
  ('governanca-processo-contratos', 'Governança e processo de contratos', 'Intake, aprovações, CLM, responsabilidades, handoffs e gestão do ciclo contratual entre Jurídico e negócio.', 'contratos-clm', 5, 12, 'forming', true),
  ('intake-triage-juridico', 'Legal Intake & Triage', 'Como organizar entrada de demandas, triagem, priorização, SLAs e roteamento sem transformar o Jurídico em gargalo.', 'processos-projetos', 5, 12, 'forming', true),
  ('clm-implementation', 'CLM Implementation', 'Bench de implementação de CLM: seleção, migração, desenho de fluxo, integrações, adoção e métricas depois do go-live.', 'contratos-clm', 5, 12, 'forming', true),
  ('legal-ops-kpis-slas', 'Legal Ops KPIs & SLAs', 'Quais indicadores e SLAs os times realmente acompanham, como calculam e como usam os dados para tomar decisões.', 'dados-metricas', 5, 12, 'forming', true),
  ('ai-agents-automation', 'AI Agents & Automation', 'Casos reais de agentes, automações e IA aplicada à operação jurídica, incluindo governança, segurança e impacto mensurável.', 'ia-automacao', 5, 12, 'forming', true))
delete from public.bench_topics topic using seeds
where topic.slug=seeds.slug and topic.title=seeds.title and topic.description=seeds.description
  and topic.created_by is null and topic.status='forming' and topic.interest_count=0
  and not exists (select 1 from public.bench_sessions session where session.topic_id=topic.id)
  and not exists (select 1 from public.bench_registrations registration where registration.topic_id=topic.id);
