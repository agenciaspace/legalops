# Club translation pilot — 2026-09-18

Synthetic Portuguese, English, Spanish and mixed-language inputs were sent through the exact runtime translator with `openai/gpt-4.1-mini`, OpenRouter ZDR and data collection denied. Attached JSON records preserve successful inputs/output/usage. Fixed UI catalogs are stored in source, with no model calls during navigation.

Verified amounts, dates, URLs, mentions and code are protected before the request and validated after restoration. An input containing an instruction-injection sentence failed twice with `translation_provider_failed`; no output was displayed. A separate mixed-language input succeeded. Failed provider costs are unknown; successful usage totals are not the full provider invoice.

Static catalog successful batches: USD 0.031917204. Application-generation costs are recorded separately in `club_translation_runs`.

`worker.ts` is an authenticated expiring **preview-only** evaluator. Never deploy it to traffic; configuration and token remain outside the repository. Production only uses the Next cron route.
