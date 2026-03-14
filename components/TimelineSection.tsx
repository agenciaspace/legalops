'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { ApplicationEvent, EventType } from '@/lib/types'

interface TimelineSectionProps {
  entryId: string
  initialEvents: ApplicationEvent[]
}

const EVENT_ICONS: Record<EventType, { icon: string; color: string }> = {
  status_change: { icon: '→', color: 'bg-blue-100 text-blue-700' },
  note_added: { icon: '✎', color: 'bg-slate-100 text-slate-600' },
  contact_added: { icon: '👤', color: 'bg-purple-100 text-purple-700' },
  interview_scheduled: { icon: '📅', color: 'bg-green-100 text-green-700' },
  follow_up: { icon: '↩', color: 'bg-yellow-100 text-yellow-700' },
  custom: { icon: '•', color: 'bg-slate-100 text-slate-600' },
}

const EVENT_TYPES: EventType[] = [
  'status_change', 'note_added', 'contact_added', 'interview_scheduled', 'follow_up', 'custom',
]

export function TimelineSection({ entryId, initialEvents }: TimelineSectionProps) {
  const [events, setEvents] = useState<ApplicationEvent[]>(initialEvents)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    event_type: 'custom' as EventType,
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
  })
  const { locale, t } = useLocale()

  async function handleAdd() {
    if (!form.title.trim()) return
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        event_date: new Date(form.event_date).toISOString(),
      }),
    })
    if (res.ok) {
      const { event } = await res.json()
      setEvents(prev => [event, ...prev])
      setForm({ event_type: 'custom', title: '', description: '', event_date: new Date().toISOString().split('T')[0] })
      setAdding(false)
    }
    setSaving(false)
  }

  const dateFmtLocale = locale === 'pt' ? 'pt-BR' : 'en-US'

  return (
    <div className="space-y-3">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          {t.timeline.addEvent}
        </button>
      ) : (
        <div className="space-y-2 bg-slate-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-0.5">{t.timeline.fieldType}</label>
              <select
                value={form.event_type}
                onChange={e => setForm(p => ({ ...p, event_type: e.target.value as EventType }))}
                className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type} value={type}>{t.timeline.eventTypes[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-0.5">{t.timeline.fieldDate}</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))}
                className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-0.5">{t.timeline.fieldTitle}</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder={t.timeline.fieldTitlePlaceholder}
              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-0.5">{t.timeline.fieldDescription}</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.title.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t.timeline.saving : t.timeline.save}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1 text-slate-500 text-xs rounded hover:bg-slate-100"
            >
              {t.timeline.cancel}
            </button>
          </div>
        </div>
      )}

      {events.length > 0 ? (
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-3">
            {events.map(event => {
              const config = EVENT_ICONS[event.event_type as EventType] ?? EVENT_ICONS.custom
              return (
                <div key={event.id} className="flex gap-3 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs z-10 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium text-slate-900">{event.title}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(event.event_date).toLocaleDateString(dateFmtLocale)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : !adding ? (
        <p className="text-xs text-slate-400">{t.timeline.noEvents}</p>
      ) : null}
    </div>
  )
}
