-- Initial nationwide regional directory and common Bench topics.

INSERT INTO public.community_regions
  (slug, name, country_code, region_type, macro_region, state_code, timezone, status, sort_order)
VALUES
  ('acre', 'Acre', 'BR', 'state', 'Norte', 'AC', 'America/Rio_Branco', 'forming', 1),
  ('alagoas', 'Alagoas', 'BR', 'state', 'Nordeste', 'AL', 'America/Maceio', 'forming', 2),
  ('amapa', 'Amapá', 'BR', 'state', 'Norte', 'AP', 'America/Belem', 'forming', 3),
  ('amazonas', 'Amazonas', 'BR', 'state', 'Norte', 'AM', 'America/Manaus', 'forming', 4),
  ('bahia', 'Bahia', 'BR', 'state', 'Nordeste', 'BA', 'America/Bahia', 'forming', 5),
  ('ceara', 'Ceará', 'BR', 'state', 'Nordeste', 'CE', 'America/Fortaleza', 'forming', 6),
  ('distrito-federal', 'Distrito Federal', 'BR', 'state', 'Centro-Oeste', 'DF', 'America/Sao_Paulo', 'forming', 7),
  ('espirito-santo', 'Espírito Santo', 'BR', 'state', 'Sudeste', 'ES', 'America/Sao_Paulo', 'forming', 8),
  ('goias', 'Goiás', 'BR', 'state', 'Centro-Oeste', 'GO', 'America/Sao_Paulo', 'forming', 9),
  ('maranhao', 'Maranhão', 'BR', 'state', 'Nordeste', 'MA', 'America/Fortaleza', 'forming', 10),
  ('mato-grosso', 'Mato Grosso', 'BR', 'state', 'Centro-Oeste', 'MT', 'America/Cuiaba', 'forming', 11),
  ('mato-grosso-do-sul', 'Mato Grosso do Sul', 'BR', 'state', 'Centro-Oeste', 'MS', 'America/Campo_Grande', 'forming', 12),
  ('minas-gerais', 'Minas Gerais', 'BR', 'state', 'Sudeste', 'MG', 'America/Sao_Paulo', 'forming', 13),
  ('para', 'Pará', 'BR', 'state', 'Norte', 'PA', 'America/Belem', 'forming', 14),
  ('paraiba', 'Paraíba', 'BR', 'state', 'Nordeste', 'PB', 'America/Fortaleza', 'forming', 15),
  ('parana', 'Paraná', 'BR', 'state', 'Sul', 'PR', 'America/Sao_Paulo', 'forming', 16),
  ('pernambuco', 'Pernambuco', 'BR', 'state', 'Nordeste', 'PE', 'America/Recife', 'forming', 17),
  ('piaui', 'Piauí', 'BR', 'state', 'Nordeste', 'PI', 'America/Fortaleza', 'forming', 18),
  ('rio-de-janeiro', 'Rio de Janeiro', 'BR', 'state', 'Sudeste', 'RJ', 'America/Sao_Paulo', 'forming', 19),
  ('rio-grande-do-norte', 'Rio Grande do Norte', 'BR', 'state', 'Nordeste', 'RN', 'America/Fortaleza', 'forming', 20),
  ('rio-grande-do-sul', 'Rio Grande do Sul', 'BR', 'state', 'Sul', 'RS', 'America/Sao_Paulo', 'forming', 21),
  ('rondonia', 'Rondônia', 'BR', 'state', 'Norte', 'RO', 'America/Porto_Velho', 'forming', 22),
  ('roraima', 'Roraima', 'BR', 'state', 'Norte', 'RR', 'America/Boa_Vista', 'forming', 23),
  ('santa-catarina', 'Santa Catarina', 'BR', 'state', 'Sul', 'SC', 'America/Sao_Paulo', 'forming', 24),
  ('sao-paulo', 'São Paulo', 'BR', 'state', 'Sudeste', 'SP', 'America/Sao_Paulo', 'forming', 25),
  ('sergipe', 'Sergipe', 'BR', 'state', 'Nordeste', 'SE', 'America/Maceio', 'forming', 26),
  ('tocantins', 'Tocantins', 'BR', 'state', 'Norte', 'TO', 'America/Araguaina', 'forming', 27)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  macro_region = EXCLUDED.macro_region,
  state_code = EXCLUDED.state_code,
  timezone = EXCLUDED.timezone,
  updated_at = now();

INSERT INTO public.bench_topics
  (slug, title, description, category, min_participants, ideal_participants, status, is_public)
VALUES
  ('harvey-na-pratica', 'Harvey na prática', 'Como times jurídicos estão usando Harvey de verdade: casos de uso, workflows, adoção, integrações e o que está funcionando no dia a dia.', 'ia-automacao', 5, 12, 'forming', true),
  ('governanca-processo-contratos', 'Governança e processo de contratos', 'Intake, aprovações, CLM, responsabilidades, handoffs e gestão do ciclo contratual entre Jurídico e negócio.', 'contratos-clm', 5, 12, 'forming', true),
  ('intake-triage-juridico', 'Legal Intake & Triage', 'Como organizar entrada de demandas, triagem, priorização, SLAs e roteamento sem transformar o Jurídico em gargalo.', 'processos-projetos', 5, 12, 'forming', true),
  ('clm-implementation', 'CLM Implementation', 'Bench de implementação de CLM: seleção, migração, desenho de fluxo, integrações, adoção e métricas depois do go-live.', 'contratos-clm', 5, 12, 'forming', true),
  ('legal-ops-kpis-slas', 'Legal Ops KPIs & SLAs', 'Quais indicadores e SLAs os times realmente acompanham, como calculam e como usam os dados para tomar decisões.', 'dados-metricas', 5, 12, 'forming', true),
  ('ai-agents-automation', 'AI Agents & Automation', 'Casos reais de agentes, automações e IA aplicada à operação jurídica, incluindo governança, segurança e impacto mensurável.', 'ia-automacao', 5, 12, 'forming', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  min_participants = EXCLUDED.min_participants,
  ideal_participants = EXCLUDED.ideal_participants,
  updated_at = now();
