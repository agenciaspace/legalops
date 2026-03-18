'use client'

import { useState } from 'react'
import { RemoteBadge } from './RemoteBadge'
import { formatSalary, hasSalary } from '@/lib/format-salary'
import type { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
  onAction: (jobId: string, action: 'add' | 'ignore') => void
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  return `ha ${days} dias`
}

export function JobCard({ job, onAction }: JobCardProps) {
  const [loading, setLoading] = useState<'add' | 'ignore' | null>(null)

  async function handleAction(action: 'add' | 'ignore') {
    setLoading(action)
    await onAction(job.id, action)
    setLoading(null)
  }

  const isDead = job.url_status === 'dead'

  return (
    <div className={`bg-white rounded-2xl border border-[#1A1A1A]/10 p-4 shadow-sm hover:shadow-md hover:border-[#FF6A00]/30 transition-all ${isDead ? 'opacity-60' : ''}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A] leading-tight">
          {job.title}
          {isDead && <span className="ml-1.5 text-xs font-normal text-amber-500">Possivelmente encerrada</span>}
        </h3>
        <p className="text-xs text-[#1A1A1A]/60 mt-0.5">{job.company}</p>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <RemoteBadge reality={job.remote_reality} />
      </div>

      <div className={`flex items-center justify-between mb-4 ${hasSalary(job) ? 'bg-emerald-50 -mx-2 px-2 py-1.5 rounded-lg' : ''}`}>
        <span className={`text-xs font-medium ${hasSalary(job) ? 'text-emerald-700' : 'text-[#1A1A1A]/50'}`}>
          {formatSalary(job, isDead ? '—' : 'Não divulgado')}
        </span>
        <span className="text-xs text-[#1A1A1A]/50">{daysAgo(job.created_at)}</span>
      </div>

      {job.benefits.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.benefits.slice(0, 3).map((b, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-[#1A1A1A]/5 text-[#1A1A1A]/60 rounded text-xs">{b}</span>
          ))}
          {job.benefits.length > 3 && (
            <span className="px-1.5 py-0.5 text-[#1A1A1A]/50 text-xs">+{job.benefits.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleAction('add')}
          disabled={loading !== null}
          className="flex-1 bg-[#FF6A00] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#E65C00] disabled:opacity-50 transition-colors"
        >
          {loading === 'add' ? '...' : 'Adicionar'}
        </button>
        <button
          onClick={() => handleAction('ignore')}
          disabled={loading !== null}
          className="flex-1 bg-[#1A1A1A]/5 text-[#1A1A1A]/70 text-xs font-medium py-2 rounded-xl hover:bg-[#1A1A1A]/10 disabled:opacity-50 transition-colors"
        >
          {loading === 'ignore' ? '...' : 'Ignorar'}
        </button>
      </div>
    </div>
  )
}
