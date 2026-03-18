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
              <h3 className="text-sm font-semibold text-[#1A1A1A]/70">{col.label}</h3>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1A1A1A]/10 text-xs font-medium text-[#1A1A1A]/70">
                {colEntries.length}
              </span>
            </div>
            <div className="space-y-2 bg-[#1A1A1A]/5 rounded-xl p-2 min-h-24">
              {colEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#1A1A1A]/50">No jobs here yet</p>
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
