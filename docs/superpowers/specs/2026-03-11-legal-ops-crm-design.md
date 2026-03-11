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
- **Scraping:** Fetch-based scraper targeting public ATS boards (Greenhouse, Lever, Workable, Gupy, Indeed)
- **AI Enrichment:** Claude API — extracts structured data from raw job HTML and suggests leaders
- **Scheduling:** Vercel Cron Jobs — daily scrape at 7am
- **Deployment:** Vercel (frontend + API + cron)

### System Flow
```
[Vercel Cron 7am]
      ↓
/api/cron/scrape
      ↓
Fetch job listings from boards (Greenhouse, Lever, Workable, Gupy, Indeed)
      ↓
For each new job → send HTML to Claude API
      ↓
Claude returns structured JSON (salary, benefits, remote_reality, leader suggestion)
      ↓
Save to Supabase → job appears in /discover for user triagem
      ↓
User moves job to pipeline → manages in Kanban
```

### Project Structure
```
/app
  /login              → auth page
  /pipeline           → kanban board
  /discover           → new jobs awaiting triage
  /jobs/[id]          → job detail
/api
  /cron/scrape        → daily scraping endpoint
  /jobs               → CRUD for jobs
  /leaders            → CRUD for leaders
/lib
  /scraper.ts         → board-specific fetch logic
  /enrichment.ts      → Claude API integration
  /supabase.ts        → Supabase client
```

---

## Data Model

### `jobs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | → auth.users |
| title | text | |
| company | text | |
| url | text | Original job posting URL |
| source_board | text | greenhouse \| lever \| gupy \| indeed \| manual |
| status | text | found \| researching \| applied \| interview \| offer \| discarded |
| salary_min | integer | Extracted by AI (null if not found) |
| salary_max | integer | Extracted by AI (null if not found) |
| salary_currency | text | BRL \| USD |
| benefits | text[] | e.g. ["plano de saúde", "stock options"] |
| remote_label | text | What the posting claims: "Remote" / "Hybrid" / "On-site" |
| remote_reality | text | AI classification: fully_remote \| remote_with_travel \| hybrid_disguised \| onsite |
| remote_notes | text | AI explanation: e.g. "requires quarterly presence in São Paulo" |
| raw_description | text | Original HTML/text of the job posting |
| posted_at | timestamp | |
| created_at | timestamp | |

### `leaders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK | → jobs |
| user_id | uuid FK | → auth.users |
| name | text | |
| title | text | e.g. "Head of Legal Ops", "VP Legal" |
| linkedin_url | text | |
| confirmed | boolean | false = AI suggestion, true = confirmed by user |
| notes | text | |

### `job_notes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK | → jobs |
| user_id | uuid FK | → auth.users |
| content | text | |
| created_at | timestamp | |

All tables have Row Level Security — users only see their own data.

---

## AI Enrichment (Claude API)

For each scraped job, Claude receives the raw job description text and returns:

```json
{
  "salary_min": 15000,
  "salary_max": 22000,
  "salary_currency": "BRL",
  "benefits": ["plano de saúde", "vale refeição", "stock options"],
  "remote_label": "Remote",
  "remote_reality": "hybrid_disguised",
  "remote_notes": "Job says remote but requires weekly presence in São Paulo office for team meetings",
  "leader_suggestion": {
    "name": "Ana Beatriz Lima",
    "title": "Head of Legal Operations",
    "linkedin_url": "https://linkedin.com/in/..."
  }
}
```

**`remote_reality` values:**
- `fully_remote` — 100% remote, no geographic restriction
- `remote_with_travel` — remote but periodic travel required
- `hybrid_disguised` — claims remote but requires regular office presence
- `onsite` — in-person

---

## Scraping Strategy

**Target boards:** Greenhouse, Lever, Workable, Gupy, Indeed
**Search keywords:** "legal operations", "legal ops", "CLM", "contract management", "head of legal"
**Frequency:** Daily at 7am via Vercel Cron
**LinkedIn:** Direct scraping blocked — covered indirectly via Indeed/Glassdoor aggregation

Deduplication: jobs are identified by URL. If a job URL already exists for a user, it is skipped.

---

## Pages

### `/login`
Email + password auth via Supabase. Signup included.

### `/discover`
- Lists all jobs with `status = 'found'` not yet triaged
- Badge in nav shows count of unreviewed jobs
- Each card: company, title, remote badge, AI confidence
- Actions per card: "Add to Pipeline" (moves to `researching`) or "Ignore" (moves to `discarded`)

### `/pipeline`
- Kanban board with 6 columns: Encontrada → Pesquisando → Aplicada → Entrevista → Oferta → Descartada
- Each card shows: company, title, remote_reality badge (color-coded), salary range
- Click card → opens `/jobs/[id]`
- Drag-and-drop or arrow buttons to move between stages

### `/jobs/[id]`
Full detail view:
- **Header:** company, title, current status, "Apply" button (links to original URL)
- **Remote section:** badge (color-coded by remote_reality) + AI explanation text
- **Salary:** range or "Not disclosed"
- **Benefits:** tag list
- **Leader:** name, title, LinkedIn link, "Confirm" / "Edit" button (confirmed = green checkmark, unconfirmed = AI suggestion badge)
- **Notes:** textarea, saves on blur, shows history of past notes with timestamps

---

## Error Handling

- Scraper fetch failures: log and skip, retry next day
- Claude API errors: save job without enrichment, mark as `needs_enrichment`, retry on next cron
- Auth errors: redirect to `/login`
- Empty pipeline: empty state illustrations per column

---

## Out of Scope (v1)

- Mobile app
- Email notifications for new jobs
- Team/shared pipelines
- Billing / subscription management
- LinkedIn direct scraping
