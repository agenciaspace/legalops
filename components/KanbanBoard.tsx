'use client'

import { useState } from 'react'
import { PipelineCard } from './PipelineCard'
import { useLocale } from '@/components/LocaleProvider'
import type { PipelineEntryWithJob, PipelineStatus } from '@/lib/types'

const COLUMN_STATUSES: PipelineStatus[] = [
  'researching', 'applied', 'interview', 'offer', 'discarded',
]

export function KanbanBoard({ initialEntries }: { initialEntries: PipelineEntryWithJob[] }) {
  const [entries, setEntries] = useState(initialEntries)
  const { t } = useLocale()

  async function handleMove(entryId: string, direction: 'left' | 'right') {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    const currentIdx = COLUMN_STATUSES.indexOf(entry.status)
    const newIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1
    if (newIdx < 0 || newIdx >= COLUMN_STATUSES.length) return
    const newStatus = COLUMN_STATUSES[newIdx]

    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: newStatus } : e))

    const res = await fetch(`/api/pipeline/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: entry.status } : e))
    }
  }

  return (
    <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-64px)]">
      {COLUMN_STATUSES.map((status, colIdx) => {
        const colEntries = entries.filter(e => e.status === status)
        return (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-700">{t.statuses[status]}</h3>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                {colEntries.length}
              </span>
            </div>
            <div className="space-y-2 bg-slate-100 rounded-xl p-2 min-h-24">
              {colEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">{t.kanban.noJobsYet}</p>
              ) : (
                colEntries.map(entry => (
                  <PipelineCard
                    key={entry.id}
                    entry={entry}
                    canMoveLeft={colIdx > 0}
                    canMoveRight={colIdx < COLUMN_STATUSES.length - 1}
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
