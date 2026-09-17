# Club verification — 2026-09-17

Implementation: `c45c9badbc6cb144e2409ffac2c96fe14d2a3d9e`.

## Shipped

- Public CLM assessment: 32 criteria, company context, six decision stages,
  evidence coverage, veto requirements, local scenarios and export.
  Canonical MIT repository: https://github.com/agenciaspace/clm-bench.
  Public deployment: https://legalops.dev/bench/.
- Contributions accept private contact information and enter moderation;
  only explicitly approved public copies appear in the public feed.
- Club navigation separates Posts, Bench and Pro. Responsive Bench links
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

## Limits

PWA verification used Chromium emulation, not installation on a physical phone.
Posts, agent responses and submissions require a connection. The model uses
saved preferences plus eight recent turns; displaying older history does not
expand that model context. Original vendor scores remain editorial hypotheses;
unassessed criteria stay empty rather than implying evidence.
