'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/LocaleProvider'
import type { PipelineStatus } from '@/lib/types'

const STATUSES: PipelineStatus[] = [
  'researching', 'applied', 'interview', 'offer', 'discarded',
]

interface StatusDropdownProps {
  entryId: string
  currentStatus: PipelineStatus
}

export function StatusDropdown({ entryId, currentStatus }: StatusDropdownProps) {
  const router = useRouter()
  const { t } = useLocale()
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)

  async function handleChange(newStatus: PipelineStatus) {
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setStatus(newStatus)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <select
      value={status}
      onChange={e => handleChange(e.target.value as PipelineStatus)}
      disabled={saving}
      className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {STATUSES.map(s => (
        <option key={s} value={s}>{t.statuses[s]}</option>
      ))}
    </select>
  )
}
