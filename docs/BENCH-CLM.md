# Public CLM Bench

Public calculator: https://legalops.dev/bench/. Open source: https://github.com/agenciaspace/clm-bench (MIT). Presentation: `/bench/apresentacao`; PDF: `/bench/bench-clm.pdf`. Club event registration remains separate.

## Decision model

32 criteria in seven groups, all initially weighted 3. Six decision stages with 18 checklist items. Private diagnosis covers volume, legacy documents, legal/business users, contract types, languages/countries, existing tools and required integrations. Inventory count deduplicates comma/newline-separated names. The diagnosis guides manual weighting; there is no automatic inference.

Initial comparison: Ironclad and Luminance. Only the original four axes have editorial hypotheses: 5/5/4/4 and 2/2/5/5 respectively (workflow, Salesforce, playbook, repository). All other scores are null. Sources checked 2026-09-17 describe advertised features, not measured superiority. Scores remain editable.

`100 * sum(weight * score) / (5 * sum(weight))`. Zero weight excludes; zero score means does not meet. Null scores produce lower/upper bounds and weighted coverage, never a winner while eligible options lack evidence. Failed mandatory requirements veto; pending requirements prevent concluding the purchase. Close threshold: <5 points, an editorial convention. No invented prices, ROI, implementation dates or AI accuracy.

`framework.mjs` owns criterion questions, pilot tests and decision stages; `model.mjs` owns scoring/validation/report. Older four-axis share links remain compatible. Local storage preserves diagnosis and checklist. Share links omit these private fields; Markdown exports include them. Presentation remains two brief tool slides with native fullscreen/fallback.

## Community contribution service

Static page uses https://legalops.club/api/bench/contributions. Exact route is anonymous; moderation at `/club/admin/bench` requires the existing server admin-email allowlist. No public write to tables; no emails sent.

POST: consent, validated fields, HTTPS-only links, honeypot, bounded 20 KB JSON, explicit origin allowlist, HMAC network/email buckets (20/3 submissions per UTC day). Cloudflare supplies edge IP; raw IP is not saved. Successful submission is private and pending.

GET: 20 approved public copies/page, whitelist projection, no private contacts. Reports do not alter calculator scores automatically. Admin reviews edit the public copy, preserve original, record reviewer/decision/note, and support withdrawal. A database lock prevents duplicate reviews. Queue shows oldest 50 pending; publications list latest 50. Older withdrawals require database administration in this first release.

Migration `20260917162702_bench_contributions.sql` applied via Supabase integration, timestamp reconciled with remote history. Four tables have RLS, no anon/authenticated grants, and intentional no-policy denial. Three SECURITY INVOKER RPCs are service-role only. Advisors' informational no-policy notices are intentional; existing unrelated auth advisories remain unchanged.

## Open-source synchronization

The focused `clm-bench` repo contains the static module, framework, independent model tests, contribution docs/templates and optional backend adapter. Maintain a pinned revision in `docs/clm-bench-upstream.json` with its synchronization script. Backend reference files are reviewed separately; authentication helpers and middleware stay owned by this application. GitHub merge upstream does not automatically publish this site.

## Validation

251 application tests passed and Next production build passed on 2026-09-17. Database rollback test verified private intake, anon/authenticated grants, atomic daily limits, approval, duplicate review protection, withdrawal and audit; it left no fixture rows. Open-source model has eight independent Node tests.

Use relevant Bench Vitest tests plus full suite/build for changes to API/auth. Verify public browser CORS/POST and anonymous moderation redirect after deploying both existing GitHub workflows (Pages + application Worker). Keep test contributions private and delete only identified synthetic fixtures after smoke checks.
