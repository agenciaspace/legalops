# Migração de CLM

Public map: https://legalops.dev/mapa-contratos/
Member workspace: https://legalops.club/community/tools/mapa-contratos

The default journey has 12 stages in four phases, from internal diagnosis through procurement, migration, adoption and ongoing governance. Each stage includes five consideration groups, owners, deliverable, advance criteria and context adaptations. The original eight lifecycle sections remain available as an archive; their IDs, content, versions and contributions are preserved.

The integrated Tiptap editor supports suggestions and editorial review by section. It offers simultaneous cursors and private shared live drafts through Hocuspocus. Each submitted suggestion stores its base version. Publishing checks that version inside a locked database transaction, records a revision and accepts the suggestion atomically. A stale draft is retained in the browser and requires comparison with the current published version before resubmission.

Active community members can comment and suggest. Only active members listed in `contract_map_leads` can publish, accept, reject or resolve. Leon is the initial lead. Additional leads are explicitly assigned in this table by an administrator; never derive that privilege from editable user metadata. Pro is not required.

Public API: GET `/api/contract-map`; only approved sections and MIT license. Private API: `/api/community/contract-map`; membership required, authenticated Supabase client and RLS. Contributions and version history are not public. Both application and database validate the supported editor JSON. Rendering never uses user HTML. No external editor account is needed.

Canonical static source: agenciaspace/clm-bench `site/mapa-contratos`. Sync with its `scripts/sync-to-legalops.mjs` after committing upstream. The public page fetches approved content, exposes a current JSON download, and retains a labeled initial structure if fetching fails.

## Verification (2026-09-18)

- 334 automated tests passed; production Next build passed.
- Remote database transaction verified public reads, private comment protection, ordinary member publishing denial, lead acceptance with history, and stale version rejection. Transaction rolled back; no test contributions remained.
- Local browser preview at 390px and 1280px: editor loads without errors, proposal submission confirms success, review actions render; no page overflow. Preview data was isolated from production.
- Google login setup is separately documented in `auth/legalosp-google.md`; real OAuth validation is pending project/client configuration.

## Schema and content source

`lib/clm-migration.json` is synchronized from the public clm-bench repository. `contract_map_sections.journey` distinguishes the migration journey from the archived contract lifecycle. Public API returns only migration stages. Legacy deep links still open their archived sections. The original migration filename was aligned to its actual remote version `20260918030407` before adding the new journey, preserving replay order.
