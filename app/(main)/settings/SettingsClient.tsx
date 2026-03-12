'use client'

import { useState } from 'react'
import type { UserProfile } from '@/lib/types'

interface Props {
  initialProfile: UserProfile | null
}

export function SettingsClient({ initialProfile }: Props) {
  const [alias, setAlias] = useState(initialProfile?.email_alias ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const domain = 'legalops.work'
  const previewEmail = alias ? `${alias}+empresa-cargo@${domain}` : ''

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_alias: alias }),
    })

    const data = await res.json()

    if (res.ok) {
      setMessage({ type: 'success', text: 'Alias salvo com sucesso!' })
    } else {
      setMessage({ type: 'error', text: data.error ?? 'Erro ao salvar' })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-lg font-bold text-slate-900">Configuracoes</h1>

      {/* Email Alias Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">E-mail personalizado</h2>
          <p className="text-xs text-slate-500 mt-1">
            Defina um alias para ter um e-mail profissional em cada vaga.
            Cada vaga recebera um e-mail no formato <code className="bg-slate-100 px-1 rounded">alias+empresa-cargo@{domain}</code>.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Seu alias</label>
          <div className="flex items-center gap-0">
            <input
              type="text"
              value={alias}
              onChange={e => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
              placeholder="leon"
              maxLength={30}
              className="flex-1 border border-slate-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg px-3 py-2 text-sm text-slate-500">
              @{domain}
            </span>
          </div>
        </div>

        {alias && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium mb-1">Preview</p>
            <p className="text-xs text-blue-900">
              Para uma vaga de <strong>SRE</strong> na <strong>Nubank</strong>, seu e-mail seria:
            </p>
            <code className="text-xs text-blue-800 bg-blue-100 rounded px-1.5 py-0.5 mt-1 inline-block">
              {alias}+nubank-sre@{domain}
            </code>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {message && (
            <span className={`text-xs font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Como funciona?</h2>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex gap-2">
            <span className="font-bold text-slate-400">1.</span>
            <p>Cada vaga tem dois e-mails: um <strong>randomico</strong> (automatico) e um <strong>personalizado</strong> (se voce configurar o alias).</p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-slate-400">2.</span>
            <p>Use o e-mail personalizado ao se candidatar — fica mais profissional.</p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-slate-400">3.</span>
            <p>Respostas da empresa aparecem automaticamente na timeline da vaga.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
