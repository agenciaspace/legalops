# Community language preference

The Club supports `pt-BR` (default) and `en` through the `club-locale` cookie.
The selector persists for one year on the current device, uses SameSite=Lax,
and sets Secure on HTTPS. It contains no authentication or membership state.
Only allowlisted locale values are accepted.

The main community navigation, feed controls, events, Bench, Tools, event
photo gallery, upload controls and agent UI use `lib/club-locale.ts`.
Server components read the cookie per request; client components use
`ClubLanguageProvider`. Changing the selection refreshes server components.
Do not translate member-authored posts, names, event descriptions or previous
messages in place. The agent receives the selected response language for new
turns, retaining the same conversation and permissions.

Administrative pages, profile/contact forms and the independent legalops.dev
projects still have Portuguese copy. Add their reviewed translations to the
same dictionary when extending coverage; do not describe them as translated.

Verification: locale selection, cookie restoration, English navigation and
WhatsApp message, safe locale normalization and agent prompt are covered by
`club-language.test.tsx` and `club-agent-api.test.ts`.
