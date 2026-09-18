# Multilingual verification — 2026-09-18

Implementation, database migrations, generation and reading are enabled. Production browser acceptance completed in pt-BR, en and es.

- SQL transaction: anonymous private-cache read 0; public read 1; active free member read 1; revoked member read 0. Translated Unicode search matched. Edit cleared cache and incremented revision; stale completion applied 0 rows; deletion left 0 source rows. A USD 0.10 test budget permitted one lease and rejected the second. Fixtures rolled back.
- Unit coverage includes protected values, malformed results, provider failure, empty text, source revision/locale transitions, required cron secret and owner-only preferences.
- Branded Supabase SMTP subjects and bodies applied in pt-BR/en/es. Sender remains contato@legalops.club. Resend inbox delivery is not asserted from a sending-only key.
- Existing security advisor warnings were reviewed. Translation run ledger intentionally has RLS with no client policies and no client grants. Existing trigger/RPC warnings are unrelated to these migrations; see [Supabase linter](https://supabase.com/docs/guides/database/database-linter).

## Production pilot

- Three isolated accounts submitted the real signup form; SMTP returned 200 in each language with no signup fallback. Confirmation links opened the localized profile form.
- Full membership admission succeeded with Unicode names and São Paulo, London and Ciudad de México locations; all three are free members with Pro inactive. Region forms persisted BR/America/Sao_Paulo, GB/Europe/London and MX/America/Mexico_City. Existing owner-only RLS returned one row for own preference updates and zero for another test account.
- Recovery forms returned SMTP 200, reset links opened correctly, password forms changed each password, and fresh browser sessions logged in. Stored language overrode a deliberately different anonymous cookie on each new session.
- One Spanish original and one Portuguese reply shared the same post/comments/likes in all three views. The post and reply translations preserved their original 22/09, 19:00, R$ 1.234,56, USD 199, the source URL, mention and Brazilian jurisdiction. Pending text appeared in the selected language before the reply translation was ready.
- Localized and Unicode searches found the same post. Explicit original toggle and language switching worked. Author correction removed the source hint, advanced revision to 2 and regenerated the translation.
- Mobile 320/390 px, tablet 768 px and desktop 1280 px were checked. A 320 px header overflow was corrected with an accessible compact language selector; the repeat checks passed.
- Latest combined suite: 415 tests passed; production build and Bend proofs passed. An additional deployment harness rejected failed uploads and missing version IDs, and deployed only the ID returned by its own upload.
- Supabase subjects and HTML bodies use user language metadata. Application welcomes use saved preference with signup metadata fallback. Localized email tests check all three languages and the official PNG logo. Sending-only Resend credentials cannot verify inbox receipt.
- During the pilot, 22 completed translation runs reported USD 0.004738536. This is a measured snapshot, not a monthly estimate; later runs and separate synthetic/catalog generation are additional. Daily runtime budget is USD 1.
- All three test users, their posts/comments, sessions and cached translations were deleted after verification; scoped cleanup returned zero remaining fixture rows. Temporary evaluator previews were disabled and their credentials removed. No real community original was overwritten.

