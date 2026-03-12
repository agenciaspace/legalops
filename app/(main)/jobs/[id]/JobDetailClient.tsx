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

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Remote</h2>
        <div className="flex items-center gap-2">
          <RemoteBadge reality={job.remote_reality} />
          {job.remote_notes && (
            <span className="text-xs text-slate-500">{job.remote_notes}</span>
          )}
        </div>
        {job.remote_label && (
          <p className="text-xs text-slate-400 mt-1">Posted as: &quot;{job.remote_label}&quot;</p>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Salary</h2>
        <p className="text-sm text-slate-700">{formatSalary()}</p>
      </section>

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

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Direct Manager</h2>
        <LeaderSection entryId={entry.id} initialLeader={leader} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notes</h2>
        <NotesSection entryId={entry.id} initialNotes={notes} />
      </section>
    </div>
  )
}
