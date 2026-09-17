# Club verification — 2026-09-17

Implementation: `c45c9badbc6cb144e2409ffac2c96fe14d2a3d9e`.

## Shipped

- Public CLM assessment: 32 criteria, company context, six decision stages,
  evidence coverage, veto requirements, local scenarios and export.
  Canonical MIT repository: https://github.com/agenciaspace/clm-bench.
  Public deployment: https://legalops.dev/bench/.
- Contributions accept private contact information and enter moderation;
  only explicitly approved public copies appear in the public feed.
- Club navigation separates Posts, Events and Pro. Bench is a section inside Events; the previous `/community/bench` address redirects to `/community/calendar#bench`. Responsive Bench links
  assessment, presentation and contributions, with a separate real-event card.
- Member profile requests a photo and workplace description. Existing posts
  read current author photo, name, role, organization and description.
- Personal agent uses one continuous conversation with paginated older turns,
  persistent history, bottom composer, Enter/Shift+Enter and retryable failures.
- Installable Club PWA uses public icons and a generic offline fallback only.
- Scoped demo cleanup removed 14 seeded posts, three courses/12 lessons,
  three fictional events and two generated/seeded summaries. Real Nubank event,
  accounts, entitlements and offer configuration were preserved.
- Legacy Vercel configuration incorrectly expected Vite's `dist` after a
  successful Next.js build. Project framework is now Next.js; duplicate Git
  deployments are disabled in `vercel.json`. Cloudflare remains production.
  Old failed deployment records remain historical records.
- Worker/Pages status commits rebase and retry to avoid concurrent push failures.

## Evidence

- Next.js production build passed. Full suite: 268 passing tests in 41 files;
  an additional server-rendered author identity regression test passed afterward
  (269 tests total across the verified runs).
- Worker run [35250475578](https://github.com/agenciaspace/legalops/actions/runs/35250475578):
  build, application deploy, automation deploys, public routing smoke and status
  record all succeeded. Worker version `50e81f3c-c299-4e81-ab72-e37f0bbd4959`.
- Pages run [35250475523](https://github.com/agenciaspace/legalops/actions/runs/35250475523): succeeded.
- Browser checked at 320/390 px and desktop 1440 px: no horizontal overflow;
  mobile chat composer remains above the bottom navigation.
- Chromium reports no manifest or installability errors locally and on production.
  Service worker cache contains only offline HTML and three public icons.
  Stopping the local server showed the generic reconnect page.
- Production temporary member: normal login; PNG photo converted/uploaded to
  JPEG, rendered through authenticated endpoint; anonymous image request denied;
  workplace form saved and synchronized to member identity; real agent response
  saved, then restored as the same conversation after reopening.
- Photo removal returned 200 and storage metadata confirmed zero remaining
  fixture objects. Temporary account and conversation removed after validation.
- Public contribution form returned a protocol and pending status. Database
  confirmed zero publications for that submission; private fixture then deleted.
- Photo/description prominence on existing posts verified by rendering the real
  server page against isolated fixtures. No test post was sent to the community.

The final brand check also found `/icon.svg` redirecting anonymous visitors to
login. Its exact public route is now allowlisted and checked by deployment smoke
tests. The shared favicon uses the general LegalOps wordmark; community metadata
selects the Club icon.

## Limits

PWA verification used Chromium emulation, not installation on a physical phone.
Posts, agent responses and submissions require a connection. The model uses
saved preferences plus eight recent turns; displaying older history does not
expand that model context. Original vendor scores remain editorial hypotheses;
unassessed criteria stay empty rather than implying evidence.

## Events and expanded catalog update

- Events contains the Bench resources and meeting section; the featured Bench meeting is excluded from duplicate cards in Other meetings. PWA starts in Events.
- The public catalog covers all 239 G2 CLM category listings found across 16 pages, grouped by exact names, plus the original Luminance entry: 234 selectable options. It preserves source URLs and flags insufficient descriptions or adjacent scope. No G2 ratings become capability scores.
- Selection supports two to four tools, saves evaluations by ID, and keeps old shared scenarios compatible. Shared links exclude private company context and inactive evaluations.
- Verified locally at 390 px and 320 px: no page overflow, adding Icertis and Docusign, rejecting a fifth tool, and sharing four selected IDs without private fields. Standalone model/catalog suite: 13 passing tests.

Production verification for source `2a4dd4f`: Worker run `35253846090` and Pages run `35253846289` both succeeded. Authenticated browser confirmed Events → Bench, the legacy redirect, and responsive layout at 390/320 px. Chromium returned zero manifest and installability errors; PWA start URL is Events. Public catalog selection of four tools works. Final LegalOps suite: 272 tests in 43 files passed; standalone catalog/model: 13 passed. Temporary verification account, sessions and profile were deleted after checking, with zero matching rows remaining.

## Simplified experience and single agent

Feed limited initially to three recent publications; one publish action, collapsed filters, profile-only install help. Navigation is Community/Events, with one persistent agent bubble. Legacy subject agents and their server action were removed. The agent reads the authenticated user's posts, comments and likes, plus published events and sources, and explicitly does not claim read tracking. Pro API enforcement remains in place.

Seven imported generic member records are excluded from directory display without deleting their underlying real accounts. Six untouched, authorless Bench seed topics with no sessions/registrations were deleted by `20260917181904_remove_unstarted_seed_benches`; real Nubank event remains.

Bench keeps 234 catalog entries with no G2 UI/report references, three steps and one criteria group at a time. Method explanation uses everyday language. Open Playbook launched as a separate MIT repository with a three-field editor, local drafts, exports and explicit GitHub proposals; approved library intentionally empty.

Local build passed. 274 app tests passed before final copy/project links; standalone Bench 13 tests and Playbook 2 tests passed. Production checks recorded after deployment below.

Production verification of simplified experience (`2cdb9d8`, followed by demo-link/copy update `0acd786`): Worker and Pages deployments succeeded. At 390 px, authenticated browser confirmed Community/Events navigation, one agent bubble, collapsed Bench on Events, and legacy Bench redirect opening the section. Directory showed zero incomplete imported profiles. A real agent response summarized the empty activity history and the actual Nubank event; reopening restored the same conversation. Temporary account, sessions, profile, membership and conversation were removed; all four queried fixture counts returned zero. Six seed Bench topics also returned zero.

Public Bench and Open Playbook loaded at their production URLs without mobile page overflow. Bench shows three steps and no G2 text; Playbook starts with three fields. The OpenCLM page links the actual isolated demo, explicitly noting external-account setup is pending. OpenCLM source `1b6bc49` passed 45 tests plus PostgreSQL Compose install/health/seed in CI. Its live demo was tested through Cloudflare HTTPS (public DNS answers checked separately because this host's upstream resolver retained NXDOMAIN): login, creating a labeled example contract, mobile detail view and disabled unconfigured provider buttons.
