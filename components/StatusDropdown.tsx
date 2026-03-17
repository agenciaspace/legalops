'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import type { PipelineStatus } from '@/lib/types'

interface StatusDropdownProps {
  entryId: string
  currentStatus: PipelineStatus
}

export function StatusDropdown({ entryId, currentStatus }: StatusDropdownProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)

  const OPTIONS: { value: PipelineStatus; label: string }[] = [
    { value: 'researching', label: t.status.researching },
    { value: 'applied', label: t.status.applied },
    { value: 'interview', label: t.status.interview },
    { value: 'offer', label: t.status.offer },
    { value: 'discarded', label: t.status.discarded },
  ]

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
      {OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
