# LegalOps Work — descoberta de vagas

O pipeline de `legalops.work` não depende de um crawler ou provedor único.

## Objetivo

Encontrar vagas de Legal Operations e áreas adjacentes relevantes para profissionais no Brasil/LATAM, validar que a oportunidade continua ativa e publicá-la rapidamente.

O enriquecimento é complementar. Uma vaga não precisa esperar IA, salário ou classificação avançada para aparecer na landing quando já foi descoberta por uma fonte atual, passou pelo filtro de elegibilidade e não está explicitamente encerrada.

## Fontes

### 1. ATS diretos

Executados em toda coleta:

- Greenhouse Job Board API;
- Lever Postings API;
- Workable quando configurado;
- Gupy quando configurado;
- Ashby Public Job Posting API.

As listas de boards podem ser ajustadas por:

- `LEGALOPS_GREENHOUSE_SLUGS`;
- `LEGALOPS_LEVER_SLUGS`;
- `LEGALOPS_WORKABLE_SLUGS`;
- `LEGALOPS_GUPY_SLUGS`;
- `LEGALOPS_ASHBY_BOARDS`.

### 2. Sites das empresas

`lib/job-discovery.ts` consulta páginas de carreira configuradas, tenta encontrar URLs de vagas no HTML e em `sitemap.xml` e extrai objetos estruturados `JobPosting` em JSON-LD.

Override opcional:

- `LEGALOPS_CAREER_SITES` — lista separada por vírgulas.

### 3. Jooble

Jooble serve como descoberta ampla complementar. A credencial `JOOBLE_API_KEY` fica no Supabase Vault e é lida apenas pelo backend via `service_role`.

A API não é chamada pelo navegador e a chave não deve ser colocada em `NEXT_PUBLIC_*` ou no repositório.

### 4. Adzuna

Integração opcional. Ativa automaticamente quando existem no Supabase Vault:

- `ADZUNA_APP_ID`;
- `ADZUNA_APP_KEY`.

Sem essas credenciais, a fonte retorna zero resultados sem interromper as demais.

## Falhas independentes

Todas as fontes rodam de forma independente. Falha ou timeout em uma fonte não cancela Greenhouse, Lever, Ashby, sites próprios ou agregadores que estejam funcionando.

`crawler_runs.notes` registra:

- quantidade encontrada por fonte;
- quais fontes concluíram;
- erros de cada fonte;
- vagas atualizadas e expiradas.

## Filtro

Antes de inserir, uma vaga precisa:

1. ter um título reconhecido como Legal Ops ou área operacional jurídica relacionada;
2. não ser estágio/internship;
3. indicar Brasil/LATAM ou aceitar candidatos deste mercado;
4. não ter uma página explicitamente encerrada.

## Publicação

As páginas originais de vagas no LinkedIn também podem ser publicadas. O
coletor exige uma URL `/jobs/view/` e título, descrição e empresa disponíveis
em `JobPosting` ou na página pública completa, com identificador correspondente
e botão de candidatura. Também verifica prazo e sinais de encerramento. Páginas
de busca e login não servem como comprovação de vaga ativa. A fonte aparece no
card; sites de empresas e ATS continuam aceitos.

A landing pública busca:

- `url_status = live`;
- `eligibility_status = eligible`.

`enrichment_status` não bloqueia publicação.

Isso permite que uma oportunidade apareça no Work logo após a coleta. Enriquecimento posterior pode adicionar salário, modelo de trabalho, benefícios e outros dados.

## Validação e expiração

O pipeline não assume que nenhum agregador possui um inventário completo do mercado.

Vagas encontradas novamente recebem `last_seen_at`. Vagas antigas que não apareceram na coleta são rechecadas diretamente pela URL em lotes. Apenas sinais explícitos de encerramento transformam a vaga em `dead`; falhas temporárias de rede permanecem `unknown`.

## Agendamento

O cron de descoberta é `/api/cron/scrape`, acionado pelo Worker
`legalops-cron` às 07h BRT, conforme `cloudflare/legalops-cron.wrangler.jsonc`.

O agendamento legado da Vercel foi desativado em 16/09/2026. Ele ainda executava
um deployment antigo, sem LinkedIn/Gupy Portal e sem a correção que diferencia
o texto de tradução “Inscrições encerradas” do status real de uma vaga Gupy.
Não reativar esse agendamento: ele sobrescrevia verificações do Worker atual.

A rotina normal deve rodar diariamente. Durante smoke tests, o horário pode ser temporariamente alterado e deve ser restaurado depois da validação.

A migração `20260916185243_allow_verified_linkedin_jobs.sql` alinha a constraint
do banco à validação do coletor: aceita páginas individuais `/jobs/view/` e
mantém o bloqueio de buscas, login e outros agregadores, com logo obrigatório.
Na correção de 16/09/2026, 21 anúncios elegíveis foram verificados e gravados,
e o catálogo passou de 3 para 24 vagas ativas. Duplicatas conhecidas de
KLA, Jusbrasil, LBCA e TOTVS foram descartadas dessa importação.
