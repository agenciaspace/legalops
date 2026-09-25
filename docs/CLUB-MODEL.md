# legalops.club — comunidade e Pro

Decisão de produto de Leon, 16/09/2026. Substitui a premissa de que toda a
comunidade exige assinatura, lote fundador ou convite individual.

## Comunidade

O cadastro é aberto a pessoas com atuação ou interesse profissional compatível
com a comunidade jurídica, Legal Ops e Legal Tech. Participar da comunidade
não depende de contratar o Pro.

O perfil de entrada deve informar foto, nome, email confirmado, LinkedIn pessoal,
atuação/cargo, organização ou contexto profissional, cidade/região, breve
apresentação e assuntos de interesse. Autônomos, estudantes e pessoas em
transição podem explicar seu contexto; não se exige vínculo empregatício.

Informar um LinkedIn não comprova identidade por si só. Não apresentar a
validação de campos ou a declaração de atuação como verificação independente.
Currículo, busca de emprego e análise por IA não são requisitos de admissão.

## Pro

Pro é a camada paga de assistência pessoal: um agente por usuário, contexto
persistente, acompanhamento de assuntos, resumos e conexões úteis com o Work,
o Dev e outros serviços que vierem a ser integrados.

Exemplos de direção do produto:

- Work: relacionar oportunidades ao perfil e apoiar o acompanhamento profissional.
- Dev: relacionar problemas discutidos a projetos, documentação e contribuições.
- Club: recuperar conversas, referências e novidades dos assuntos acompanhados.

A primeira versão do agente pessoal tem histórico privado, contexto e assuntos
salvos, consulta às publicações do site, vagas verificadas do Work e referências
do OpenCLM. Limite: 30 perguntas por dia (reinício às 00h UTC). Leitura automática
do WhatsApp e aplicativo próprio continuam planejados; não fazem parte da oferta.

Consultar vagas públicas no Work e acessar projetos open source do Dev não
exigem Pro. O valor pago está na assistência e nas integrações personalizadas.
Preço e condições comerciais do Pro ainda não foram definidos nesta decisão.
Não reaproveitar automaticamente os preços dos antigos lotes fundadores.

## Implementação

Admissão na comunidade e assinatura Pro são permissões independentes. Expirar
ou cancelar o Pro não deve remover uma pessoa elegível da comunidade.
Permissões devem ser aplicadas no servidor e nas políticas do banco, além da UI.
Preservar os direitos já concedidos aos membros existentes na migração.

## Admission implementation

Email confirmation plus an owned profile photo and a complete, self-declared
professional profile enable free membership automatically. The profile-complete
badge follows the same deterministic criteria and updates after every profile
change. It is not identity proof, credential certification or manual approval.

The database RPC admits only the authenticated, confirmed-email user and ignores
billing and Pro fields. Existing active/complimentary benefits were migrated to
independent Pro status; future Pro expiry does not expire community membership.
Existing active members remain in the community when their profile is incomplete;
the interface reminds them to complete it without blocking access. A profile
with a real name, role and organization remains in the directory even without a
photo, while generic imported placeholder cards stay hidden. The stricter photo
requirement applies to new admission.
PIX checkout and manual activation are implemented. Price and period must be
explicitly configured before opening sales; no legacy founder price is assumed.

Validation: `npm test`, `npm run build`, and the rollback-only database assertions
in `supabase/tests/club_admission.sql`. The authenticated SECURITY DEFINER RPC is
intentional: it grants only free membership after these checks; users cannot
update Pro fields. See [Supabase advisory rationale](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Conversão para Pro (16/09/2026)

Destacar o Pro quando a pessoa busca assistência, contexto, vagas personalizadas
ou conexão com projetos. Apresentar o benefício concreto e um próximo passo claro.
Evitar chamadas que desestimulem a contratação, como “não é preciso contratar”.
Manter a participação gratuita e a diferença entre recursos prontos e planejados;
não inventar disponibilidade, preço, urgência ou obrigação de pagar.

## Venda por PIX (16/09/2026)

Leon autorizou abrir vendas pela chave `leonhatori@gmail.com`. Preço e período
ainda aguardam decisão. A oferta fica inativa até ambos serem definidos.

- `/club/checkout`: conta e perfil completos, pedido com preço/período fixados,
  upload privado de comprovante PDF/PNG/JPG até 5 MB e status da conferência.
- `/club/admin/pro`: administradores configuram oferta, conferem o recebimento
  no banco e aprovam/rejeitam com motivo. Não há conciliação bancária automática.
- A aprovação inicia o período ou soma meses ao prazo ainda vigente. Sem
  renovação automática. Expirar o Pro preserva a comunidade gratuita.
- `/community/assistant`: agente pessoal; `/api/club/agent` valida Pro no servidor.
  Apagar histórico não reinicia a cota. Falhas do provedor devolvem a pergunta.
- A ativação aparece no checkout; email de ativação ainda não está implementado.

Dados: `club_pro_offer`, `club_pro_orders`, bucket privado `club-pro-receipts`,
`club_agent_preferences`, `club_agent_turns` e `club_agent_usage`. RPCs de
aprovação e consumo são restritas a service role. Recibos só são baixados por
administradores autenticados através de links temporários.

Validação: testes Vitest de autorização, pedidos e agente; rollback SQL em
`supabase/tests/club_pro.sql` verifica aprovação única, isolamento e cota diária.
