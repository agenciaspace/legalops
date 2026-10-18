# legalops.news

The public editorial area and Club read the same `news_articles` records. Publishing
through `/community/news/manage` makes a story visible on both surfaces without
copying posts or maintaining a second archive. The newsroom is restricted to the
existing `LEGALOPS_ADMIN_EMAILS` allowlist.

## Reader experience

- Public site: `/news` on existing hosts, `/` on `legalops.news`.
- Public sections: `/escritorios`, `/departamentos-juridicos`, `/prestadores`.
- Club: `/community/news`, with full articles inside the authenticated shell.
- Profile and News preferences: opt-in to a digest on the personal community feed.
- Audience and topic filters combine with AND between dimensions and OR within
  each dimension. Empty selections mean all. New members start with delivery off.
- News is part of free Club membership, independent of Pro access and credits.

Article bodies use Markdown without raw HTML. Public reads use the publishable
Supabase key and published-only RLS. Drafts, candidates, preferences and email
addresses are never exposed through a public administrative client.

## Editorial operation

The daily `0 12 * * *` cron (09:00 São Paulo) calls `/api/cron/news-discovery`.
It uses the existing Firecrawl credential, searches the previous week across the
primary-source allowlist in `lib/news-discovery.ts`, normalizes URLs and inserts
unique candidates. Results remain private until an editor verifies sources,
writes the story and impact by audience, then publishes. Provider failures leave
existing published news untouched. Discovery uses one bounded search per run.

The initial four stories are sourced and reviewed launch content, recorded in
`data/news-launch.json` and a matching database migration. Production edits live
in Supabase. Changing the launch JSON does not overwrite editorial changes.

## Newsletter connection

`POST /api/news/subscribe` requires same-origin JSON, bounded input, explicit
newsletter consent, a valid email and Cloudflare's client-IP header. A private
server-only RPC deduplicates emails and enforces five submissions per IP hash per
hour. Neither the raw IP nor the newsletter email becomes part of a public record.
The form tells readers when it is recording interest before newsletter launch.

Configure Worker secrets:

- `BEEHIIV_API_KEY`
- `BEEHIIV_PUBLICATION_ID` (prefixed `pub_...`)

Create custom fields `legalops_audiences` and `legalops_topics` in beehiiv before
connecting if audience/subject segmentation is wanted. Its API discards unknown
custom fields. Domain authentication and the sending identity must be configured
in beehiiv before launching the edition. No beehiiv publication has been created
automatically by this change.

Every five minutes, the existing cron calls `/api/cron/news-subscriptions`.
With both credentials present, it claims up to five pending signups using database
leases, requests double opt-in confirmation and records provider acknowledgement.
The API never reactivates unsubscribed readers automatically. Provider failures
retry after an hour, at most five attempts. `sent_to_provider` means the provider
accepted the request; it does not claim the reader confirmed or received an email.
Without credentials, the queue stays pending and no outbound email is attempted.

This adapter synchronizes subscriptions, not newsletter editions. An editor
assembles and sends weekly editions in beehiiv; `/feed.xml` exposes the public
archive for downstream use. Club preferences and newsletter consent are separate.
Unsubscribe after activation is managed by beehiiv. Pending signup removal uses
the privacy contact and a scoped admin operation.

## Infrastructure and validation

Source remains in `agenciaspace/legalops`. The existing GitHub → Cloudflare
workflow builds the shared OpenNext application. Custom domains are declared in
`wrangler.jsonc`; route changes use `wrangler triggers deploy`, independently of
application version deployment. At implementation time the `legalops.news` zone
was pending, with assigned nameservers `cesar.ns.cloudflare.com` and
`val.ns.cloudflare.com`; the public Club `/news` path works while DNS changes.

Run `npm test`, `npm run build:cloudflare`, `npm run test:bend` and the rollback-only
`supabase/tests/news_access.sql`. Verify real public-key reads, member preference
ownership, draft/future invisibility, private newsletter records, cron auth, and
mobile widths. Email delivery is not verified until a beehiiv publication is
connected and a consenting test subscriber completes confirmation.

## Editorial identity — 2026-10-16

The public site has its own newspaper-style masthead, issue-date line,
searchable publication archive, topic filters and original geometric cover art.
The reference was the card-based archive at
https://thenewscc.beehiiv.com/archive?tags=AT+NIGHT; neither its yellow palette,
its photographs nor its publication branding were copied. News retains the
LegalOps cream/coral/ink palette, Quicksand/Inter and the shared wordmark.
Public article reads, source links, editorial permissions, Club integration and
newsletter consent retain their existing behavior. Existing articles remain
articles; no fictitious newsletter editions or subscriber counts were added.

The custom `legalops.news` and `www.legalops.news` hosts are attached to
`legalops-app`. HTTPS, homepage, article navigation and audience sections were
verified against the new Cloudflare DNS. During the transfer this VPS retained
old registrar DNS in its resolver; checking the authoritative Cloudflare IP with
normal TLS verification resolved that diagnostic mismatch.

## WhatsApp announcement publication outbox

Publishing a new article atomically adds one row to the private
`news_whatsapp_deliveries` outbox. Existing stories were not backfilled. Drafts
are never sent; edits and republishing do not create a second automatic attempt.
The existing minute cron calls `/api/cron/news-whatsapp` and claims at most two
public, due articles using `FOR UPDATE SKIP LOCKED`.

This connection stays disabled until these **specific instance** settings exist:

- `NEWS_WHATSAPP_ENABLED=true`
- `NEWS_WHATSAPP_INSTANCE_URL` (HTTPS URL for that instance)
- `NEWS_WHATSAPP_INSTANCE_TOKEN` (instance token, never account/admin token)
- `NEWS_WHATSAPP_GROUP_ID` (the legalops.news announcement group JID)

There is no fallback to another instance, Club group, phone number or recipient.
No instance is created, disconnected, logged out or restarted. Only public title,
summary and canonical article URL are sent to the configured announcement group.
Uazapi `/send/text` uses `track_source=legalops.news` and the outbox ID as
`track_id`; tracking fields are not a provider idempotency guarantee.

A provider receipt means **accepted**, not confirmed delivery/read. Timeout,
server failure, missing receipt or an interrupted `sending` row require manual
reconciliation using the tracking ID before any resend. They are never
reclaimed automatically, avoiding duplicate announcements after ambiguous sends.
`failed` rows also require an explicit operator retry after fixing the cause.
No real group, instance credentials or outbound messages were used in this change.

Run `supabase/tests/news_whatsapp.sql` as a rollback-only check of grants,
publication queuing, edit/republish deduplication and non-reclaimable attempts.

### Verified production release — 2026-10-16

- Application commit `a03d409`; GitHub Actions
  https://github.com/agenciaspace/legalops/actions/runs/38990577363 passed:
  652 unit/component checks, Bend proofs, 21 browser scenarios, OpenNext build,
  exact-version application deployment and cron deployment.
- Production `legalops.news` and `www.legalops.news` returned HTTPS 200 with the
  new editorial UI. Home, sourced article navigation, search and audience
  sections passed; 320/390/768/1440 px had no page overflow or browser errors.
  The cream background remained `rgb(245, 241, 232)`.
- The real database outbox suite passed in a rolled-back transaction. No test
  articles or outbox rows remained. Anonymous cron access returned 401.
- WhatsApp remains unconfigured/disabled. No real messages were sent. To enable,
  obtain the announcement-group invitation/JID and URL/ID/token for its specific
  Uazapi instance, verify that instance can post there, then set only the named
  News settings. Account/admin credentials are neither needed nor accepted.

## Public palette — 2026-10-18

At Leon's request, public News follows the current dark 404 Media palette:
black `#000000`, off-white `#FAFAFA`, lime `#91FC4E`, and neutral dark surfaces.
Reference: https://www.404media.co/ (computed browser colors, 2026-10-18).
Keep the existing Archivo Black wordmark, Space Grotesk headings, Inter body,
and monospace metadata. Color overrides are scoped to `.news-site`; the Club
reader and other LegalOps products retain their shared palette. Search, filters,
articles, sources and newsletter behavior remain unchanged.
