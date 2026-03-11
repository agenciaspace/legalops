# Legal Ops CRM Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Next.js SaaS app for Legal Ops professionals to discover, track, and research job opportunities, with daily automated scraping and AI-powered enrichment.

**Architecture:** Next.js App Router (RSC + API routes) on Vercel, Supabase for auth + PostgreSQL, Claude API for job data extraction, Vercel Cron for daily scraping.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (@supabase/ssr), @anthropic-ai/sdk, Vitest

---

## Chunk 1: Foundation — Next.js Setup, Database, Auth

### File Map (Chunk 1)
| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Replace Vite with Next.js deps |
| `next.config.ts` | Create | Next.js config |
| `tailwind.config.js` | Modify | Add Next.js content paths |
| `postcss.config.js` | Keep | No change needed |
| `app/layout.tsx` | Create | Root layout with nav + Supabase provider |
| `app/page.tsx` | Create | Redirect to /discover |
| `app/globals.css` | Create | Tailwind directives |
| `app/login/page.tsx` | Create | Email/password auth form |
| `middleware.ts` | Create | Protect routes, refresh session |
| `lib/types.ts` | Create | Shared TypeScript interfaces |
| `lib/supabase.ts` | Create | Browser Supabase client |
| `lib/supabase-server.ts` | Create | Server Supabase client (anon) |
| `lib/supabase-admin.ts` | Create | Server Supabase client (service role, cron only) |
| `supabase/migrations/001_initial_schema.sql` | Create | All tables, constraints, RLS |
| `.env.local.example` | Create | Env var template |
| `vercel.json` | Create | Cron config — deferred to Task 9 (Chunk 2) |
| `__tests__/types.test.ts` | Create | Sanity test for type helpers |

Files to delete: `vite.config.ts`, `index.html`, `tsconfig.app.json`, `src/` (entire directory)

---

### Task 1: Remove Vite, Install Next.js

**Files:**
- Modify: `package.json`
- Delete: `vite.config.ts`, `index.html`, `tsconfig.app.json`, `src/` (entire dir)
- Create: `next.config.ts`, `tsconfig.json` (replace)

- [ ] **Step 1: Remove Vite files**
```bash
rm -rf src/ vite.config.ts index.html tsconfig.app.json dist/
```

- [ ] **Step 2: Install Next.js and project dependencies**
```bash
npm install next@14 react@18 react-dom@18 @supabase/ssr @supabase/supabase-js@">=2.46.0" @anthropic-ai/sdk
npm install -D typescript @types/node @types/react @types/react-dom vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
# Verify peer deps
npm ls @supabase/supabase-js
```
Expected: `@supabase/supabase-js@2.x.x` with no peer dep warnings.

- [ ] **Step 3: Replace package.json scripts**

Update `package.json` scripts section:
```json
{
  "name": "legalops",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Create `next.config.ts`**
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

- [ ] **Step 5: Replace `tsconfig.json`**
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Create `vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
  },
})
```

- [ ] **Step 7: Create `__tests__/setup.ts`**
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Update `tailwind.config.js` content paths**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 9: Verify Next.js config compiles**
```bash
npx next info
```
Expected: prints Next.js version and system info with no errors. Do NOT run `npm run dev` yet — `app/layout.tsx` does not exist until Task 5, and Next.js will throw a missing-layout error. Full server verification happens at the end of Task 5.

- [ ] **Step 10: Commit**
```bash
git add -A
git commit -m "chore: migrate from Vite to Next.js 14"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `lib/types.ts`
- Create: `__tests__/types.test.ts`

- [ ] **Step 1: Write the types test**
```typescript
// __tests__/types.test.ts
import { describe, it, expect } from 'vitest'
import type { Job, PipelineEntry, Leader, JobNote } from '@/lib/types'

describe('types', () => {
  it('Job has required fields', () => {
    const job: Job = {
      id: 'uuid',
      title: 'Legal Ops Manager',
      company: 'Acme',
      url: 'https://example.com',
      source_board: 'greenhouse',
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      benefits: [],
      remote_label: null,
      remote_reality: 'unknown',
      remote_notes: null,
      enrichment_status: 'pending',
      enrichment_attempts: 0,
      posted_at: null,
      raw_description: '',
      suggested_leader_name: null,
      suggested_leader_title: null,
      suggested_leader_linkedin: null,
      created_at: new Date().toISOString(),
    }
    expect(job.id).toBe('uuid')
  })

  it('PipelineEntry has required fields', () => {
    const entry: PipelineEntry = {
      id: 'entry-uuid',
      user_id: 'user-uuid',
      job_id: 'job-uuid',
      status: 'researching',
      created_at: new Date().toISOString(),
    }
    expect(entry.status).toBe('researching')
  })

  it('Leader has required fields', () => {
    const leader: Leader = {
      id: 'leader-uuid',
      entry_id: 'entry-uuid',
      user_id: 'user-uuid',
      name: 'Ana Lima',
      title: 'Head of Legal Ops',
      linkedin_url: 'https://linkedin.com/in/analima',
      confirmed: false,
      notes: null,
      created_at: new Date().toISOString(),
    }
    expect(leader.confirmed).toBe(false)
  })

  it('JobNote has required fields', () => {
    const note: JobNote = {
      id: 'note-uuid',
      entry_id: 'entry-uuid',
      user_id: 'user-uuid',
      content: 'Interesting role',
      created_at: new Date().toISOString(),
    }
    expect(note.content).toBe('Interesting role')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm test
```
Expected: FAIL — `@/lib/types` not found

- [ ] **Step 3: Create `lib/types.ts`**
```typescript
export type RemoteReality =
  | 'fully_remote'
  | 'remote_with_travel'
  | 'hybrid_disguised'
  | 'onsite'
  | 'unknown'

export type EnrichmentStatus = 'pending' | 'done' | 'failed'

export type PipelineStatus =
  | 'researching'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'discarded'

export type SourceBoard = 'greenhouse' | 'lever' | 'gupy' | 'workable' | 'indeed'

export interface Job {
  id: string
  title: string
  company: string
  url: string
  source_board: SourceBoard
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  benefits: string[]
  remote_label: string | null
  remote_reality: RemoteReality
  remote_notes: string | null
  enrichment_status: EnrichmentStatus
  enrichment_attempts: number
  posted_at: string | null
  raw_description: string
  suggested_leader_name: string | null
  suggested_leader_title: string | null
  suggested_leader_linkedin: string | null
  created_at: string
}

export interface PipelineEntry {
  id: string
  user_id: string
  job_id: string
  status: PipelineStatus
  created_at: string
}

export interface PipelineEntryWithJob extends PipelineEntry {
  job: Job
}

export interface Leader {
  id: string
  entry_id: string
  user_id: string
  name: string | null
  title: string | null
  linkedin_url: string | null
  confirmed: boolean
  notes: string | null
  created_at: string
}

export interface JobNote {
  id: string
  entry_id: string
  user_id: string
  content: string
  created_at: string
}
```

- [ ] **Step 4: Run tests and verify pass**
```bash
npm test
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add lib/types.ts __tests__/types.test.ts __tests__/setup.ts vitest.config.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Supabase Migration SQL

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migrations directory**
```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Create `supabase/migrations/001_initial_schema.sql`**
```sql
-- Jobs table (system-wide, written by service role only)
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  url text NOT NULL UNIQUE,
  source_board text NOT NULL,
  salary_min integer,
  salary_max integer,
  salary_currency text,
  benefits text[] NOT NULL DEFAULT '{}',
  remote_label text,
  remote_reality text NOT NULL DEFAULT 'unknown',
  remote_notes text,
  enrichment_status text NOT NULL DEFAULT 'pending',
  enrichment_attempts integer NOT NULL DEFAULT 0,
  posted_at timestamptz,
  raw_description text NOT NULL DEFAULT '',
  suggested_leader_name text,
  suggested_leader_title text,
  suggested_leader_linkedin text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for jobs: authenticated users can read, service role writes
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_read_authenticated" ON jobs
  FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE policy — service role bypasses RLS

-- User pipeline entries
CREATE TABLE IF NOT EXISTS user_pipeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'researching',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE user_pipeline_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_owner" ON user_pipeline_entries
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Leaders
CREATE TABLE IF NOT EXISTS leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES user_pipeline_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  title text,
  linkedin_url text,
  confirmed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entry_id)
);

ALTER TABLE leaders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaders_owner" ON leaders
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Job notes (append-only)
CREATE TABLE IF NOT EXISTS job_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES user_pipeline_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_notes_owner_read" ON job_notes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "job_notes_owner_insert" ON job_notes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- No UPDATE or DELETE policy intentionally (append-only)
```

- [ ] **Step 3: Run migration on your Supabase project**

Go to your Supabase dashboard → SQL Editor → paste and run the migration.
Verify all 4 tables appear in the Table Editor.

- [ ] **Step 4: Commit**
```bash
git add supabase/
git commit -m "feat: add initial Supabase schema migration"
```

---

### Task 4: Supabase Clients

> **Note:** The spec's project structure lists `supabase-server.ts` as "service role, for cron only". This plan correctly uses a different naming: `supabase-server.ts` = cookie-based anon client (for all API routes + RSC), and `supabase-admin.ts` = service role client (cron only). This split is more correct than the spec's description.

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/supabase-server.ts`
- Create: `lib/supabase-admin.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Create `.env.local.example`**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=a-random-secret-string
```

Copy to `.env.local` and fill in your real values from the Supabase dashboard:
```bash
cp .env.local.example .env.local
# Now open .env.local and fill in your real Supabase URL, keys, Anthropic key, and a random CRON_SECRET
```
**Do not proceed to later tasks until `.env.local` is populated** — the auth verification in Task 5 requires real credentials.

- [ ] **Step 2: Create `lib/supabase.ts` (browser client)**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create `lib/supabase-server.ts` (server client for API routes)**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 4: Create `lib/supabase-admin.ts` (service role — cron only)**
```typescript
import { createClient } from '@supabase/supabase-js'

// Only import this in server-side code that needs to bypass RLS (cron route)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

- [ ] **Step 5: Commit**
```bash
git add lib/supabase.ts lib/supabase-server.ts lib/supabase-admin.ts .env.local.example
git commit -m "feat: add Supabase client utilities"
```

---

### Task 5: Auth — Middleware + Login Page + Layout

**Files:**
- Create: `middleware.ts`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/login/page.tsx`

- [ ] **Step 1: Create `middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (!user) {
    // API routes return 401 JSON, not a redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/discover', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron).*)'],
}
```

- [ ] **Step 2: Create `app/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Create `app/layout.tsx`**
```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Legal Ops CRM',
  description: 'Track Legal Operations job opportunities',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Create `app/page.tsx`** (redirect to /discover)
```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/discover')
}
```

- [ ] **Step 5: Create `app/login/page.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.refresh() // propagate session cookie to server before navigating
    router.push('/discover')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Legal Ops CRM</h1>
        <p className="text-slate-500 text-center text-sm mb-8">
          Track your Legal Operations job search
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-slate-500 text-xs hover:text-slate-700 transition-colors"
          >
            {mode === 'login' ? 'No account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify auth flow**
```bash
npm run dev
```
Open http://localhost:3000 — should redirect to /login. Create an account with a test email/password. Should redirect to /discover (which returns 404 for now — that's fine).

- [ ] **Step 7: Commit**
```bash
git add app/ middleware.ts
git commit -m "feat: add auth layout, login page, and middleware"
```

---

## Chunk 2: Scraping & AI Enrichment

### File Map (Chunk 2)
| File | Action | Purpose |
|------|--------|---------|
| `lib/utils.ts` | Create | `stripHtml`, `matchesKeywords` helpers |
| `lib/scraper.ts` | Create | Board-specific fetch + slug list |
| `lib/enrichment.ts` | Create | Claude API integration |
| `__tests__/utils.test.ts` | Create | Unit tests for utils |
| `__tests__/scraper.test.ts` | Create | Unit tests for scraper |
| `__tests__/enrichment.test.ts` | Create | Unit tests for enrichment |
| `app/api/cron/scrape/route.ts` | Create | Cron endpoint |
| `vercel.json` | Create | Cron schedule |

---

### Task 6: Utils — stripHtml and matchesKeywords

**Files:**
- Create: `lib/utils.ts`
- Create: `__tests__/utils.test.ts`

- [ ] **Step 1: Write failing tests**
```typescript
// __tests__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { stripHtml, matchesKeywords } from '@/lib/utils'

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('decodes HTML entities', () => {
    expect(stripHtml('R&amp;D &gt; 5 years')).toBe('R&D > 5 years')
  })

  it('collapses whitespace', () => {
    expect(stripHtml('<p>  lots   of   spaces  </p>')).toBe('lots of spaces')
  })

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('')
  })
})

describe('matchesKeywords', () => {
  const KEYWORDS = ['legal operations', 'legal ops', 'clm']

  it('matches exact keyword', () => {
    expect(matchesKeywords('Head of Legal Operations', KEYWORDS)).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchesKeywords('LEGAL OPS Manager', KEYWORDS)).toBe(true)
  })

  it('returns false when no keyword matches', () => {
    expect(matchesKeywords('Software Engineer', KEYWORDS)).toBe(false)
  })

  it('matches partial word in title', () => {
    expect(matchesKeywords('VP of CLM Solutions', KEYWORDS)).toBe(true)
  })
})
```

- [ ] **Step 2: Run and verify fails**
```bash
npm test __tests__/utils.test.ts
```
Expected: FAIL — `@/lib/utils` not found

- [ ] **Step 3: Create `lib/utils.ts`**
```typescript
export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const KEYWORDS = [
  'legal operations',
  'legal ops',
  'clm',
  'contract management',
  'head of legal',
  'operações jurídicas',
  'gestão de contratos',
]

export function matchesKeywords(text: string, keywords: string[] = KEYWORDS): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}
```

- [ ] **Step 4: Run and verify passes**
```bash
npm test __tests__/utils.test.ts
```
Expected: PASS (4 test groups)

- [ ] **Step 5: Commit**
```bash
git add lib/utils.ts __tests__/utils.test.ts
git commit -m "feat: add stripHtml and matchesKeywords utils"
```

---

### Task 7: Scraper

**Files:**
- Create: `lib/scraper.ts`
- Create: `__tests__/scraper.test.ts`

- [ ] **Step 1: Write failing tests**
```typescript
// __tests__/scraper.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { filterByKeywords, parseGreenhouseJobs, parseLeverJobs } from '@/lib/scraper'

describe('filterByKeywords', () => {
  it('keeps jobs with matching title', () => {
    const jobs = [
      { title: 'Legal Operations Manager', url: 'https://a.com' },
      { title: 'Software Engineer', url: 'https://b.com' },
      { title: 'Head of Legal Ops', url: 'https://c.com' },
    ]
    const result = filterByKeywords(jobs)
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Legal Operations Manager')
    expect(result[1].title).toBe('Head of Legal Ops')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterByKeywords([{ title: 'Cook', url: 'https://x.com' }])).toHaveLength(0)
  })
})

describe('parseGreenhouseJobs', () => {
  it('parses greenhouse API response', () => {
    const raw = {
      jobs: [
        { title: 'Legal Operations Manager', absolute_url: 'https://boards.greenhouse.io/acme/jobs/123' },
        { title: 'Data Engineer', absolute_url: 'https://boards.greenhouse.io/acme/jobs/456' },
      ]
    }
    const result = parseGreenhouseJobs(raw, 'acme')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      title: 'Legal Operations Manager',
      url: 'https://boards.greenhouse.io/acme/jobs/123',
      source_board: 'greenhouse',
      company: 'acme',
    })
  })
})

describe('parseLeverJobs', () => {
  it('parses lever API response', () => {
    const raw = [
      { text: 'Legal Ops Specialist', hostedUrl: 'https://jobs.lever.co/stone/abc' },
      { text: 'Marketing', hostedUrl: 'https://jobs.lever.co/stone/def' },
    ]
    const result = parseLeverJobs(raw, 'stone')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Legal Ops Specialist')
    expect(result[0].source_board).toBe('lever')
  })
})
```

- [ ] **Step 2: Run and verify fails**
```bash
npm test __tests__/scraper.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `lib/scraper.ts`**
```typescript
import { matchesKeywords, KEYWORDS } from './utils'

export type RawJob = {
  title: string
  url: string
  source_board: string
  company: string
}

export const COMPANY_SLUGS = {
  greenhouse: ['nubank', 'ifood', 'totvs', 'vtex', 'loft', 'gympass', 'creditas'],
  lever: ['stone', 'pagarme', 'dock', 'ebanx', 'nuvemshop'],
  workable: ['jusbrasil', 'lalamove-brazil'],
  gupy: ['itau', 'bradesco', 'ambev', 'embraer', 'raizen'],
} as const

export function filterByKeywords(jobs: { title: string; url: string }[]): typeof jobs {
  return jobs.filter(j => matchesKeywords(j.title, KEYWORDS))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGreenhouseJobs(data: any, slug: string): RawJob[] {
  if (!data?.jobs) return []
  return data.jobs
    .map((j: { title: string; absolute_url: string }) => ({
      title: j.title,
      url: j.absolute_url,
      source_board: 'greenhouse',
      company: slug,
    }))
    .filter((j: RawJob) => matchesKeywords(j.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLeverJobs(data: any[], slug: string): RawJob[] {
  if (!Array.isArray(data)) return []
  return data
    .map((j: { text: string; hostedUrl: string }) => ({
      title: j.text,
      url: j.hostedUrl,
      source_board: 'lever',
      company: slug,
    }))
    .filter((j: RawJob) => matchesKeywords(j.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWorkableJobs(data: any, slug: string): RawJob[] {
  if (!data?.results) return []
  return data.results
    .map((j: { title: string; url: string }) => ({
      title: j.title,
      url: j.url,
      source_board: 'workable',
      company: slug,
    }))
    .filter((j: RawJob) => matchesKeywords(j.title))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGupyJobs(data: any, slug: string): RawJob[] {
  if (!Array.isArray(data)) return []
  return data
    .map((j: { name: string; jobUrl: string }) => ({
      title: j.name,
      url: j.jobUrl,
      source_board: 'gupy',
      company: slug,
    }))
    .filter((j: RawJob) => matchesKeywords(j.title))
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

export async function scrapeAllBoards(): Promise<RawJob[]> {
  const results: RawJob[] = []

  // Greenhouse
  for (const slug of COMPANY_SLUGS.greenhouse) {
    try {
      const data = await fetchJson(
        `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
      )
      results.push(...parseGreenhouseJobs(data, slug))
    } catch (e) {
      console.error(`[scraper] greenhouse/${slug} failed:`, e)
    }
  }

  // Lever
  for (const slug of COMPANY_SLUGS.lever) {
    try {
      const data = await fetchJson(
        `https://api.lever.co/v0/postings/${slug}?mode=json`
      ) as unknown[]
      results.push(...parseLeverJobs(data, slug))
    } catch (e) {
      console.error(`[scraper] lever/${slug} failed:`, e)
    }
  }

  // Workable
  for (const slug of COMPANY_SLUGS.workable) {
    try {
      const data = await fetchJson(
        `https://${slug}.workable.com/api/v1/jobs`
      )
      results.push(...parseWorkableJobs(data, slug))
    } catch (e) {
      console.error(`[scraper] workable/${slug} failed:`, e)
    }
  }

  // Gupy
  for (const slug of COMPANY_SLUGS.gupy) {
    try {
      const data = await fetchJson(
        `https://${slug}.gupy.io/api/job-openings`
      ) as unknown[]
      results.push(...parseGupyJobs(data, slug))
    } catch (e) {
      console.error(`[scraper] gupy/${slug} failed:`, e)
    }
  }

  return results
}

export async function fetchJobDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LegalOpsCRM/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return ''
    const html = await res.text()
    // Use stripHtml for proper entity decoding to avoid corrupting Claude prompts
    const { stripHtml } = await import('./utils')
    return stripHtml(html).slice(0, 8000)
  } catch {
    return ''
  }
}
```

- [ ] **Step 4: Run and verify passes**
```bash
npm test __tests__/scraper.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add lib/scraper.ts __tests__/scraper.test.ts
git commit -m "feat: add board scraper with Greenhouse/Lever/Workable/Gupy parsers"
```

---

### Task 8: AI Enrichment

**Files:**
- Create: `lib/enrichment.ts`
- Create: `__tests__/enrichment.test.ts`

- [ ] **Step 1: Write failing tests**
```typescript
// __tests__/enrichment.test.ts
import { describe, it, expect } from 'vitest'
import { parseEnrichmentResponse, buildEnrichmentPrompt } from '@/lib/enrichment'

describe('parseEnrichmentResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      salary_min: 15000,
      salary_max: 22000,
      salary_currency: 'BRL',
      benefits: ['plano de saúde', 'vale refeição'],
      remote_label: 'Remote',
      remote_reality: 'fully_remote',
      remote_notes: 'Job is 100% remote with no restrictions',
      posted_at: '2026-03-10',
      suggested_leader_name: 'Ana Lima',
      suggested_leader_title: 'Head of Legal Ops',
      suggested_leader_linkedin: 'https://linkedin.com/in/analima',
    })
    const result = parseEnrichmentResponse(json)
    expect(result).not.toBeNull()
    expect(result!.salary_min).toBe(15000)
    expect(result!.remote_reality).toBe('fully_remote')
    expect(result!.benefits).toHaveLength(2)
  })

  it('returns null for malformed JSON', () => {
    expect(parseEnrichmentResponse('not json at all')).toBeNull()
  })

  it('handles null fields gracefully', () => {
    const json = JSON.stringify({
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      benefits: [],
      remote_label: null,
      remote_reality: 'unknown',
      remote_notes: null,
      posted_at: null,
      suggested_leader_name: null,
      suggested_leader_title: null,
      suggested_leader_linkedin: null,
    })
    const result = parseEnrichmentResponse(json)
    expect(result).not.toBeNull()
    expect(result!.remote_reality).toBe('unknown')
  })

  it('rejects invalid remote_reality values', () => {
    const json = JSON.stringify({
      salary_min: null, salary_max: null, salary_currency: null,
      benefits: [], remote_label: null,
      remote_reality: 'purple', // invalid
      remote_notes: null, posted_at: null,
      suggested_leader_name: null, suggested_leader_title: null,
      suggested_leader_linkedin: null,
    })
    // Should still parse but default to 'unknown'
    const result = parseEnrichmentResponse(json)
    expect(result!.remote_reality).toBe('unknown')
  })
})

describe('buildEnrichmentPrompt', () => {
  it('includes job description in prompt', () => {
    const prompt = buildEnrichmentPrompt('Legal Operations Manager at Acme Corp')
    expect(prompt).toContain('Legal Operations Manager at Acme Corp')
    expect(prompt).toContain('remote_reality')
  })
})
```

- [ ] **Step 2: Run and verify fails**
```bash
npm test __tests__/enrichment.test.ts
```

- [ ] **Step 3: Create `lib/enrichment.ts`**
```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { RemoteReality } from './types'

const VALID_REMOTE_REALITY: RemoteReality[] = [
  'fully_remote', 'remote_with_travel', 'hybrid_disguised', 'onsite', 'unknown'
]

export interface EnrichmentResult {
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  benefits: string[]
  remote_label: string | null
  remote_reality: RemoteReality
  remote_notes: string | null
  posted_at: string | null
  suggested_leader_name: string | null
  suggested_leader_title: string | null
  suggested_leader_linkedin: string | null
}

export function buildEnrichmentPrompt(description: string): string {
  return `Extract the following from this job posting and return as JSON only, no explanation:
{
  "salary_min": integer or null,
  "salary_max": integer or null,
  "salary_currency": "BRL" | "USD" | "EUR" | "GBP" | "other" | null,
  "benefits": string array,
  "remote_label": string or null,
  "remote_reality": "fully_remote" | "remote_with_travel" | "hybrid_disguised" | "onsite" | "unknown",
  "remote_notes": one sentence explanation or null,
  "posted_at": ISO 8601 date string or null,
  "suggested_leader_name": string or null,
  "suggested_leader_title": string or null,
  "suggested_leader_linkedin": full LinkedIn URL (https://linkedin.com/in/...) or null
}

Rules:
- salary: monthly for BRL, annual for USD/EUR/GBP
- remote_reality: "hybrid_disguised" if posting says remote but requires office presence
- suggested_leader: the likely direct manager based on job content

Job posting:
${description}`
}

export function parseEnrichmentResponse(text: string): EnrichmentResult | null {
  try {
    // Extract JSON from possible markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const data = JSON.parse(jsonMatch[0])

    const remoteReality: RemoteReality = VALID_REMOTE_REALITY.includes(data.remote_reality)
      ? data.remote_reality
      : 'unknown'

    return {
      salary_min: typeof data.salary_min === 'number' ? data.salary_min : null,
      salary_max: typeof data.salary_max === 'number' ? data.salary_max : null,
      salary_currency: typeof data.salary_currency === 'string' ? data.salary_currency : null,
      benefits: Array.isArray(data.benefits) ? data.benefits.filter((b: unknown) => typeof b === 'string') : [],
      remote_label: typeof data.remote_label === 'string' ? data.remote_label : null,
      remote_reality: remoteReality,
      remote_notes: typeof data.remote_notes === 'string' ? data.remote_notes : null,
      posted_at: typeof data.posted_at === 'string' ? data.posted_at : null,
      suggested_leader_name: typeof data.suggested_leader_name === 'string' ? data.suggested_leader_name : null,
      suggested_leader_title: typeof data.suggested_leader_title === 'string' ? data.suggested_leader_title : null,
      suggested_leader_linkedin: typeof data.suggested_leader_linkedin === 'string' ? data.suggested_leader_linkedin : null,
    }
  } catch {
    return null
  }
}

export async function enrichJob(description: string): Promise<EnrichmentResult | null> {
  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'You are a structured data extractor for job postings. Return only valid JSON, no explanation.',
    messages: [{ role: 'user', content: buildEnrichmentPrompt(description) }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return parseEnrichmentResponse(text)
}
```

- [ ] **Step 4: Run and verify passes**
```bash
npm test __tests__/enrichment.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add lib/enrichment.ts __tests__/enrichment.test.ts
git commit -m "feat: add Claude API enrichment with parsing and prompt builder"
```

---

### Task 9: Cron API Route + vercel.json

**Files:**
- Create: `app/api/cron/scrape/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create `app/api/cron/scrape/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { scrapeAllBoards, fetchJobDescription } from '@/lib/scraper'
import { enrichJob } from '@/lib/enrichment'

export const maxDuration = 60 // Vercel Pro max

// Vercel Cron sends GET requests (not POST)
export async function GET(req: NextRequest) {
  // Validate cron secret — Vercel automatically passes this via Authorization header
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const summary = { scraped: 0, inserted: 0, enriched: 0, failed: 0 }

  // Step 1: Scrape new jobs from all boards
  try {
    const jobs = await scrapeAllBoards()
    summary.scraped = jobs.length

    for (const job of jobs) {
      const description = await fetchJobDescription(job.url)
      const { error } = await supabase
        .from('jobs')
        .upsert(
          {
            title: job.title,
            company: job.company,
            url: job.url,
            source_board: job.source_board,
            raw_description: description,
            enrichment_status: 'pending',
            enrichment_attempts: 0,
          },
          { onConflict: 'url', ignoreDuplicates: true }
        )
      if (!error) summary.inserted++
    }
  } catch (e) {
    console.error('[cron] scrape step failed:', e)
  }

  // Step 2: Enrich pending/failed jobs (max 20 per run)
  const { data: pendingJobs } = await supabase
    .from('jobs')
    .select('id, raw_description, enrichment_attempts')
    .in('enrichment_status', ['pending', 'failed'])
    .lt('enrichment_attempts', 5)
    .limit(20)

  for (const job of pendingJobs ?? []) {
    try {
      const result = await enrichJob(job.raw_description)
      if (result) {
        await supabase
          .from('jobs')
          .update({
            ...result,
            enrichment_status: 'done',
          })
          .eq('id', job.id)
        summary.enriched++
      } else {
        await supabase
          .from('jobs')
          .update({
            enrichment_status: 'failed',
            enrichment_attempts: job.enrichment_attempts + 1,
          })
          .eq('id', job.id)
        summary.failed++
      }
    } catch (e) {
      console.error(`[cron] enrich job ${job.id} failed:`, e)
      await supabase
        .from('jobs')
        .update({
          enrichment_status: 'failed',
          enrichment_attempts: job.enrichment_attempts + 1,
        })
        .eq('id', job.id)
      summary.failed++
    }
  }

  return NextResponse.json({ ok: true, summary })
}
```

- [ ] **Step 2: Create `vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Note: Vercel Cron sends GET requests. Vercel automatically injects `Authorization: Bearer $CRON_SECRET` on every cron invocation when `CRON_SECRET` is set as a project environment variable. No explicit `headers` entry needed in `vercel.json` — Vercel handles this. Just ensure `CRON_SECRET` is set in the Vercel project settings.

- [ ] **Step 3: Test the cron route locally**
```bash
# Start dev server
npm run dev

# In another terminal, trigger the cron manually (GET request)
curl http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"
```
Expected: `{"ok":true,"summary":{"scraped":N,"inserted":M,"enriched":P,"failed":Q}}`

- [ ] **Step 4: Commit**
```bash
git add app/api/cron/ vercel.json
git commit -m "feat: add cron scrape endpoint and vercel.json schedule"
```

---

## Chunk 3: API Routes (Pipeline, Notes, Leader)

### File Map (Chunk 3)
| File | Action | Purpose |
|------|--------|---------|
| `app/api/pipeline/route.ts` | Create | POST add to pipeline, GET undiscovered count |
| `app/api/pipeline/[entryId]/route.ts` | Create | PATCH status update |
| `app/api/pipeline/[entryId]/notes/route.ts` | Create | GET list notes, POST add note |
| `app/api/pipeline/[entryId]/leader/route.ts` | Create | GET leader, PUT upsert |
| `app/api/pipeline/[entryId]/leader/confirm/route.ts` | Create | PATCH confirm |

---

> **Deferred endpoints:** The spec lists `GET /api/pipeline` (list entries) and `DELETE /api/pipeline/[entryId]` (remove from pipeline). These are NOT implemented in this plan — the pipeline page fetches directly via RSC, and there is no delete UI in v1. If needed in future, add them to `app/api/pipeline/route.ts` and `app/api/pipeline/[entryId]/route.ts` respectively.

### Task 10: POST /api/pipeline (Add to Pipeline)

**Files:**
- Create: `app/api/pipeline/route.ts`

- [ ] **Step 1: Create `app/api/pipeline/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { PipelineStatus } from '@/lib/types'

const VALID_STATUSES: PipelineStatus[] = ['researching', 'discarded']

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.job_id) {
    return NextResponse.json({ error: 'job_id required' }, { status: 400 })
  }

  const status: PipelineStatus = VALID_STATUSES.includes(body.status) ? body.status : 'researching'

  const { data: entry, error } = await supabase
    .from('user_pipeline_entries')
    .insert({ user_id: user.id, job_id: body.job_id, status })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // unique violation
      return NextResponse.json({ error: 'Already in pipeline' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If researching, copy AI-suggested leader from jobs table
  if (status === 'researching') {
    const { data: job } = await supabase
      .from('jobs')
      .select('suggested_leader_name, suggested_leader_title, suggested_leader_linkedin')
      .eq('id', body.job_id)
      .single()

    if (job?.suggested_leader_name) {
      await supabase.from('leaders').insert({
        entry_id: entry.id,
        user_id: user.id,
        name: job.suggested_leader_name,
        title: job.suggested_leader_title,
        linkedin_url: job.suggested_leader_linkedin,
        confirmed: false,
      })
    }
  }

  return NextResponse.json({ entry })
}
```

- [ ] **Step 2: Test via curl**
```bash
# First get your session token from browser dev tools (Application → Cookies → sb-*-auth-token)
# Then:
curl -X POST http://localhost:3000/api/pipeline \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"job_id":"SOME_JOB_UUID"}'
```
Expected: `{"entry":{"id":"...","status":"researching",...}}`

- [ ] **Step 3: Commit**
```bash
git add app/api/pipeline/route.ts
git commit -m "feat: add POST /api/pipeline endpoint"
```

---

### Task 11: PATCH /api/pipeline/[entryId] (Update Status)

**Files:**
- Create: `app/api/pipeline/[entryId]/route.ts`

- [ ] **Step 1: Create `app/api/pipeline/[entryId]/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { PipelineStatus } from '@/lib/types'

const VALID_PATCH_STATUSES: PipelineStatus[] = ['researching', 'applied', 'interview', 'offer', 'discarded']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.status || !VALID_PATCH_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: entry, error } = await supabase
    .from('user_pipeline_entries')
    .update({ status: body.status })
    .eq('id', entryId)
    .eq('user_id', user.id) // RLS double-check
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ entry })
}
```

- [ ] **Step 2: Commit**
```bash
git add app/api/pipeline/
git commit -m "feat: add PATCH /api/pipeline/[entryId] status update"
```

---

### Task 12: Notes API

**Files:**
- Create: `app/api/pipeline/[entryId]/notes/route.ts`

- [ ] **Step 1: Create `app/api/pipeline/[entryId]/notes/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: notes, error } = await supabase
    .from('job_notes')
    .select('id, content, created_at')
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  }

  const { data: note, error } = await supabase
    .from('job_notes')
    .insert({ entry_id: entryId, user_id: user.id, content: body.content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note })
}
```

- [ ] **Step 2: Commit**
```bash
git add app/api/pipeline/
git commit -m "feat: add GET+POST /api/pipeline/[entryId]/notes"
```

---

### Task 13: Leader API

**Files:**
- Create: `app/api/pipeline/[entryId]/leader/route.ts`
- Create: `app/api/pipeline/[entryId]/leader/confirm/route.ts`

- [ ] **Step 1: Create `app/api/pipeline/[entryId]/leader/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const LINKEDIN_PATTERN = /^https:\/\/(www\.)?linkedin\.com\/in\//

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: leader } = await supabase
    .from('leaders')
    .select('*')
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ leader: leader ?? null })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }
  if (body.linkedin_url && !LINKEDIN_PATTERN.test(body.linkedin_url)) {
    return NextResponse.json(
      { error: 'linkedin_url must start with https://linkedin.com/in/' },
      { status: 400 }
    )
  }

  const payload = {
    entry_id: entryId,
    user_id: user.id,
    name: body.name.trim(),
    title: body.title?.trim() ?? null,
    linkedin_url: body.linkedin_url ?? null,
    notes: body.notes?.trim() ?? null,
  }

  const { data: leader, error } = await supabase
    .from('leaders')
    .upsert(payload, { onConflict: 'entry_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leader })
}
```

- [ ] **Step 2: Create `app/api/pipeline/[entryId]/leader/confirm/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check existence first — .update().single() returns error (not null) when 0 rows match
  const { data: existing } = await supabase
    .from('leaders')
    .select('id')
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Leader not found' }, { status: 404 })

  const { data: leader, error } = await supabase
    .from('leaders')
    .update({ confirmed: true })
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leader })
}
```

- [ ] **Step 3: Run all tests**
```bash
npm test
```
Expected: all tests pass

- [ ] **Step 4: Commit**
```bash
git add app/api/pipeline/
git commit -m "feat: add leader GET/PUT and confirm PATCH endpoints"
```

---

## Chunk 4: Frontend — Components + Pages

### File Map (Chunk 4)
| File | Action | Purpose |
|------|--------|---------|
| `components/Nav.tsx` | Create | Navigation with discover badge |
| `components/RemoteBadge.tsx` | Create | Color-coded remote_reality badge |
| `components/JobCard.tsx` | Create | Card for /discover page |
| `components/PipelineCard.tsx` | Create | Card for kanban columns |
| `components/KanbanBoard.tsx` | Create | Kanban with 5 columns + arrow buttons |
| `components/LeaderSection.tsx` | Create | Leader display + confirm/edit form |
| `components/NotesSection.tsx` | Create | Notes list + add form |
| `components/StatusDropdown.tsx` | Create | Status selector |
| `app/(main)/layout.tsx` | Create | Authenticated layout with Nav |
| `app/(main)/discover/page.tsx` | Create | Discover page (RSC) |
| `app/(main)/discover/DiscoverClient.tsx` | Create | Client component for job cards + load more |
| `app/api/jobs/undiscovered/route.ts` | Create | GET undiscovered jobs for cursor pagination |
| `app/(main)/pipeline/page.tsx` | Create | Pipeline page (RSC) |
| `app/(main)/jobs/[id]/page.tsx` | Create | Job detail page (RSC) |
| `app/(main)/jobs/[id]/JobDetailClient.tsx` | Create | Interactive client parts |

Note: Pages are wrapped in `app/(main)/` route group so they share the Nav layout without affecting URL paths.

---

### Task 14: Navigation + Layout

**Files:**
- Create: `components/Nav.tsx`
- Create: `app/(main)/layout.tsx`

- [ ] **Step 1: Create `components/Nav.tsx`**
```typescript
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface NavProps {
  discoverCount: number
}

export function Nav({ discoverCount }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLink = (href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        pathname === href
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-xs font-bold">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-slate-900 mr-4">Legal Ops CRM</span>
          {navLink('/discover', 'Discover', discoverCount)}
          {navLink('/pipeline', 'Pipeline')}
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create `app/(main)/layout.tsx`**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Nav } from '@/components/Nav'
import { redirect } from 'next/navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's pipeline job IDs first, then count jobs not in that list
  const { data: pipeline } = await supabase
    .from('user_pipeline_entries')
    .select('job_id')
    .eq('user_id', user.id)

  const excludedIds = pipeline?.map(e => e.job_id) ?? []

  let countQuery = supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'done')

  if (excludedIds.length > 0) {
    // PostgREST NOT IN with a literal list of UUIDs
    countQuery = countQuery.not('id', 'in', `(${excludedIds.join(',')})`)
  }

  const { count } = await countQuery

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav discoverCount={count ?? 0} />
      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Move app/login to be outside the (main) group**

Move `app/login/page.tsx` to remain at `app/login/page.tsx` (no change needed — it's already outside the route group).

- [ ] **Step 4: Commit**
```bash
git add components/Nav.tsx app/\(main\)/
git commit -m "feat: add Nav component and authenticated layout"
```

---

### Task 15: Remote Badge Component

**Files:**
- Create: `components/RemoteBadge.tsx`

- [ ] **Step 1: Create `components/RemoteBadge.tsx`**
```typescript
import type { RemoteReality } from '@/lib/types'

const CONFIG: Record<RemoteReality, { label: string; className: string }> = {
  fully_remote: { label: '100% Remote', className: 'bg-green-100 text-green-800' },
  remote_with_travel: { label: 'Remote + Travel', className: 'bg-blue-100 text-blue-800' },
  hybrid_disguised: { label: 'Hybrid (⚠ verify)', className: 'bg-yellow-100 text-yellow-800' },
  onsite: { label: 'On-site', className: 'bg-slate-100 text-slate-600' },
  unknown: { label: 'Remote?', className: 'bg-slate-100 text-slate-500' },
}

export function RemoteBadge({ reality }: { reality: RemoteReality }) {
  const { label, className } = CONFIG[reality] ?? CONFIG.unknown
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add components/RemoteBadge.tsx
git commit -m "feat: add RemoteBadge component"
```

---

### Task 16: Discover Page

**Files:**
- Create: `components/JobCard.tsx`
- Create: `app/(main)/discover/page.tsx`

- [ ] **Step 1: Create `components/JobCard.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { RemoteBadge } from './RemoteBadge'
import type { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
  onAction: (jobId: string, action: 'add' | 'ignore') => void
}

function formatSalary(job: Job): string {
  if (!job.salary_min && !job.salary_max) return 'Not disclosed'
  const currency = job.salary_currency ?? ''
  if (job.salary_min && job.salary_max) {
    return `${currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
  }
  return `${currency} ${(job.salary_min ?? job.salary_max)!.toLocaleString()}`
}

export function JobCard({ job, onAction }: JobCardProps) {
  const [loading, setLoading] = useState<'add' | 'ignore' | null>(null)

  async function handleAction(action: 'add' | 'ignore') {
    setLoading(action)
    await onAction(job.id, action)
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900 leading-tight">{job.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <RemoteBadge reality={job.remote_reality} />
        <span className="text-xs text-slate-500">{formatSalary(job)}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAction('add')}
          disabled={loading !== null}
          className="flex-1 bg-blue-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading === 'add' ? '...' : 'Add to Pipeline'}
        </button>
        <button
          onClick={() => handleAction('ignore')}
          disabled={loading !== null}
          className="flex-1 bg-slate-100 text-slate-600 text-xs font-medium py-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
        >
          {loading === 'ignore' ? '...' : 'Ignore'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/api/jobs/undiscovered/route.ts`** (needed for client-side load more)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const before = req.nextUrl.searchParams.get('before')

  const { data: pipeline } = await supabase
    .from('user_pipeline_entries')
    .select('job_id')
    .eq('user_id', user.id)

  const excludedIds = pipeline?.map(e => e.job_id) ?? []

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(20)

  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`)
  }
  if (before) {
    query = query.lt('created_at', before)
  }

  const { data: jobs } = await query
  return NextResponse.json({ jobs: jobs ?? [] })
}
```

- [ ] **Step 3: Create `app/(main)/discover/page.tsx`**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DiscoverClient } from './DiscoverClient'

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's pipeline job IDs to exclude
  const { data: pipeline } = await supabase
    .from('user_pipeline_entries')
    .select('job_id')
    .eq('user_id', user!.id)

  const excludedIds = pipeline?.map(e => e.job_id) ?? []

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(20)

  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`)
  }

  const { data: jobs } = await query

  return <DiscoverClient initialJobs={jobs ?? []} />
}
```

- [ ] **Step 3: Create `app/(main)/discover/DiscoverClient.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JobCard } from '@/components/JobCard'
import type { Job } from '@/lib/types'

export function DiscoverClient({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [loadingMore, setLoadingMore] = useState(false)
  // Track whether a full page was returned (not current list length — list shrinks as user actions cards)
  const [hasMore, setHasMore] = useState(initialJobs.length === 20)
  const router = useRouter()

  async function handleAction(jobId: string, action: 'add' | 'ignore') {
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        status: action === 'ignore' ? 'discarded' : 'researching',
      }),
    })
    if (res.ok) {
      setJobs(prev => prev.filter(j => j.id !== jobId))
      router.refresh() // update nav badge
    }
  }

  async function loadMore() {
    if (!jobs.length) return
    setLoadingMore(true)
    const last = jobs[jobs.length - 1]
    const res = await fetch(
      `/api/jobs/undiscovered?before=${encodeURIComponent(last.created_at)}`
    )
    if (res.ok) {
      const { jobs: more } = await res.json()
      setJobs(prev => [...prev, ...more]) // append — does not replace existing cards
      setHasMore(more.length === 20) // only show Load more if a full page was returned
    }
    setLoadingMore(false)
  }

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="text-sm">No new jobs found.</p>
        <p className="text-xs mt-1 text-slate-400">Next search runs tomorrow at 7am.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        New Jobs ({jobs.length})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} onAction={handleAction} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**
```bash
git add components/JobCard.tsx app/\(main\)/discover/
git commit -m "feat: add discover page with job cards and add/ignore actions"
```

---

### Task 17: Pipeline Kanban

**Files:**
- Create: `components/PipelineCard.tsx`
- Create: `components/KanbanBoard.tsx`
- Create: `app/(main)/pipeline/page.tsx`

- [ ] **Step 1: Create `components/PipelineCard.tsx`**
```typescript
import Link from 'next/link'
import { RemoteBadge } from './RemoteBadge'
import type { PipelineEntryWithJob, PipelineStatus } from '@/lib/types'

interface PipelineCardProps {
  entry: PipelineEntryWithJob
  canMoveLeft: boolean
  canMoveRight: boolean
  onMove: (entryId: string, direction: 'left' | 'right') => void
}

function formatSalary(entry: PipelineEntryWithJob): string {
  const { salary_min, salary_max, salary_currency } = entry.job
  if (!salary_min && !salary_max) return ''
  const cur = salary_currency ?? ''
  if (salary_min && salary_max) return `${cur} ${salary_min.toLocaleString()}–${salary_max.toLocaleString()}`
  return `${cur} ${(salary_min ?? salary_max)!.toLocaleString()}`
}

export function PipelineCard({ entry, canMoveLeft, canMoveRight, onMove }: PipelineCardProps) {
  return (
    <Link href={`/jobs/${entry.id}`}>
      <div className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-slate-900 leading-tight truncate">{entry.job.title}</h4>
          <p className="text-xs text-slate-500 truncate">{entry.job.company}</p>
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <RemoteBadge reality={entry.job.remote_reality} />
        </div>
        {formatSalary(entry) && (
          <p className="text-xs text-slate-400 mb-2">{formatSalary(entry)}</p>
        )}
        <div
          className="flex gap-1 pt-2 border-t border-slate-100"
          onClick={e => e.preventDefault()} // prevent Link navigation
        >
          <button
            disabled={!canMoveLeft}
            onClick={e => { e.preventDefault(); onMove(entry.id, 'left') }}
            className="flex-1 py-1 text-xs text-slate-500 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          <button
            disabled={!canMoveRight}
            onClick={e => { e.preventDefault(); onMove(entry.id, 'right') }}
            className="flex-1 py-1 text-xs text-slate-500 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create `components/KanbanBoard.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { PipelineCard } from './PipelineCard'
import type { PipelineEntryWithJob, PipelineStatus } from '@/lib/types'

const COLUMNS: { label: string; status: PipelineStatus }[] = [
  { label: 'Pesquisando', status: 'researching' },
  { label: 'Aplicada', status: 'applied' },
  { label: 'Entrevista', status: 'interview' },
  { label: 'Oferta', status: 'offer' },
  { label: 'Descartada', status: 'discarded' },
]

const STATUS_ORDER = COLUMNS.map(c => c.status)

export function KanbanBoard({ initialEntries }: { initialEntries: PipelineEntryWithJob[] }) {
  const [entries, setEntries] = useState(initialEntries)

  async function handleMove(entryId: string, direction: 'left' | 'right') {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    const currentIdx = STATUS_ORDER.indexOf(entry.status)
    const newIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1
    if (newIdx < 0 || newIdx >= STATUS_ORDER.length) return
    const newStatus = STATUS_ORDER[newIdx]

    // Optimistic update
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: newStatus } : e))

    const res = await fetch(`/api/pipeline/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      // Revert on failure
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: entry.status } : e))
    }
  }

  return (
    <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-64px)]">
      {COLUMNS.map((col, colIdx) => {
        const colEntries = entries.filter(e => e.status === col.status)
        return (
          <div key={col.status} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                {colEntries.length}
              </span>
            </div>
            <div className="space-y-2 bg-slate-100 rounded-xl p-2 min-h-24">
              {colEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No jobs here yet</p>
              ) : (
                colEntries.map(entry => (
                  <PipelineCard
                    key={entry.id}
                    entry={entry}
                    canMoveLeft={colIdx > 0}
                    canMoveRight={colIdx < COLUMNS.length - 1}
                    onMove={handleMove}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(main)/pipeline/page.tsx`**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { KanbanBoard } from '@/components/KanbanBoard'
import type { PipelineEntryWithJob } from '@/lib/types'

export default async function PipelinePage() {
  const supabase = await createServerSupabaseClient()

  const { data: entries } = await supabase
    .from('user_pipeline_entries')
    .select('*, job:jobs(*)')
    .order('created_at', { ascending: false })

  return <KanbanBoard initialEntries={(entries ?? []) as PipelineEntryWithJob[]} />
}
```

- [ ] **Step 4: Commit**
```bash
git add components/PipelineCard.tsx components/KanbanBoard.tsx app/\(main\)/pipeline/
git commit -m "feat: add pipeline Kanban board with 5 columns"
```

---

### Task 18: Job Detail Page

**Files:**
- Create: `components/LeaderSection.tsx`
- Create: `components/NotesSection.tsx`
- Create: `components/StatusDropdown.tsx`
- Create: `app/(main)/jobs/[id]/page.tsx`
- Create: `app/(main)/jobs/[id]/JobDetailClient.tsx`

- [ ] **Step 1: Create `components/StatusDropdown.tsx`**
```typescript
'use client'

import { useState } from 'react'
import type { PipelineStatus } from '@/lib/types'

const OPTIONS: { value: PipelineStatus; label: string }[] = [
  { value: 'researching', label: 'Pesquisando' },
  { value: 'applied', label: 'Aplicada' },
  { value: 'interview', label: 'Entrevista' },
  { value: 'offer', label: 'Oferta' },
  { value: 'discarded', label: 'Descartada' },
]

interface StatusDropdownProps {
  entryId: string
  currentStatus: PipelineStatus
}

export function StatusDropdown({ entryId, currentStatus }: StatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)

  async function handleChange(newStatus: PipelineStatus) {
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setStatus(newStatus)
    setSaving(false)
  }

  return (
    <select
      value={status}
      onChange={e => handleChange(e.target.value as PipelineStatus)}
      disabled={saving}
      className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: Create `components/LeaderSection.tsx`**
```typescript
'use client'

import { useState } from 'react'
import type { Leader } from '@/lib/types'

interface LeaderSectionProps {
  entryId: string
  initialLeader: Leader | null
}

export function LeaderSection({ entryId, initialLeader }: LeaderSectionProps) {
  const [leader, setLeader] = useState<Leader | null>(initialLeader)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: initialLeader?.name ?? '',
    title: initialLeader?.title ?? '',
    linkedin_url: initialLeader?.linkedin_url ?? '',
    notes: initialLeader?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}/leader/confirm`, { method: 'PATCH' })
    if (res.ok) {
      const { leader: updated } = await res.json()
      setLeader(updated)
    }
    setSaving(false)
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}/leader`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setSaving(false)
      return
    }
    setLeader(data.leader)
    setEditing(false)
    setSaving(false)
  }

  if (!leader && !editing) {
    return (
      <div className="text-xs text-slate-400">
        No leader found.{' '}
        <button
          onClick={() => setEditing(true)}
          className="text-blue-600 hover:underline"
        >
          Add
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="space-y-2">
        {(['name', 'title', 'linkedin_url', 'notes'] as const).map(field => (
          <div key={field}>
            <label className="block text-xs font-medium text-slate-600 mb-0.5 capitalize">
              {field.replace('_', ' ')}
            </label>
            <input
              value={form[field]}
              onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={field === 'linkedin_url' ? 'https://linkedin.com/in/...' : ''}
            />
          </div>
        ))}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1 text-slate-500 text-xs rounded hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900">{leader!.name}</span>
        {leader!.confirmed ? (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Confirmed</span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">AI Suggestion</span>
        )}
      </div>
      {leader!.title && <p className="text-xs text-slate-500">{leader!.title}</p>}
      {leader!.linkedin_url && (
        <a href={leader!.linkedin_url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline block">
          LinkedIn →
        </a>
      )}
      {leader!.notes && <p className="text-xs text-slate-400 italic mt-1">{leader!.notes}</p>}
      <div className="flex gap-2 mt-2">
        {!leader!.confirmed && (
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
          >
            Confirm
          </button>
        )}
        <button
          onClick={() => {
            setForm({ name: leader!.name ?? '', title: leader!.title ?? '', linkedin_url: leader!.linkedin_url ?? '', notes: leader!.notes ?? '' })
            setEditing(true)
          }}
          className="px-2 py-1 text-xs text-slate-500 rounded hover:bg-slate-100"
        >
          Edit
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/NotesSection.tsx`**
```typescript
'use client'

import { useState } from 'react'
import type { JobNote } from '@/lib/types'

interface NotesSectionProps {
  entryId: string
  initialNotes: JobNote[]
}

export function NotesSection({ entryId, initialNotes }: NotesSectionProps) {
  const [notes, setNotes] = useState<JobNote[]>(initialNotes)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const { note } = await res.json()
      setNotes(prev => [note, ...prev])
      setContent('')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !content.trim()}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 self-start"
        >
          {saving ? '...' : 'Add'}
        </button>
      </div>
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="bg-slate-50 rounded-lg px-3 py-2">
              <p className="text-sm text-slate-700">{note.content}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(main)/jobs/[id]/page.tsx`**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { JobDetailClient } from './JobDetailClient'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: entry } = await supabase
    .from('user_pipeline_entries')
    .select('*, job:jobs(*)')
    .eq('id', id)
    .single()

  if (!entry) notFound()

  const { data: leader } = await supabase
    .from('leaders')
    .select('*')
    .eq('entry_id', id)
    .maybeSingle()

  const { data: notes } = await supabase
    .from('job_notes')
    .select('*')
    .eq('entry_id', id)
    .order('created_at', { ascending: false })

  return (
    <JobDetailClient
      entry={entry as never}
      leader={leader ?? null}
      notes={notes ?? []}
    />
  )
}
```

- [ ] **Step 5: Create `app/(main)/jobs/[id]/JobDetailClient.tsx`**
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { RemoteBadge } from '@/components/RemoteBadge'
import { StatusDropdown } from '@/components/StatusDropdown'
import { LeaderSection } from '@/components/LeaderSection'
import { NotesSection } from '@/components/NotesSection'
import type { PipelineEntryWithJob, Leader, JobNote } from '@/lib/types'

interface Props {
  entry: PipelineEntryWithJob
  leader: Leader | null
  notes: JobNote[]
}

export function JobDetailClient({ entry, leader, notes }: Props) {
  const router = useRouter()
  const job = entry.job

  async function handleApply() {
    window.open(job.url, '_blank', 'noopener')
    if (entry.status === 'researching') {
      await fetch(`/api/pipeline/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'applied' }),
      })
      router.refresh()
    }
  }

  function formatSalary(): string {
    if (!job.salary_min && !job.salary_max) return 'Not disclosed'
    const cur = job.salary_currency ?? ''
    if (job.salary_min && job.salary_max)
      return `${cur} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
    return `${cur} ${(job.salary_min ?? job.salary_max)!.toLocaleString()}`
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{job.title}</h1>
            <p className="text-slate-500 text-sm">{job.company}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusDropdown entryId={entry.id} currentStatus={entry.status} />
            <button
              onClick={handleApply}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply →
            </button>
          </div>
        </div>
      </div>

      {/* Remote */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Remote</h2>
        <div className="flex items-center gap-2">
          <RemoteBadge reality={job.remote_reality} />
          {job.remote_notes && (
            <span className="text-xs text-slate-500">{job.remote_notes}</span>
          )}
        </div>
        {job.remote_label && (
          <p className="text-xs text-slate-400 mt-1">Posted as: "{job.remote_label}"</p>
        )}
      </section>

      {/* Salary */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Salary</h2>
        <p className="text-sm text-slate-700">{formatSalary()}</p>
      </section>

      {/* Benefits */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Benefits</h2>
        {job.benefits.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {job.benefits.map((b, i) => (
              <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{b}</span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Not disclosed</p>
        )}
      </section>

      {/* Leader */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Direct Manager</h2>
        <LeaderSection entryId={entry.id} initialLeader={leader} />
      </section>

      {/* Notes */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notes</h2>
        <NotesSection entryId={entry.id} initialNotes={notes} />
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Run all tests**
```bash
npm test
```
Expected: all tests pass

- [ ] **Step 7: Test full app flow in browser**
```bash
npm run dev
```
Walk through:
1. http://localhost:3000 → redirects to /login
2. Create account → redirects to /discover
3. Trigger cron manually to populate jobs (GET request):
   ```bash
   curl http://localhost:3000/api/cron/scrape \
     -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"
   ```
4. Refresh /discover → jobs appear
5. Click "Add to Pipeline" → job disappears from discover
6. Navigate to /pipeline → job appears in "Pesquisando" column
7. Click job card → navigate to /jobs/[id]
8. Verify all sections render (remote, salary, benefits, leader, notes)
9. Add a note → note appears below
10. Click "Apply" → opens job URL in new tab, status changes to "Aplicada"

- [ ] **Step 8: Commit**
```bash
git add components/ app/\(main\)/jobs/
git commit -m "feat: add job detail page with leader, notes, and status management"
```

---

### Task 19: Build, Deploy to Vercel

- [ ] **Step 1: Production build check**
```bash
npm run build
```
Expected: `✓ Compiled successfully`. Fix any TypeScript or build errors before continuing.

- [ ] **Step 2: Set environment variables in Vercel**

Go to your Veloz/Vercel project settings → Environment Variables. Add:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
CRON_SECRET
```

- [ ] **Step 3: Push to main branch to trigger deploy**
```bash
git push origin main
```

- [ ] **Step 4: Verify deployed app**
Open the Vercel URL → test login, discover, pipeline, job detail.

- [ ] **Step 5: Clean up old artifact**

The Next.js app is server-rendered and does NOT produce a single standalone HTML file. The `legal-ops-crm.html` artifact in the repo root is from the previous Vite prototype and no longer reflects the full app. Delete it:
```bash
rm -f legal-ops-crm.html
```
The canonical production version is the Vercel deployment. For demos, share the Vercel URL.

- [ ] **Step 6: Final commit**
```bash
git add -A
git commit -m "feat: complete Legal Ops CRM v1 - Next.js + Supabase + Claude API"
git push origin main
```

---

## Quick Reference

### Run tests
```bash
npm test
```

### Start dev server
```bash
npm run dev
```

### Manually trigger cron (dev)
```bash
curl http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Key files at a glance
| What | Where |
|------|-------|
| TypeScript types | `lib/types.ts` |
| Scraper + slug list | `lib/scraper.ts` |
| Claude enrichment | `lib/enrichment.ts` |
| Cron endpoint | `app/api/cron/scrape/route.ts` |
| Pipeline API | `app/api/pipeline/` |
| Discover page | `app/(main)/discover/` |
| Pipeline Kanban | `app/(main)/pipeline/` |
| Job detail | `app/(main)/jobs/[id]/` |
| DB schema | `supabase/migrations/001_initial_schema.sql` |
