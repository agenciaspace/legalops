# LegalOps internal agent guide

This repository contains the shared product code and database migrations for
`legalops.work`, `legalops.club`, and part of the `legalops.dev` ecosystem.
Read this file before changing routes, middleware, migrations, or deployment
configuration.

## Product map

| Domain | Role | Current serving path |
|---|---|---|
| `legalops.work` | Jobs, career profile, application pipeline, employer intake | Next.js App Router on Cloudflare Workers via OpenNext |
| `legalops.club` | Community preview, paid community, member directory, events and job alerts | Same `legalops-app` Worker; host-aware `/` rewrites to `/club` |
| `legalops.dev` | Technical content, builds and guides | Static Cloudflare Pages-style site from `cloudflare-landing/` |

The three domains are one brand ecosystem, not three independent codebases:

- `club` is community and connection.
- `work` is opportunities and career.
- `dev` is practical building, systems and experiments.

Use `docs/BRAND-LANGUAGE.md` for shared naming, typography, color and copy
rules. Keep all product names lowercase.

## Runtime architecture

```text
Browser
  |
  +-- legalops.work --------------------------+
  |                                           |
  +-- legalops.club --------------------------+--> Cloudflare Workers
  |       root / -> internal /club            |      (OpenNext Next.js app)
  |                                           |
  +-- legalops.dev -> static Cloudflare Pages |      Next API routes
                                              |             |
                                              +------> Supabase Auth/Postgres
                                                            |
                     Firecrawl + ATS APIs <-----------------+
                     Kimi/Moonshot, Brevo, LinkedIn fetch
```

### Shared Next.js application

- Stack: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Vitest.
- `app/page.tsx` is host-aware: normal hosts render the Work landing; the
  `legalops.dev` host renders the course landing when the request reaches the
  Next app. The currently public `legalops.dev` landing is the static site in
  `cloudflare-landing/`, so do not assume changes to `app/page.tsx` change the
  public Dev site.
- `middleware.ts` owns host routing, Supabase session refresh, authentication
  redirects, onboarding redirects and Club access enforcement.
- `app/(main)/layout.tsx` is the authenticated application shell. It loads the
  user's pipeline, discover count and unread Club alert count.
- `lib/supabase.ts` is the browser client. `lib/supabase-server.ts` is the
  cookie-aware server client. `lib/supabase-admin.ts` uses the service role and
  is server-only.

### Cloudflare application Worker

`wrangler.jsonc` and `open-next.config.ts` define the `legalops-app` Worker.
OpenNext bundles the full Next.js App Router, server components, route
handlers and middleware into `.open-next/worker.js`.

- `legalops.work/*` and `www.legalops.work/*` use Cloudflare Worker routes.
- `legalops.club`, `www.legalops.club` and `legalops.legalops.club` use Worker
  custom domains.
- Host-aware routing in `middleware.ts` rewrites the Club root to `/club`.
- `legalops.dev` remains the static Cloudflare Pages project in
  `cloudflare-landing/`.

Do not reintroduce a Vercel upstream. Authenticated Club routes remain under
`/community`.

### Dev static site

`cloudflare-landing/` is a self-contained static site. Its main entry point is
`index.html`; the WhatsApp build is under `agentewhatsapp/` with eight steps
and a guide. `_redirects` and `_headers` are Cloudflare Pages behavior. The
static Dev site has no Supabase session, API route or server-side data access.

The Next routes `/curso-ia-whatsapp` and the `CourseLandingPage` component are
an application-side course landing and should be treated as a separate/legacy
entry point unless deployment configuration explicitly connects them to
`legalops.dev`.

## Route boundaries

### Public routes

The middleware public allowlist currently includes:

`/`, `/club`, `/club/about`, `/en`, `/login`, `/manifesto`, `/pricing`,
`/for-employers`, `/curso-ia-whatsapp`, and `/auth/confirm`.

### Work application

- `/dashboard`: career and pipeline overview.
- `/discover`: verified, enriched jobs not yet in the user's pipeline.
- `/pipeline`: Kanban-style application tracking.
- `/jobs/[id]`: job detail plus leader, notes, contacts and events.
- `/professionals`: public professional directory according to RLS.
- `/emails`: aliases and application email messages.
- `/onboard`: profile completion gate.
- `/for-employers/jobs/new`: authenticated employer job request intake.

### Club application

- `/community`: public preview plus paid community entry point.
- `/community/profile`: member profile and job-alert preferences.
- `/community/members`: member directory.
- `/community/jobs`: matched job alerts.
- `/community/calendar`: paid events.
- `/community/summaries`: paid weekly discussion summaries.
- `/community/about`: Club explanation.

`middleware.ts` treats `/community/*` as paid-only. Active access means
`club_access_status` is `active` or `complimentary`, and the optional expiry is
still in the future. Never rely only on UI gating; preserve the Supabase RLS
policies and server-side checks in `lib/community.ts` and Club actions.

### API and automation routes

- `/api/cron/scrape`: protected by `Authorization: Bearer CRON_SECRET`; runs
  discovery, reconciliation, enrichment, leader backfill and Club alerts.
- `/api/cron/community-summary`: protected by the same bearer secret; creates
  the weekly discussion summary.
- `/api/pipeline/**`: pipeline status, notes, contacts, events and leader data.
- `/api/ai/interview-prep` and `/api/ai/cover-letter`: authenticated Kimi-backed
  career assistance.
- `/api/profile/**`: profile and LinkedIn insights.
- `/api/email-aliases/**` and `/api/email-messages`: authenticated email
  aliases, outbound Cloudflare mail and stored messages.
- `/api/admin/invitations`: admin-only Club invitations through Supabase Auth;
  admins are defined by `LEGALOPS_ADMIN_EMAILS` and invitations receive
  `complimentary` Club access.
- `/api/webhooks/cloudflare/inbound`: protected by
  `CLOUDFLARE_EMAIL_WEBHOOK_TOKEN`; maps inbound recipients to aliases and
  stores received messages.
- `/api/webhooks/brevo/inbound`: retained only as a legacy compatibility path.
- `/api/dashboard`, `/api/jobs/undiscovered` and other route-local endpoints
  are server-side Supabase reads/writes.

The middleware matcher intentionally excludes `/api/cron` from normal auth
middleware. Cron routes must therefore enforce their own bearer secret.

## Data architecture

Supabase is the shared authentication and PostgreSQL system. Row Level
Security is part of the application boundary, not optional hardening.

### Active Work data

- `jobs`: system-wide discovered jobs; unique URL; written by service role;
  authenticated read access.
- `crawler_runs`: scrape and enrichment run history.
- `user_pipeline_entries`: user-owned job pipeline, unique per user/job.
- `leaders`: suggested or confirmed contacts for a pipeline entry.
- `job_notes`, `contacts`, `application_events`: user-owned application context.
- `ignored_jobs`: jobs hidden by a user.
- `account_profiles`: identity, career profile, onboarding and preferences.

### Active Club data

- `community_members`: Club access, cohort/plan, profile and verification
  fields; synchronized from `account_profiles` by database trigger.
- `community_posts`, `community_comments`, `community_post_likes`: discussion
  data with public preview and paid-member policies.
- `community_events`: published paid events.
- `community_discussion_summaries`: weekly summaries visible to active members.
- `club_job_alerts`: profile-to-job matches generated by the scraper flow.
- `employer_job_requests`: employer-submitted job requests.

The migrations also contain `community_courses`, `community_modules` and
`community_lessons`. The paid-launch migration revokes their read access and
states that the Club currently has no classes; treat them as retained legacy
schema, not an active Club surface.

### Email data

- `email_domains`: configured alias domains.
- `user_email_aliases`: per-user aliases, usually on `reply.legalops.work`.
- `email_messages`: inbound and outbound message history.

Cloudflare Email Service is the current provider. Outbound application mail
uses its REST API; Supabase Auth uses its authenticated SMTP endpoint; inbound
aliases use a Cloudflare Email Routing Worker and the Cloudflare webhook route.
Default sender/reply identities are `hello@mail.legalops.work` and
`reply.legalops.work`. Brevo helpers remain only for migration compatibility.

### Planned or legacy marketplace schema

`companies`, `company_accounts`, `job_posts`, `candidate_matches` and
`subscriptions` exist in `011_marketplace_tables.sql`, but current route/lib
references do not establish them as an active product flow. Do not present
them as implemented without adding and verifying the corresponding server
paths, policies and billing integration.

## Background flows

### Job discovery and enrichment

`cloudflare/legalops-cron.js` runs `/api/cron/scrape` daily at `0 10 * * *`
(07:00 BRT) and `/api/cron/community-summary` Sundays at `0 21 * * SUN`
(18:00 BRT).

1. Firecrawl Agent performs broad discovery with `FIRECRAWL_API_KEY`.
2. Deterministic public ATS APIs run in parallel for Greenhouse, Lever,
   Workable and Gupy slugs from `lib/scraper.ts` or environment overrides.
3. URLs are canonicalized and deduplicated.
4. Jobs are fetched again to verify the application page and classify URL
   status as `live`, `dead` or `unknown`.
5. Eligibility filters require a Legal Ops title and Brazil/LATAM eligibility.
6. Kimi enriches pending jobs with salary, benefits, remote reality and other
   structured fields; failures retry until the attempt limit.
7. Public leader research backfills a suggested Legal Ops leader.
8. Club job alerts are generated for active members who enabled them.
9. A `crawler_runs` row records counts, provider status and errors.

Never make a provider outage expire the whole feed. The current scraper only
expires unseen jobs when Firecrawl returned a non-empty successful result.

### Weekly Club summary

`/api/cron/community-summary` runs Sundays at `0 21 * * 0` (18:00 BRT). It
loads posts/comments from the previous UTC week, asks Kimi for strict JSON,
falls back to an extractive summary on AI failure, and upserts one summary per
category and period.

## External services and secrets

| Service | Code surface | Required configuration |
|---|---|---|
| Supabase | Auth, PostgreSQL, RLS | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server-only `SUPABASE_SERVICE_ROLE_KEY` |
| Kimi/Moonshot | Work enrichment, leader and career AI | `KIMI_API_KEY`, optional `KIMI_MODEL` |
| OpenCode Go | Club summaries and subtopic agents | `OPENCODE_GO_API_KEY`, optional `OPENCODE_GO_MODEL` |
| Firecrawl | broad job discovery | `FIRECRAWL_API_KEY` |
| Cloudflare Email Service | transactional/inbound email | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN`, sender settings, `CLOUDFLARE_EMAIL_WEBHOOK_TOKEN` |
| Cloudflare Workers | Next app, cron, inbound email | Worker configuration and secrets |
| Cloudflare Pages | Static Dev site | `legalops-dev` project configuration |

Use `.env.local.example` as the variable inventory. Never expose service-role,
provider or webhook secrets to client components or commit them.

## Source-of-truth rules

- Current executable code and migrations take precedence over old design docs.
  In particular, the old CRM spec mentions Anthropic; current code uses Kimi.
- Add new database changes as a new timestamped migration. Do not rewrite an
  already-applied migration.
- Preserve RLS when adding tables or changing policies. Test both anonymous,
  authenticated and active-Club-member behavior where applicable.
- Keep domain routing explicit. Test the intended `Host` for any host-aware
  change; local `localhost` normally behaves as Work.
- Use `BrandLogo`/`BrandMark` from `components/BrandLogo.tsx`; do not recreate
  the wordmark with text or generic icons.
- Keep static Dev changes inside `cloudflare-landing/` unless the requested
  behavior explicitly belongs to the Next application.

## Development and verification

Run from the repository root:

```bash
npm test
npm run build
npm run dev
```

For focused work, run the relevant Vitest files in `__tests__/` and inspect
both the server route and its RLS/migration assumptions. Before changing a
cron route, test the missing and incorrect bearer secret cases. Before changing
Club access, test anonymous preview, authenticated inactive users and active
members.

## Deployment policy

- App changes deploy through `npm run deploy:cloudflare` using `wrangler.jsonc`.
- Cron changes deploy through `npx wrangler deploy --config cloudflare/legalops-cron.wrangler.jsonc`.
- Inbound email changes deploy through
  `npx wrangler deploy --config cloudflare/email-inbound.wrangler.jsonc`.
- Changes to `cloudflare-landing/` deploy through the Cloudflare Pages project.
- Changes to `cloudflare-landing/` require the configured Cloudflare Pages
  deployment, not only a Vercel deployment.
- After deployment, verify the affected public domain and the relevant auth,
  paid-access, cron or webhook flow.
- Commit only files belonging to the current task and preserve unrelated
  worktree changes.
