'use client'

import { useState } from 'react'
import { PipelineCard } from './PipelineCard'
import { useI18n } from '@/lib/i18n'
import type { PipelineEntryWithJob, PipelineStatus } from '@/lib/types'

const STATUS_ORDER: PipelineStatus[] = ['researching', 'applied', 'interview', 'offer', 'discarded']

export function KanbanBoard({ initialEntries }: { initialEntries: PipelineEntryWithJob[] }) {
  const [entries, setEntries] = useState(initialEntries)
  const { t } = useI18n()

  const COLUMNS: { label: string; status: PipelineStatus }[] = [
    { label: t.status.researching, status: 'researching' },
    { label: t.status.applied, status: 'applied' },
    { label: t.status.interview, status: 'interview' },
    { label: t.status.offer, status: 'offer' },
    { label: t.status.discarded, status: 'discarded' },
  ]

  async function handleMove(entryId: string, direction: 'left' | 'right') {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    const currentIdx = STATUS_ORDER.indexOf(entry.status)
    const newIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1
    if (newIdx < 0 || newIdx >= STATUS_ORDER.length) return
    const newStatus = STATUS_ORDER[newIdx]

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
                <p className="py-6 text-center text-xs text-slate-400">{t.kanban.noJobsYet}</p>
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
