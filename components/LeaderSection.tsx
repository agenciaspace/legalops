'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { Leader } from '@/lib/types'

interface LeaderSectionProps {
  entryId: string
  initialLeader: Leader | null
}

export function LeaderSection({ entryId, initialLeader }: LeaderSectionProps) {
  const [leader, setLeader] = useState<Leader | null>(initialLeader)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: initialLeader?.name ?? '',
    title: initialLeader?.title ?? '',
    linkedin_url: initialLeader?.linkedin_url ?? '',
    notes: initialLeader?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLocale()

  const FIELD_LABELS: Record<string, string> = {
    name: t.leader.fieldName,
    title: t.leader.fieldTitle,
    linkedin_url: t.leader.fieldLinkedin,
    notes: t.leader.fieldNotes,
  }

  async function handleConfirm() {
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}/leader/confirm`, { method: 'PATCH' })
    if (res.ok) {
      const { leader: updated } = await res.json()
      setLeader(updated)
    }
    setSaving(false)
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}/leader`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setSaving(false)
      return
    }
    setLeader(data.leader)
    setEditing(false)
    setSaving(false)
  }

  if (!leader && !editing) {
    return (
      <div className="text-xs text-slate-400">
        {t.leader.noLeader}{' '}
        <button
          onClick={() => setEditing(true)}
          className="text-blue-600 hover:underline"
        >
          {t.leader.add}
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="space-y-2">
        {(['name', 'title', 'linkedin_url', 'notes'] as const).map(field => (
          <div key={field}>
            <label className="block text-xs font-medium text-slate-600 mb-0.5">
              {FIELD_LABELS[field]}
            </label>
            <input
              value={form[field]}
              onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={field === 'linkedin_url' ? 'https://linkedin.com/in/...' : ''}
            />
          </div>
        ))}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t.leader.saving : t.leader.save}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1 text-slate-500 text-xs rounded hover:bg-slate-100"
          >
            {t.leader.cancel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900">{leader!.name}</span>
        {leader!.confirmed ? (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">{t.leader.confirmed}</span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{t.leader.suggested}</span>
        )}
      </div>
      {leader!.title && <p className="text-xs text-slate-500">{leader!.title}</p>}
      {leader!.linkedin_url && (
        <a href={leader!.linkedin_url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline block">
          LinkedIn →
        </a>
      )}
      {leader!.notes && <p className="text-xs text-slate-400 italic mt-1">{leader!.notes}</p>}
      <div className="flex gap-2 mt-2">
        {!leader!.confirmed && (
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
          >
            {t.leader.confirm}
          </button>
        )}
        <button
          onClick={() => {
            setForm({ name: leader!.name ?? '', title: leader!.title ?? '', linkedin_url: leader!.linkedin_url ?? '', notes: leader!.notes ?? '' })
            setEditing(true)
          }}
          className="px-2 py-1 text-xs text-slate-500 rounded hover:bg-slate-100"
        >
          {t.leader.edit}
        </button>
      </div>
    </div>
  )
}
