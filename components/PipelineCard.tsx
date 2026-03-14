import Link from 'next/link'
import { RemoteBadge } from './RemoteBadge'
import { formatSalary, hasSalary } from '@/lib/format-salary'
import type { PipelineEntryWithJob } from '@/lib/types'

interface PipelineCardProps {
  entry: PipelineEntryWithJob
  canMoveLeft: boolean
  canMoveRight: boolean
  onMove: (entryId: string, direction: 'left' | 'right') => void
}

export function PipelineCard({ entry, canMoveLeft, canMoveRight, onMove }: PipelineCardProps) {
  return (
    <Link href={`/jobs/${entry.id}`}>
      <div className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-slate-900 leading-tight truncate">{entry.job.title}</h4>
          <p className="text-xs text-slate-500 truncate">{entry.job.company}</p>
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <RemoteBadge reality={entry.job.remote_reality} />
        </div>
        {hasSalary(entry.job) && (
          <p className="text-xs text-emerald-600 font-medium mb-2">{formatSalary(entry.job)}</p>
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
