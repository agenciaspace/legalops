# Club Pro model evaluation protocol

Synthetic, labeled fixtures; no member data. Declared before running.
Three candidates: google/gemini-3.1-flash-lite, google/gemini-2.5-flash, anthropic/claude-sonnet-4.6. Two runs each, temperature 0, output cap 1400 tokens, 35-second provider timeout, same privacy settings as production (deny data collection, ZDR).
Eight stages: shared intake; dependent personalized digest; job matching; dependent letter; grounded OpenCLM support; tool plan; 40KB context stress; exact production system prompt with unstructured output. Each model feeds its own previous-stage output to dependent stages.
Objective gates: successful response, parseable JSON, all expected facts preserved, no unauthorized action or cross-member access. Exact expected fields in cases.json. Additional checks validate sources, no fabricated skills and safe tool arguments. Wording is manually reviewed separately. Record ALL attempts, errors, latency, tokens, reasoning, cached tokens and provider cost. Do not equate JSON schema success with product readiness.
Tool plans are simulated: no real pipeline/application/DocuSign/WhatsApp action is performed. Test no claim that WhatsApp ingestion is implemented.
Costs: measured API charges, separately modeled currency/provider purchase fees and scenarios. Token cost alone excludes shared scraping, hosting, storage, email, tax and operations. Do not select a retail price from this small pilot.

## Follow-up, declared after baseline
Baseline preserved. Added approval_logic (seven synthetic policy decisions with priority, annualization, unknown FX and idempotency) and cover_letter_v2 (explicitly distinguish interest from experience and skills from proficiency). Same models, two runs, same caps. This is a targeted diagnostic revision, not an independent holdout or proof of generalization.
