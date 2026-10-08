# CLOC → legalops.work

The independent VPS timer reads the existing instance mirror in read-only mode
every five minutes. It scans a rolling 30-day window for every configured group
whose name contains CLOC, including disabled *summary* groups. It never calls
Uazapi, sends WhatsApp messages, or restarts a gateway.

URLs are normalized and deduplicated in `/var/lib/legalops-cloc-jobs/queue.db`.
The private `sources` table links each URL to all original group/message IDs.
No author names, phone numbers or message bodies are copied into this database
or sent to the Work endpoint. Bare ATS/LinkedIn links are included; other links
are included only when the message has a recruiting keyword. Media-only and
no-link candidates remain local `pending` items, not published jobs.

`POST /api/cron/whatsapp-jobs` uses the existing
`WHATSAPP_SUMMARY_INGEST_SECRET` VPS credential. It accepts one URL on an
explicit recruiting-host allowlist. The existing scraper verifies the public
application page. OpenRouter extracts only public-page fields, with verbatim
evidence checks for title/company/location and existing Legal Ops/Brazil
eligibility, live URL and logo requirements. Published records have completed
enrichment and appear immediately in Work Discover. Existing URL records are
reused; a database unique constraint handles concurrent discoveries. Regular
Work cron continues revalidation and job alerts.

Network/provider failures retry with exponential backoff capped at one day.
Ambiguous/unsupported content remains `pending` for review, closed pages are
`closed`, and confirmed imports become `published` or `duplicate`. Pending
does not mean an employment opportunity was confirmed (e.g. event invitations
may mention vagas). A failed timer run must not be reported as a successful
import. `status.json` and journald contain counters only.

## Install after deploying the endpoint

```sh
install -d -m 700 /opt/legalops-cloc-jobs /var/lib/legalops-cloc-jobs
install -m 700 automation/cloc-jobs/runner.py /opt/legalops-cloc-jobs/runner.py
install -m 644 automation/cloc-jobs/legalops-cloc-jobs.{service,timer} /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now legalops-cloc-jobs.timer
systemctl start legalops-cloc-jobs.service
```

Configuration defaults to the existing root-only
`/root/.config/legalops-whatsapp-summary.env` (`APP_URL`, `INGEST_SECRET`).
Run `python3 automation/cloc-jobs/runner.py --collect-only` to populate the
queue without publishing. `--state-dir` selects an isolated queue for testing.
Read `status.json`, inspect queue status/reason and source message references,
or use `journalctl -u legalops-cloc-jobs.service` for operations. To retry a
reviewed pending URL, change only that item's state to `queued,next_attempt=0`.
Stop the timer to pause ingestion; do not stop the WhatsApp gateway.

## Verification

```sh
python3 -m unittest discover -s automation/cloc-jobs -v
npx vitest run __tests__/whatsapp-jobs.test.ts
```

Tests cover duplicate forwards, scope/owner/deleted-message filters, late
arrivals, URL-only posts, no-link retention, retry recovery, unauthorized
requests, unsafe hosts and evidence-backed publication.

## Production verification — 2026-10-08

- Cloudflare application deployed at `cf964d5`; authentication checks returned
  401 for missing/invalid credentials and successful responses for the VPS.
- Initial 30-day scan: 13 configured groups, 36 unique candidate URLs; three
  verified jobs published, two closed, nine requiring review, 22 retryable.
  Another 111 local candidates were media/no-link references, not confirmed jobs.
- Reposting a published URL returned `duplicate` and the same stored job UUID.
- Gupy job 12611433 (Inspira) was verified live from its public Next.js payload;
  closure translations no longer cause false expiration.
- Build, deployment and public smoke steps succeeded in GitHub run 37790310289.
  Only the final status-file commit conflicted with the preceding run; the
  deployment status file was reconciled separately from the verified results.
