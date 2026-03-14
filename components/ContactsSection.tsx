'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { Contact } from '@/lib/types'

interface ContactsSectionProps {
  entryId: string
  initialContacts: Contact[]
}

export function ContactsSection({ entryId, initialContacts }: ContactsSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', email: '', linkedin_url: '', phone: '', notes: '' })
  const { t } = useLocale()

  async function handleAdd() {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch(`/api/pipeline/${entryId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const { contact } = await res.json()
      setContacts(prev => [contact, ...prev])
      setForm({ name: '', role: '', email: '', linkedin_url: '', phone: '', notes: '' })
      setAdding(false)
    }
    setSaving(false)
  }

  async function handleDelete(contactId: string) {
    const res = await fetch(`/api/pipeline/${entryId}/contacts?id=${contactId}`, { method: 'DELETE' })
    if (res.ok) {
      setContacts(prev => prev.filter(c => c.id !== contactId))
    }
  }

  const FIELD_LABELS: Record<string, string> = {
    name: t.contacts.fieldName,
    role: t.contacts.fieldRole,
    email: t.contacts.fieldEmail,
    phone: t.contacts.fieldPhone,
  }

  return (
    <div className="space-y-3">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          {t.contacts.addContact}
        </button>
      ) : (
        <div className="space-y-2 bg-slate-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2">
            {(['name', 'role', 'email', 'phone'] as const).map(field => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">
                  {FIELD_LABELS[field]}
                </label>
                <input
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-0.5">{t.contacts.fieldLinkedin}</label>
            <input
              value={form.linkedin_url}
              onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
              placeholder="https://linkedin.com/in/..."
              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-0.5">{t.contacts.fieldNotes}</label>
            <input
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.name.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t.contacts.saving : t.contacts.save}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1 text-slate-500 text-xs rounded hover:bg-slate-100"
            >
              {t.contacts.cancel}
            </button>
          </div>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="space-y-2">
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-700">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                {contact.role && <p className="text-xs text-slate-500">{contact.role}</p>}
                <div className="flex flex-wrap gap-3 mt-1">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 hover:underline">{contact.email}</a>
                  )}
                  {contact.phone && <span className="text-xs text-slate-500">{contact.phone}</span>}
                  {contact.linkedin_url && (
                    <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">LinkedIn</a>
                  )}
                </div>
                {contact.notes && <p className="text-xs text-slate-400 mt-1 italic">{contact.notes}</p>}
              </div>
              <button
                onClick={() => handleDelete(contact.id)}
                className="text-xs text-slate-400 hover:text-red-500 flex-shrink-0"
                title={t.contacts.remove}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {contacts.length === 0 && !adding && (
        <p className="text-xs text-slate-400">{t.contacts.noContacts}</p>
      )}
    </div>
  )
}
