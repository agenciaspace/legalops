# Club launch readiness — 2026-09-16

## Verified baseline

- Free profile-based admission and separate Pro entitlement are deployed.
- Site posts, comments, member directory and event pages exist.
- Database snapshot: 14 posts, 0 comments, 1 future event, 2 summaries,
  7 accounts with community access, 0 personalized job alerts, 0 welcome timestamps.
  These counts do not establish organic participation or email delivery.
- Welcome dispatch on admission/community entry was added in commit `4b954b0`;
  inbox delivery and a complete new-account journey remain unverified.
- Thematic agents call OpenRouter with the question and a topic prompt.
  They do not load member profile, past turns, posts, WhatsApp or Dev sources.
- Work has job matching, CV generation and career assistance code. No live Club
  job alerts existed at audit time; validate with an opted-in complete profile.
- Dev publishes OpenCLM documentation and source links; no agent connector exists.
- Regional leader management code exists; it is not evidence of an operating
  regional network. No installable app manifest/service worker was found.

## Required before opening the community broadly

1. Exercise signup → email confirmation → required profile → community → WhatsApp
   with an authorized real test account. Confirm mailbox delivery; a provider
   acceptance response alone is insufficient. Verify repeat login and recovery.
2. Add a password recovery entry point. Repair or remove inactive navigation:
   search, messages, profile menu and post menu. Keep the first visit simple.
3. Give the community owner practical moderation: remove inappropriate content,
   suspend access, handle reports and review rejected profiles. Publish clear
   participation rules and explain profile visibility and data handling.
4. Verify mobile posting/commenting, membership permissions and no Pro privilege
   escalation. Make errors actionable. Prepare a welcome post and an explicit
   first activity; do not fabricate member activity or events.

## Minimum sellable Pro

1. One private assistant experience per member: stored conversation history,
   editable preferences/memory, topic follows and enforced account isolation.
2. Ground answers in permitted content and provide source links. Connect site
   conversations first; import only the authorized Club WhatsApp groups with
   clear participant notice. Never ingest unrelated private chats.
3. Return concrete actions: summarize missed discussions, surface relevant Work
   vacancies, point to OpenCLM resources in Dev. Respect each source's permissions.
4. Define price, period, usage allowance and how access is activated/revoked.
   Implement a working purchase path; manual PIX is an available existing pattern
   if selected, but the old R$199 founder price is not a current decision.
5. Add usage accounting, spending caps, rate limits, failure handling, support and
   cancellation/access rules. Test on real authorized cases before selling.

## Suggested release order

- First: reliable community entry and basic moderation, so initial members can
  start participating while the personal agent is completed.
- Next: private Pro pilot with bounded usage and clear beta scope.
- Paid release: after purchase/activation, useful source-backed assistant results
  and support/cancellation have all been exercised end to end.
- Native apps and regional expansion do not block this initial release. A mobile
  web experience is sufficient if the published copy accurately describes it.

## Open decisions

- Open free community first with a Pro pilot, or wait for a sellable Pro?
- Pro price, billing period and usage allowance.
- Whether the first assistant release includes WhatsApp ingestion or starts with
  website content plus Work/Dev. The public promise must match the chosen scope.

## Atualização — primeira oferta Pro por PIX

Implementados checkout com comprovante privado, administração de preço/período,
aprovação manual e expiração independente da comunidade. Agente pessoal com
histórico, preferências, fontes do Club/Work/OpenCLM e limite de 30 perguntas/dia.
Os itens anteriores são o diagnóstico anterior a esta implementação.

Preço e período ainda não definidos pelo Leon; oferta permanece inativa.
WhatsApp automático, aplicativo próprio e email de ativação não fazem parte
desta primeira entrega. Recebimento das boas-vindas na caixa do Leon segue
sem confirmação.

### Verificação publicada — 16/09/2026

- Aplicação `5b988bd`, deploy Cloudflare `35150664320` concluído com sucesso.
- 225 testes Vitest aprovados; build Next/OpenNext e typecheck aprovados.
- Conta temporária confirmou login, contexto persistido, resposta real do
  OpenRouter sobre OpenCLM com fonte, histórico após recarga e cota 1/30.
- Exclusão do histórico manteve a cota. API sem login retornou 401; conta sem
  Pro retornou 403. Administração redirecionou usuário não autorizado.
- Checkout móvel sem transbordamento; pedido privado de teste mostrou a chave
  PIX correta e rejeitou arquivo com extensão PDF e conteúdo inválido.
- Aprovação, isolamento, concorrência e cota passaram no teste SQL com rollback.
  Um PIX real, upload válido no Storage e aprovação pela tela administrativa
  ainda não foram exercitados ponta a ponta; não houve pagamento de teste.
- Conta, sessões, pedido e uso temporários removidos; bucket de recibos vazio.
- Oferta permanece inativa, sem preço e período. Não anunciar vendas abertas
  até Leon defini-los e a oferta ser ativada.
