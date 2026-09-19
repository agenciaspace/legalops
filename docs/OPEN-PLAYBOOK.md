# Open Playbook

Members edit at https://legalops.club/community/tools/playbook. Public reading is https://legalops.dev/playbook/.

The Playbook reuses MapWorkspace, Tiptap, private version-scoped Hocuspocus rooms, text comments, mentions, partial proposal review and revision history. It uses the existing membership RLS and lead-only publication RPCs. It does not require Pro or a GitHub account. No GitHub API, issue, pull request, build or deployment is involved in editing, reviewing or publishing content.

Five initial sections provide construction prompts, not approved contractual positions: context, negotiation positions, alternatives/limits, approvals and maintenance. Add topics as headings and tables inside these editable documents. `contract_map_sections.journey=open-playbook` scopes reads, and the section IDs have a `playbook-` prefix. CLM and Playbook use the same explicitly assigned editorial leads. Only lead publication changes the public version; suggestions and synchronized drafts remain private to active members.

GET `/api/playbook` selects only published fields using the anonymous client's RLS. The Dev page fetches live content on load and every 30 seconds while visible, supports JSON export, and explicitly reports fetch failures. It never substitutes an old static library. Old browser-only drafts remain in localStorage and can be downloaded from a recovery section on their original origin. They are never uploaded automatically.

Initial source is `lib/open-playbook.json`; the seed migration runs once. Subsequent editorial changes are database records and never overwritten by application deployments. The former open-playbook repository is historical source, not the canonical content store or runtime frontend.

## Verification and rollout (2026-09-18 BRT)

Shared API tests and the remote rollback transaction in `supabase/tests/playbook_access.sql` cover anonymous published reads, private proposal denial, member suggestion, lead-only acceptance, history and stale version rejection. Browser preview checks the actual shared editor against an isolated collaboration server, publication payloads and responsive layouts at 320/390/768/1280 pixels. Application, Pages and collaboration CI passed for `55cf3f7`. Production `/api/playbook` and `/playbook/` were checked: five initial published sections, working editor links and no GitHub contribution link.
