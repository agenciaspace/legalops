# Member directory and automatic profile completeness

Member directory: `/community/members`. Owner workflow: `/community/profile`.

## Status and admission

- `verified`: the owned photo and required professional fields are present. The UI calls this “Perfil completo”.
- `unverified`: at least one required field is missing. The UI calls this “Perfil incompleto”.
- `pending` and `rejected`: retained only for compatibility with historical rows; the migration normalizes current profiles automatically.

The badge is calculated by the database after every profile change. It is a
completeness signal for self-declared data, not identity proof or certification
of degrees or skills. The former administrator queue is retired and its records
remain only as audit history.

A private photo is required before `join_club` can activate free membership.
Active members cannot remove it without replacing it. Legacy members without a
photo keep access and, when they already have a real name, role and organization,
remain visible in the directory. Generic imported placeholder cards stay hidden
until configured. All incomplete active members receive a persistent
profile-completion reminder with a direct link to add the missing information.

Community and Pro entitlements remain independent from the badge.

## Search and privacy

`search_club_members` remains a security-invoker RPC with membership checks and
member/contact RLS. Results contain only explicitly selected public fields, never
private CV or job-preference data. Search is accent-insensitive, treats `%` and
`_` literally, and combines country, region, city, professional environment,
expertise, qualifications and completeness filters. Location and qualifications
remain optional and self-declared.

## Verification

- `supabase/tests/club_admission.sql` checks photo-gated admission, free/Pro separation and automatic completeness.
- `supabase/tests/member_directory_verification.sql` checks automatic status changes, keeps incomplete active members visible and confirms that the manual request RPC is no longer executable by members.
- Vitest covers the upload boundary, server-side admission check, member gate, labels and translations.
