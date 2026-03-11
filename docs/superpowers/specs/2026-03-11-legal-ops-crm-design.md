# Legal Ops CRM — Design Spec
**Date:** 2026-03-11
**Status:** Approved

## Overview

A SaaS web application for Legal Operations professionals to track, research, and manage job opportunities in the Legal Ops market. The product serves both personal use (the primary user tracking their own job search) and other Legal Ops professionals as paying customers.

---

## Architecture

### Stack
- **Frontend + API:** Next.js App Router (React Server Components + API Routes)
- **Database + Auth:** Supabase (PostgreSQL + Row Level Security + Supabase Auth)
- **Scraping:** Fetch-based scraper targeting public ATS boards (Greenhouse, Lever, Workable, Gupy) + Indeed keyword search as best-effort
- **AI Enrichment:** Claude API (`claude-sonnet-4-6`) — extracts structured data from raw job text and suggests leaders
- **Scheduling:** Vercel Cron Jobs — daily scrape at 7am
- **Deployment:** Vercel (frontend + API + cron)

### System Flow
```
[Vercel Cron 7am]
      ↓
/api/cron/scrape  (protected by CRON_SECRET header)
      ↓
Step 1 — Scrape new jobs:
  Fetch job listings from boards using hardcoded company slug list
  Filter to keywords: "legal operations", "legal ops", "CLM", "contract management", "head of legal"
  For each job URL not in jobs.url (ON CONFLICT DO NOTHING):
    Strip HTML → plain text → save with enrichment_status = 'pending'

Step 2 — Enrich pending/failed jobs (max 20 per cron run to stay within Vercel timeout):
  Query: SELECT * FROM jobs
         WHERE enrichment_status IN ('pending', 'failed')
           AND enrichment_attempts < 5
         LIMIT 20
  For each job: send raw_description to Claude API
    On success: update row with extracted fields, set enrichment_status = 'done'
    On failure: increment enrichment_attempts, set enrichment_status = 'failed'
      Jobs with enrichment_attempts >= 5 are permanently skipped (dead-letter).

Result: new jobs appear in /discover for all authenticated users
```

### Project Structure
```
/app
  /login                    → auth page
  /pipeline                 → kanban board
  /discover                 → new jobs awaiting triage
  /jobs/[id]                → job detail (id = user_pipeline_entries.id)
/api
  /cron/scrape              → daily scraping + enrichment endpoint
  /pipeline                 → POST: add job to pipeline; GET: list user's pipeline entries
  /pipeline/[entryId]       → PATCH: update status; DELETE: remove from pipeline
  /pipeline/[entryId]/notes → POST: add note; GET: list notes
  /pipeline/[entryId]/leader → GET: get leader; PUT: upsert (create or update); PATCH: confirm only
/lib
  /scraper.ts               → board-specific fetch + company slug list
  /enrichment.ts            → Claude API integration
  /supabase.ts              → Supabase browser client
  /supabase-server.ts       → Supabase server client (service role, for cron only)
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # server-side only (cron route)
ANTHROPIC_API_KEY
CRON_SECRET                   # validated on /api/cron/scrape
```

---

## Data Model

### `jobs` (system-wide, no user_id)
Inserted by cron using Supabase service role key (bypasses RLS).
All authenticated users can read this table (public read RLS policy).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | text | |
| company | text | |
| url | text UNIQUE | DB-level unique constraint — deduplication key |
| source_board | text | greenhouse \| lever \| gupy \| workable \| indeed |
| salary_min | integer | Extracted by AI, null if not found |
| salary_max | integer | Extracted by AI, null if not found |
| salary_currency | text | BRL \| USD \| EUR \| GBP \| other — null if no salary |
| benefits | text[] | e.g. ["plano de saúde", "stock options"], empty array if none |
| remote_label | text | Exact text from posting, null if not mentioned |
| remote_reality | text | AI classification (see values below) |
| remote_notes | text | AI one-sentence explanation, null if onsite/unknown |
| enrichment_status | text | pending \| done \| failed |
| enrichment_attempts | integer | Default 0. Incremented on each failed attempt. Cron skips jobs with enrichment_attempts >= 5. |
| posted_at | timestamp | Extracted by AI; falls back to scrape time |
| raw_description | text | Full plain text of the job posting |
| suggested_leader_name | text | AI suggestion, stored here until user adds to pipeline |
| suggested_leader_title | text | AI suggestion |
| suggested_leader_linkedin | text | AI suggestion |
| created_at | timestamp | |

**`remote_reality` values:**
- `fully_remote` — 100% remote, no geographic restriction
- `remote_with_travel` — remote but periodic travel required
- `hybrid_disguised` — claims remote but requires regular office presence
- `onsite` — in-person
- `unknown` — AI could not determine

### `user_pipeline_entries`
Created when user clicks "Add to Pipeline" in /discover. One row per (user, job).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | → auth.users |
| job_id | uuid FK | → jobs |
| status | text | researching \| applied \| interview \| offer \| discarded |
| created_at | timestamp | |

Unique constraint: `(user_id, job_id)`.
Note: `updated_at` is intentionally omitted in v1. Status history is not tracked.
RLS: `user_id = auth.uid()`.

**`found` is a UI concept only, not a status value.** Jobs in `/discover` are those with no `user_pipeline_entries` row for the current user. `researching` is the initial status when a user adds a job to their pipeline.

### `leaders`
Created when user adds a job to pipeline — at that point, copy suggested_leader_* fields from `jobs` into a new `leaders` row with `confirmed = false`. User can later confirm or edit.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| entry_id | uuid FK | → user_pipeline_entries |
| user_id | uuid FK | → auth.users |
| name | text | |
| title | text | e.g. "Head of Legal Ops", "VP Legal" |
| linkedin_url | text | |
| confirmed | boolean | false = AI suggestion, true = user-confirmed |
| notes | text | |

RLS: `user_id = auth.uid()` (direct column check, no join needed).

### `job_notes`
Append-only. Each "Add Note" creates a new row. Notes are never edited or deleted.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| entry_id | uuid FK | → user_pipeline_entries |
| user_id | uuid FK | → auth.users |
| content | text | |
| created_at | timestamp | |

RLS: `user_id = auth.uid()`. Insert-only policy (no UPDATE, no DELETE).

---

## AI Enrichment (Claude API)

**Model:** `claude-sonnet-4-6`

**Prompt template** (`/lib/enrichment.ts`):

```
System: You are a structured data extractor for job postings. Extract information accurately.
If information is not present, use null. Return only valid JSON, no explanation.

User: Extract the following from this job posting and return as JSON:
{
  "salary_min": integer or null,
  "salary_max": integer or null,
  "salary_currency": "BRL" | "USD" | "EUR" | "GBP" | "other" | null,
  "benefits": string[],
  "remote_label": string or null,
  "remote_reality": "fully_remote" | "remote_with_travel" | "hybrid_disguised" | "onsite" | "unknown",
  "remote_notes": string or null,
  "posted_at": ISO 8601 date string or null,
  "suggested_leader_name": string or null,
  "suggested_leader_title": string or null,
  "suggested_leader_linkedin": "full LinkedIn URL (https://linkedin.com/in/...) or null"
}

Note on salary: use monthly values for BRL, annual for USD/EUR/GBP.
Note on remote_reality: read the full description carefully.
  "hybrid_disguised" = posting says remote but text implies regular office requirement.

Job posting:
{RAW_DESCRIPTION}
```

**Handling partial/failed responses:**
- Valid JSON with null fields → save what was returned, set `enrichment_status = 'done'`
- Malformed JSON or API error → increment `enrichment_attempts`, set `enrichment_status = 'failed'`, retry next cron run
- Jobs with `enrichment_attempts >= 5` are permanently skipped (dead-letter state)

---

## Scraping Strategy

**Frequency:** Daily at 7am via Vercel Cron
**Deduplication:** `ON CONFLICT (url) DO NOTHING` at DB level

### Board-specific approach

| Board | Method | URL Pattern |
|-------|--------|-------------|
| **Greenhouse** | Public JSON API | `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs` |
| **Lever** | Public JSON API | `https://api.lever.co/v0/postings/{slug}?mode=json` |
| **Workable** | Public JSON API | `https://{slug}.workable.com/api/v1/jobs` |
| **Gupy** | Public JSON API | `https://{slug}.gupy.io/api/job-openings` |
| **Indeed** | HTML scrape (best-effort) | Keyword search; parse listing titles/URLs from HTML. Unstable — failures are logged and skipped silently. |

### Starter company slug list (`/lib/scraper.ts`)
```typescript
export const COMPANY_SLUGS = {
  greenhouse: ['nubank', 'ifood', 'totvs', 'vtex', 'loft', 'gympass', 'creditas'],
  lever: ['stone', 'pagarme', 'dock', 'ebanx', 'nuvemshop'],
  workable: ['jusbrasil', 'lalamove-brazil'],
  gupy: ['itau', 'bradesco', 'ambev', 'embraer', 'raizen'],
};
```
This list is expanded over time as new Legal Ops-hiring companies are identified.

### Cron authentication
The `/api/cron/scrape` route validates:
```
Authorization: Bearer {CRON_SECRET}
```
Vercel Cron is configured in `vercel.json` to include this header. Any request without the correct secret returns 401.

---

## API Contracts

### `POST /api/pipeline`
Add a job to the user's pipeline.
```json
Request:  { "job_id": "uuid", "status"?: "researching" | "discarded" }
           // status defaults to "researching" if omitted
Response: { "entry": { "id": "uuid", "job_id": "uuid", "status": "researching", ... } }
```
Side effect: if status is `"researching"`, creates a `leaders` row copying `jobs.suggested_leader_*` fields with `confirmed = false` (skipped if all suggested fields are null). No leader is created for `"discarded"` entries.

### `PATCH /api/pipeline/[entryId]`
Update pipeline status.
```json
Request:  { "status": "applied" | "interview" | "offer" | "discarded" }
Response: { "entry": { "id": "uuid", "status": "applied", ... } }
```

### `GET /api/pipeline/[entryId]/notes`
```json
Response: { "notes": [{ "id": "uuid", "content": "...", "created_at": "..." }] }
```
Ordered by `created_at DESC`.

### `POST /api/pipeline/[entryId]/notes`
```json
Request:  { "content": "string" }
Response: { "note": { "id": "uuid", "content": "...", "created_at": "..." } }
```

### `GET /api/pipeline/[entryId]/leader`
```json
Response: { "leader": { "id": "uuid", "name": "...", "confirmed": false, ... } | null }
```

### `PUT /api/pipeline/[entryId]/leader`
Create or replace leader (upsert). Used by the "Edit" inline form.
All fields optional except at least `name` must be non-null.
```json
Request:  { "name": "...", "title": "...", "linkedin_url": "https://linkedin.com/in/...", "notes": "..." }
Response: { "leader": { ... } }
```
Note: `linkedin_url` must be a full URL (`https://linkedin.com/in/...`) or null. Validated server-side.

### `PATCH /api/pipeline/[entryId]/leader/confirm`
Flip `confirmed = true` without changing any other fields. Used by the "Confirm" button.
```json
Request:  {} (empty body)
Response: { "leader": { "confirmed": true, ... } }
```
Returns 404 if no leader exists for this entry.

---

## Pages

### `/login`
Email + password auth via Supabase. Signup included.

### `/discover`
- Lists jobs from `jobs` where no `user_pipeline_entries` row exists for current user
- **Pagination:** Cursor-based. Default page size 20, ordered by `created_at DESC`. "Load more" button appends next page using the last seen `created_at` as cursor (`?before=<ISO timestamp>`). Cursor-based avoids row skips when jobs are actioned mid-session.
- Badge in nav shows total count of undiscovered jobs
- Each card: company, title, remote_reality badge (color-coded), salary range or "Not disclosed"
- Actions per card:
  - "Add to Pipeline" → `POST /api/pipeline` → job disappears from list
  - "Ignore" → `POST /api/pipeline` with status `discarded` directly → job disappears

### `/pipeline`
- Kanban with 5 columns:

| Column Label | `status` value |
|---|---|
| Pesquisando | researching |
| Aplicada | applied |
| Entrevista | interview |
| Oferta | offer |
| Descartada | discarded |

- Each card: company, title, remote_reality badge, salary range
- Click card → `/jobs/[entry_id]`
- Arrow buttons (← →) to move between columns

### `/jobs/[id]`
Full detail view (id = `user_pipeline_entries.id`):
- **Header:** company, title, status dropdown (calls `PATCH /api/pipeline/[id]`), "Apply" button — opens `jobs.url` in a new tab and, if current status is `researching`, automatically moves status to `applied`
- **Remote:** badge + `remote_notes` text
- **Salary:** range with currency or "Not disclosed"
- **Benefits:** tag list or "Not disclosed"
- **Leader:** name, title, LinkedIn link. Badge: "AI Suggestion" (yellow) or "Confirmed" (green). "Confirm" button calls `PATCH /api/pipeline/[id]/leader/confirm` — no validation required, user confirms as-is. "Edit" opens inline form (name, title, linkedin_url fields) calling `PUT /api/pipeline/[id]/leader`. If no leader exists, shows "No leader found" with an "Add" button that opens the same inline form.
- **Notes:** textarea + "Add Note" button → `POST /api/pipeline/[id]/notes`. Past notes below in reverse chronological order.

---

## Error Handling

- **Scraper fetch failures:** log error, skip job, retry next day
- **Claude failures:** set `enrichment_status = 'failed'`, retry on next cron run
- **Auth errors:** redirect to `/login`
- **Empty pipeline columns:** "No jobs here yet"
- **Empty /discover:** "No new jobs found. Next search runs tomorrow at 7am."

---

## RLS Summary

| Table | Read | Write |
|-------|------|-------|
| `jobs` | Any authenticated user | Service role only (cron) |
| `user_pipeline_entries` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `leaders` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `job_notes` | `user_id = auth.uid()` | INSERT only — `user_id = auth.uid()` |

---

## Out of Scope (v1)

- Mobile app
- Email/push notifications for new jobs
- Team/shared pipelines
- Billing / subscription management
- LinkedIn direct scraping
- Editing or deleting notes
- Status change history / audit log
