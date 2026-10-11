# Event summary access and generation (2026-10-11)

Production privacy fix: `8ab8a72`; historical-recovery endpoint: `14faf9e`.
Both deployed successfully through GitHub Actions to the legalops-app Worker.

- Event descriptions remain public. WhatsApp summary titles, bodies and key points require a real signed-in account; Club Pro is not required.
- `community_event_whatsapp_summaries` has RLS enabled, no anonymous table grant, and a signed-in policy restricted to published events. Anonymous Supabase Auth users are also denied.
- The server uses the viewer's Supabase session. The public landing never queries summary content and links to login with the event as the return destination.
- Data failures display a retry notice instead of pretending no summary has ever been published.
- The installed VPS runner isolates agenda synchronization, comment delivery and summary stages. No gateway was restarted or reconfigured.

Production verification: anonymous HTML and RSC responses on legalops.club and legalops.work show the login link and no summary articles. Anonymous/invalid-token REST requests return 401. Rollback-only SQL tests read all four existing summaries under a signed-in role, and zero under an anonymous-auth JWT.

Generation diagnosis: the archive last published on October 7. Agenda synchronization failed before summaries could run. After isolating stages, the October 10 window was correctly recorded as empty and the next edition advanced to October 11 at 18:00 Brasília. Real generation requests return OpenRouter HTTP 402 (credit/quota); this is not an authorization failure in the archive.

The protected endpoint supports recovering previous fixed 24-hour event windows with `action: backfill` (31-day limit). Recovery preserves original dates, does not rewind the current schedule and does not send WhatsApp messages. Missing October 8 and 9 editions remain pending generation.

## Prepared fallback — not activated

Branch `fix/summary-local-fallback` prepares a single Claude CLI retry when OpenRouter returns HTTP 402. Claude subscription authentication and a harmless JSON-only call were verified. No group messages have been sent to this fallback.

Activation awaits Leon's choice: keep OpenRouter's existing ZDR/data-collection-deny route and replenish credit, or use the existing Claude subscription under its own data terms. The fallback is not equivalent to OpenRouter ZDR. Do not deploy this branch or install its runner before that choice.
