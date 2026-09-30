insert into public.community_events (
  slug, title, description, host_name, starts_at, ends_at, location_label,
  event_type, is_published, participation_mode, participation_details,
  pre_questions
) values (
  'bench-netlex-2026',
  'Bench: experiências com o NetLex',
  'Encontro entre profissionais que usam, implantaram ou avaliam o NetLex para trocar experiências práticas sobre o CLM. A proposta é comparar o que funciona, onde surgem dificuldades e como diferentes times lidam com configuração, adoção, relatórios, integrações e governança.',
  'legalops.club',
  '2026-11-01 12:00:00-03',
  null,
  'Data a confirmar — formato a confirmar',
  'encontro',
  true,
  'hibrido',
  'A data, o formato e o local ainda serão definidos no grupo do Bench NetLex. Cadastre-se para receber as informações oficiais quando forem confirmadas.',
  array[
    'Como tem sido a experiência com o NetLex e quais resultados o time já percebeu?',
    'Quais foram os principais desafios de implantação, configuração e adoção?',
    'Como funcionam relatórios, integrações e a governança do CLM no dia a dia?',
    'O que vocês recomendariam para quem está avaliando ou evoluindo o uso da plataforma?'
  ]
) on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  host_name = excluded.host_name,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  location_label = excluded.location_label,
  event_type = excluded.event_type,
  is_published = excluded.is_published,
  participation_mode = excluded.participation_mode,
  participation_details = excluded.participation_details,
  pre_questions = excluded.pre_questions;
