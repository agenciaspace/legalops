'use client'

import Link from 'next/link'
import type { RemoteReality } from '@/lib/types'

type Locale = 'pt' | 'en'

export interface LandingJob {
  id: string
  title: string
  company: string
  remote_reality: RemoteReality
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
}

const REMOTE_CONFIG: Record<RemoteReality, { pt: string; en: string; className: string }> = {
  fully_remote: { pt: '100% Remoto', en: '100% Remote', className: 'bg-green-100 text-green-800' },
  remote_with_travel: { pt: 'Remoto + Viagem', en: 'Remote + Travel', className: 'bg-blue-100 text-blue-800' },
  hybrid_disguised: { pt: 'Híbrido', en: 'Hybrid', className: 'bg-yellow-100 text-yellow-800' },
  onsite: { pt: 'Presencial', en: 'On-site', className: 'bg-slate-100 text-slate-600' },
  unknown: { pt: 'Remoto?', en: 'Remote?', className: 'bg-slate-100 text-slate-500' },
}

function formatSalary(job: LandingJob): string | null {
  if (!job.salary_min && !job.salary_max) return null
  const cur = job.salary_currency ?? ''
  const fmt = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}k`
    return n.toLocaleString()
  }
  if (job.salary_min && job.salary_max) return `${cur} ${fmt(job.salary_min)} – ${fmt(job.salary_max)}`
  return `${cur} ${fmt((job.salary_min ?? job.salary_max)!)}`
}

const FALLBACK_JOBS: Record<Locale, LandingJob[]> = {
  pt: [
    { id: 'f1', title: 'Legal Operations Manager', company: 'Stripe', remote_reality: 'fully_remote', salary_min: 130000, salary_max: 160000, salary_currency: 'USD' },
    { id: 'f2', title: 'CLM Implementation Lead', company: 'Notion', remote_reality: 'remote_with_travel', salary_min: 115000, salary_max: 145000, salary_currency: 'USD' },
    { id: 'f3', title: 'Contract Operations Analyst', company: 'Figma', remote_reality: 'fully_remote', salary_min: 95000, salary_max: 120000, salary_currency: 'USD' },
  ],
  en: [
    { id: 'f1', title: 'Legal Operations Manager', company: 'Stripe', remote_reality: 'fully_remote', salary_min: 130000, salary_max: 160000, salary_currency: 'USD' },
    { id: 'f2', title: 'CLM Implementation Lead', company: 'Notion', remote_reality: 'remote_with_travel', salary_min: 115000, salary_max: 145000, salary_currency: 'USD' },
    { id: 'f3', title: 'Contract Operations Analyst', company: 'Figma', remote_reality: 'fully_remote', salary_min: 95000, salary_max: 120000, salary_currency: 'USD' },
  ],
}

const labels = {
  pt: { cta: 'Entre para ver detalhes' },
  en: { cta: 'Sign in to see details' },
}

export function LandingJobCards({ locale, jobs }: { locale: Locale; jobs: LandingJob[] }) {
  const items = jobs.length > 0 ? jobs.slice(0, 6) : FALLBACK_JOBS[locale]

  return (
    <div className="animate-subtle-float">
      <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-lg">
        {/* Browser-style top bar */}
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        </div>

        {/* Job cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {items.map((job, i) => (
            <Link
              key={job.id}
              href="/login"
              className="animate-fade-slide-up rounded-xl border border-slate-200 p-3 transition-colors hover:border-blue-200 hover:shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <p className="text-xs font-semibold text-slate-900 truncate">
                {job.title}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{job.company}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${REMOTE_CONFIG[job.remote_reality]?.className ?? REMOTE_CONFIG.unknown.className}`}
                >
                  {REMOTE_CONFIG[job.remote_reality]?.[locale] ?? REMOTE_CONFIG.unknown[locale]}
                </span>
              </div>
              {formatSalary(job) && (
                <p className="mt-1.5 text-[11px] text-slate-500">{formatSalary(job)}</p>
              )}
            </Link>
          ))}
        </div>

        {/* Login gate */}
        <Link
          href="/login"
          className="mt-4 flex items-center justify-center rounded-xl bg-slate-50 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          {labels[locale].cta} →
        </Link>
      </div>
    </div>
  )
}
