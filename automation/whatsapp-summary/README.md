# Daily community WhatsApp summary

One authorized destination: `legalops.club · conversa` (`120363427485795268@g.us`).
The independent systemd runner reads only that group's messages from the existing personal
instance SQLite mirror. It does not change gateway processes or legacy summary flags.

Every day at 21:00 UTC (18:00 Brasília), publish the previous **fixed 24-hour period** to
`club_whatsapp_summaries`, then send the same digest to the group. First window ends
2026-09-18 at 21:00 UTC. Empty windows produce no WhatsApp notification. The 5-minute timer
only retries unfinished work; persisted period state and the unique database period prevent
repeated daily editions. If a send times out, reconcile the exact message in the inbound
mirror instead of blindly resending. Unknown delivery outcomes require local investigation.

The Worker accepts only a dedicated bearer secret, strips the raw messages from its stored
record and generates through the existing OpenRouter ZDR configuration. Members (including
free active members) can read the digest and the schedule; anonymous and inactive accounts
cannot. Legacy weekly forum summaries are separate and unchanged.

## Installation

- Install `runner.py` as `/opt/legalops-whatsapp-summary/runner.py` and the units in `/etc/systemd/system/`.
- Root-only `/root/.config/legalops-whatsapp-summary.env` contains `APP_URL`, `INGEST_SECRET`,
  `DATABASE`, `INSTANCE_ENV`, `STATE_DIR`, `FIRST_RUN_AT`. The secret must
  match Worker `WHATSAPP_SUMMARY_INGEST_SECRET`. Credentials are never committed.
- The source owner and destination are fixed in code; the configured instance owner and connection are verified before each send.
- Enable `legalops-whatsapp-summary.timer`, then set `club_whatsapp_summary_schedule.enabled=true`.
  Set enabled=false and stop the timer to pause. No gateway restart is needed.
- `python3 runner.py --preview` checks a rolling 24-hour generation without publishing or sending.
- `journalctl -u legalops-whatsapp-summary.service` contains status only, not conversation text.
- Run `python3 -m unittest discover -s automation/whatsapp-summary -v` from the repo root.

Deploy code through the normal GitHub → Cloudflare workflow. Reinstall the runner when it
changes. If a source exceeds the current API input bounds, fail locally instead of silently
omitting text. Media are counted but only text and available audio transcripts are summarized.
