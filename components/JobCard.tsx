'use client'

import { useState } from 'react'
import { RemoteBadge } from './RemoteBadge'
import { useLocale } from '@/components/LocaleProvider'
import type { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
  onAction: (jobId: string, action: 'add' | 'ignore') => void
}

export function JobCard({ job, onAction }: JobCardProps) {
  const [loading, setLoading] = useState<'add' | 'ignore' | null>(null)
  const { t } = useLocale()

  function formatSalary(): string {
    if (!job.salary_min && !job.salary_max) return t.common.salaryNotDisclosed
    const currency = job.salary_currency ?? ''
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
    }
    return `${currency} ${(job.salary_min ?? job.salary_max)!.toLocaleString()}`
  }

  function daysAgo(dateStr: string): string {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days === 0) return t.common.today
    if (days === 1) return t.common.yesterday
    return t.common.daysAgo.replace('{n}', String(days))
  }

  async function handleAction(action: 'add' | 'ignore') {
    setLoading(action)
    await onAction(job.id, action)
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900 leading-tight">{job.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <RemoteBadge reality={job.remote_reality} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-500">{formatSalary()}</span>
        <span className="text-xs text-slate-400">{daysAgo(job.created_at)}</span>
      </div>

      {job.benefits.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.benefits.slice(0, 3).map((b, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-xs">{b}</span>
          ))}
          {job.benefits.length > 3 && (
            <span className="px-1.5 py-0.5 text-slate-400 text-xs">+{job.benefits.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleAction('add')}
          disabled={loading !== null}
          className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading === 'add' ? '...' : t.jobCard.add}
        </button>
        <button
          onClick={() => handleAction('ignore')}
          disabled={loading !== null}
          className="flex-1 bg-slate-100 text-slate-600 text-xs font-medium py-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
        >
          {loading === 'ignore' ? '...' : t.jobCard.ignore}
        </button>
      </div>
    </div>
  )
}
