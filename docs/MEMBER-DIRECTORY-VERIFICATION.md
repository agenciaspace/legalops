# Member directory and profile verification

Member directory: `/community/members`. Owner workflow: `/community/profile#verification`. Administrator queue: `/club/admin/members`.

## States and access

- `unverified`: no current approval, labeled “Validação não solicitada” to the owner and “Não validado” in the directory. Never imply a queued review.
- `pending`: an explicit request is in the administrator queue. Repeat submissions reuse the same pending request.
- `verified`: an administrator checked name, role, organization and LinkedIn. The badge does not certify skills or degrees.
- `rejected`: owner sees “Ajustes solicitados” and the private explanation, can edit and resubmit. The directory says “Não validado”.

Community and Pro entitlements are independent and are not changed by requesting or reviewing a profile. Existing profiles are not silently queued or automatically approved. At rollout, all nine member rows were `unverified`, despite the former directory labeling them as under review.

Requests store an immutable identity snapshot, date, decision, reviewer and reason. RLS allows only the owner to read their requests; configured administrators read via the server. Only the service role can call the atomic review RPC, and each server action checks the authenticated admin email before constructing that client. No approval flag is taken from editable user metadata. The request RPC uses authenticated identity and requires active Club access.

Changing name, role, organization or LinkedIn revokes a prior approval and supersedes pending requests. Both submission and review lock the profile before the member/request rows, so an outdated identity cannot be approved. Historical requests are preserved. Rejected moderation state is preserved across edits until the member explicitly resubmits. No review deadline or automatic verification is promised; the owner follows the result on their profile.

## Search and privacy

`search_club_members` is a security-invoker RPC, with membership checks and existing member/contact RLS. Results contain explicitly selected public fields, not account profiles or CV data. Search uses every term, ignoring common Portuguese/Spanish accents, and treats `%` and `_` literally. Filters combine country, state/region, city, professional environment, expertise, qualifications and verification. Saved-contact scope and filters survive pagination via query parameters. Pages contain at most 24 profiles; sorting is stable by normalized name and ID, or newest first.

`directory_country`, `directory_region`, `directory_city`, and `directory_qualifications` are optional, explicitly member-visible fields maintained in the profile. Private CVs, skills, job-location preferences and account timezone/country preferences are not copied into the directory. Professional environment mirrors the existing declared professional context. Missing location/qualification data is not guessed; owners can add it. Review reasons are never included in search results or facets.

## Verification

- Remote transaction `supabase/tests/member_directory_verification.sql`: accent-insensitive combined search; literal wildcard treatment; pagination; CV exclusion; anonymous/inactive denial; owner-only review records; request idempotency; self-approval denial; atomic administrator approval; unchanged entitlements; duplicate/stale review denial; identity-change invalidation; resubmission/history. Entire test rolls back.
- Vitest checks query normalization and links, accurate status labels, request/review authorization, owner next steps and localization.
- Production Next build passes. Browser preview with isolated fixtures verifies controls, search submission, pagination and no horizontal overflow at 320, 390, 768 and 1280 pixels. English controls checked. No real profile was approved or rejected during testing.
- Supabase advisors: the authenticated request RPC is intentionally security-definer with identity/membership checks. Search remains security-invoker; the service-only review RPC is not publicly executable. Existing unrelated advisories were not changed.
