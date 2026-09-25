-- Keep the public summary short; the detailed agenda lives in pre_questions.
update public.community_events
set
  description = 'Encontro entre profissionais do jurídico para comparar como diferentes times provisionam honorários de êxito — de escritórios fornecedores e da parte adversa. Vamos conversar sobre critérios, modelos de cálculo, políticas internas e uso de sistemas.',
  participation_details = 'Encontro remoto, com data e horário a confirmar. Cadastre-se para receber os detalhes quando forem definidos.'
where slug = 'bench-honorarios-exito-2026';
