# legalops.club — comunidade e Pro

Decisão de produto de Leon, 16/09/2026. Substitui a premissa de que toda a
comunidade exige assinatura, lote fundador ou convite individual.

## Comunidade

O cadastro é aberto a pessoas com atuação ou interesse profissional compatível
com a comunidade jurídica, Legal Ops e Legal Tech. Participar da comunidade
não depende de contratar o Pro.

O perfil de entrada deve informar nome, email confirmado, LinkedIn pessoal,
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

O agente pessoal integrado continua em preparação; os agentes temáticos atuais
não equivalem ao produto completo. Distinguir funcionalidades disponíveis de
funcionalidades planejadas em todas as páginas e ofertas.

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

Email confirmation plus a complete, self-declared professional profile enables
free membership automatically. This is a profile criterion, not identity proof
or manual approval. Rejected profiles require administration review. LinkedIn
URLs and imported data never automatically confer a verified badge.

The database RPC admits only the authenticated, confirmed-email user and ignores
billing and Pro fields. Existing active/complimentary benefits were migrated to
independent Pro status; future Pro expiry does not expire community membership.
No Pro price or checkout is currently defined.

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
