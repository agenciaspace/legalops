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
