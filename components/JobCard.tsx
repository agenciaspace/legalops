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
