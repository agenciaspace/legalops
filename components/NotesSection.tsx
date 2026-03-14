'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { JobNote } from '@/lib/types'

interface NotesSectionProps {
  entryId: string
  initialNotes: JobNote[]
}

export function NotesSection({ entryId, initialNotes }: NotesSectionProps) {
  const [notes, setNotes] = useState<JobNote[]>(initialNotes)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const { t } = useLocale()

  async function handleAdd() {
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const { note } = await res.json()
      setNotes(prev => [note, ...prev])
      setContent('')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t.notes.placeholder}
          rows={2}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !content.trim()}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 self-start"
        >
          {saving ? '...' : t.notes.add}
        </button>
      </div>
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="bg-slate-50 rounded-lg px-3 py-2">
              <p className="text-sm text-slate-700">{note.content}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
