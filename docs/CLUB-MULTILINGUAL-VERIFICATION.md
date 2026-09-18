# Multilingual verification — 2026-09-18

Implementation and database migrations complete. Generation and reading remain disabled until the production browser pilot below is verified.

- SQL transaction: anonymous private-cache read 0; public read 1; active free member read 1; revoked member read 0. Translated Unicode search matched. Edit cleared cache and incremented revision; stale completion applied 0 rows; deletion left 0 source rows. A USD 0.10 test budget permitted one lease and rejected the second. Fixtures rolled back.
- Unit coverage includes protected values, malformed results, provider failure, empty text, source revision/locale transitions, required cron secret and owner-only preferences.
- Branded Supabase SMTP subjects and bodies applied in pt-BR/en/es. Sender remains contato@legalops.club. Resend inbox delivery is not asserted from a sending-only key.
- Existing security advisor warnings were reviewed. Translation run ledger intentionally has RLS with no client policies and no client grants. Existing trigger/RPC warnings are unrelated to these migrations; see [Supabase linter](https://supabase.com/docs/guides/database/database-linter).

## Production pilot

Pending browser validation and activation.
