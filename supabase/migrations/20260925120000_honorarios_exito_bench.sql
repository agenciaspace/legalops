insert into public.community_events (
  slug, title, description, host_name, starts_at, ends_at, location_label,
  event_type, is_published, participation_mode, participation_details,
  pre_questions
) values (
  'bench-honorarios-exito-2026',
  'Bench: provisionamento de honorários de êxito',
  'Conversa proposta no grupo CLOC Brasil — Jurídico Interno 2. Em 23/09/2026, Roberta Perez perguntou como os times provisionam honorários de êxito dos escritórios fornecedores, porque a análise caso a caso estava pesada. O grupo separou esse fluxo da provisão de honorários da parte adversa, que Roberta disse já entrar na provisão do processo. Fernando Santana descreveu o modelo mais usual que vê no mercado: pagamento nos casos estratégicos, valor fixo mais percentual de êxito, e pedido para o escritório provisionar segundo a norma da empresa. Larissa comentou um sistema que sugere o valor a partir da chance de êxito. Em 24/09, Alexander Pibernat se ofereceu para organizar o bench sobre o fluxo de provisionamento de honorários de êxito, cobrindo fornecedores e advogados da contraparte. Ingrid Santos, do SPC Brasil, e Roberta Perez disseram que querem participar. A data ainda não foi combinada.',
  'Alexander Pibernat',
  '2026-10-01 12:00:00-03',
  null,
  'Remoto — data a confirmar',
  'encontro',
  true,
  'remoto',
  'Ainda não há dia nem horário. Alexander Pibernat se ofereceu para organizar, a partir da conversa de 23 e 24/09/2026 no Jurídico Interno 2 da CLOC Brasil. Quem se cadastrar receberá os detalhes quando a data for confirmada.',
  array[
    'O contencioso é de volume ou estratégico?',
    'Como vocês provisionam honorários de êxito dos escritórios fornecedores?',
    'A provisão de honorários da parte adversa entra no mesmo fluxo?',
    'O cálculo é caso a caso, por norma enviada ao escritório, ou por sistema?'
  ]
) on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  host_name = excluded.host_name,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  location_label = excluded.location_label,
  is_published = excluded.is_published,
  participation_mode = excluded.participation_mode,
  participation_details = excluded.participation_details,
  pre_questions = excluded.pre_questions;
