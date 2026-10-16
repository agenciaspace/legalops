# legalops.chat

An organization workspace that provisions four specialists for contract review:
intake → contracts → policies → coordination. This is a working pilot inside the
shared LegalOps application; it does not provision a standalone OpenClaw process
per organization or train/fine-tune a model.

## Entry points

- Public landing: `/chat`; the `legalops.chat` host rewrites `/` to this route.
- Workspace and onboarding: `/chat/workspace`.
- Dedicated account entry: `/chat/entrar`. Uses the shared Supabase identity;
  Chat access does not require Club admission, photo, Pro or career onboarding.
- `/api/chat/[...path]` authenticates every operation, checks confirmed email,
  validates the browser origin on mutations and returns `private, no-store`.
- `/api/cron/chat` requires `CRON_SECRET`; the existing Cloudflare cron invokes
  it every minute. An open workspace can also advance its own authorized run.

The landing links to `https://legalops.club/chat/workspace`, keeping auth on the
existing verified domain while the newly registered hostname is connected.
At implementation time `legalops.chat` still used the registrar's nameservers
and parking IPs. Do not claim the custom domain is live until HTTPS is verified.

## Data and permissions

The `chat_*` tables are separate from Club personal-agent history. Every table
has RLS; authenticated clients receive SELECT only. Mutations pass through the
server and service-role-only transaction functions with an actor derived from
`auth.getUser()`. Private-schema predicates resolve caller membership without
policy recursion. The service-only confirmed-email predicate reads Auth without
granting the service role general access to `auth.users`.

Workspace owners configure agent missions, manage the shared document base and
invite members. Every member can open private matters or matters visible to the
whole workspace. A private matter, its messages, documents, runs and decisions
are visible only to its creator while they remain a member. Organization owners
do not automatically see other members' private matters.

Invitations are hashed, expire after seven days, can be accepted once, and require
the invited confirmed email. The administrator shares the link; no invitation
email is sent by this feature. Shared guidance requires an explicit owner action
and clearly warns that its text becomes organization-visible, including when
the originating matter is private.

## Imports and grounding

PDF text extraction uses pinned `unpdf`; DOCX extracts only `word/document.xml`
through pinned `fflate`, with a limit on the uncompressed XML. TXT/Markdown/CSV
must contain UTF-8 text. Limits: 8 MiB, 80 PDF pages, 120,000 extracted characters,
40 documents per workspace, 12 selected documents per analysis. Scanned PDFs
require external OCR; this version does not perform it. Identical extracted
content in the same scope is rejected.

Original files live in the private `chat-documents` Storage bucket without browser
policies. The API authorizes the document using the caller's RLS and issues a
60-second download link. Removing an imported document removes it from future
selection; completed analyses preserve their source snapshots in history.

Retrieval ranks overlapping 1,700-character passages using request terms and
includes at least one passage from every selected document. At most 20 passages
enter the run. Coverage is displayed explicitly; this is not an exhaustive
contract review. Citations must identify an included passage and contain a
literal quote checked by server code. Unsupported source IDs and invented
quotes invalidate the step. Uncited suggestions are visibly identified.

## Durable execution and learning

Postgres owns the ordered step queue. `FOR UPDATE SKIP LOCKED` claims a step;
90-second leases and fresh fencing tokens prevent stale workers from committing.
Each step has up to three attempts. Cron recovers exhausted interrupted leases.
The browser is not required to remain open. A run's input snapshot includes
agent missions, selected passages, recent matter messages, recent human decisions
and approved workspace guidance.

The default model is `openai/gpt-4.1-mini`, overridable with server-side
`CHAT_MODEL`. Uses the existing OpenRouter client, `data_collection=deny` and
`zdr=true`; passage content still goes to an external AI provider. Consent is
required before starting a run. Model, token counts and reported provider cost
are saved per step, including retries whose usage was returned.

Limits are transactional: three owned workspaces per account and five analysis
runs per workspace per UTC day (reset at 21:00 São Paulo). These are pilot
limits, not Club Pro prices or credits. There is no billing offer for Chat.

The fourth agent ends at `review`. Only a human decision can conclude the run
or request changes. Only an explicit owner choice promotes the decision note
to shared guidance. Removing guidance affects future runs and preserves past
decisions. Additional messages and document selections support subsequent runs.

## Verification and deployment

```sh
npm test
python3 scripts/check-bend.py
npm run build:cloudflare
node scripts/verify-public-auth-build.mjs
npx playwright test --config playwright.chat.config.ts
```

`supabase/tests/chat_access.sql` uses rollback-only fixtures against actual roles
to verify tenant and private-matter isolation, grants, sources, ordered claims,
lease fencing, human decisions and email-bound invitations. Apply timestamped
migrations before deploying the new routes. Migration filenames match the
versions recorded by the connected Supabase migration tool.

The optional real-provider browser story uses synthetic identities/documents:
`CHAT_E2E_REAL=1` plus either configured server credentials or a separately
prepared `CHAT_QA_FIXTURE` JSON containing `email`, `teammateEmail`, `password`
and `users`. The prepared-fixture mode never retrieves production secrets;
the operator must remove its scoped database fixtures afterward. Do not commit
this file, credentials, browser traces, generated auth state or user documents.
`CHAT_BASE_URL` selects an HTTPS deployment or remote preview. The local dev
test proxy can use `CHAT_PREVIEW_ORIGIN=https://legalops.work`: the test harness
forwards API calls through its request client to match Wrangler's upstream HTTPS
origin. This does not change application CSRF checks.
The local dev
preview uses `.next-chat-dev` to avoid colliding with the production build.

Publish through the repository's existing GitHub → Cloudflare deployment.
No external email, signature, calendar, litigation feed or CLM connector is
implemented by this pilot. The landing describes these limits explicitly.
