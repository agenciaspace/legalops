update public.community_events
set
  description = 'Encontro entre profissionais de departamentos jurídicos, escritórios e Legal Ops para comparar como diferentes times provisionam honorários de êxito — de escritórios fornecedores e da parte adversa. Vamos conversar sobre critérios, modelos de cálculo, políticas internas e uso de sistemas.',
  pre_questions = array[
    'Como departamentos jurídicos e escritórios provisionam honorários de êxito hoje?',
    'Como vocês provisionam honorários de êxito dos escritórios fornecedores?',
    'A provisão de honorários da parte adversa entra no mesmo fluxo?',
    'O cálculo é caso a caso, segue uma política interna ou usa dados e sistemas?'
  ]
where slug = 'bench-honorarios-exito-2026';
