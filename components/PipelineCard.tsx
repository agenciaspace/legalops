import Link from 'next/link'
import { RemoteBadge } from './RemoteBadge'
import type { PipelineEntryWithJob } from '@/lib/types'

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
          onClick={e => e.preventDefault()}
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
