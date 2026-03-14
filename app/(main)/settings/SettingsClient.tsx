'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { AccountProfile, ProfessionalType } from '@/lib/types'

const PROFESSIONAL_TYPES: ProfessionalType[] = [
  'law_firm', 'legal_dept', 'public_sector', 'freelance', 'other',
]

const AREAS_OPTIONS = [
  'Legal Operations',
  'Contratos / CLM',
  'Compliance e Governança',
  'M&A e Corporate',
  'Trabalhista',
  'Tributário',
  'Regulatório',
  'Propriedade Intelectual',
  'Proteção de Dados / LGPD',
  'Tecnologia Jurídica',
  'Contencioso',
  'Terceiro Setor / ESG',
  'Mercado de Capitais',
  'Direito Bancário',
]

interface Props {
  profile: AccountProfile | null
}

export function SettingsClient({ profile }: Props) {
  const { locale, t, setLocale } = useLocale()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [currentRole, setCurrentRole] = useState(profile?.current_role ?? '')
  const [professionalType, setProfessionalType] = useState<ProfessionalType | ''>(
    profile?.professional_type ?? ''
  )
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? '')
  const [selectedAreas, setSelectedAreas] = useState<string[]>(profile?.areas_of_expertise ?? [])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function toggleArea(area: string) {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        current_role: currentRole.trim(),
        professional_type: professionalType || undefined,
        linkedin_url: linkedinUrl.trim(),
        areas_of_expertise: selectedAreas,
      }),
    })

    setSaving(false)

    if (res.ok) {
      setMessage({ type: 'success', text: t.settings.saved })
    } else {
      setMessage({ type: 'error', text: t.settings.errorSaving })
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t.settings.title}</h1>
        <p className="text-sm text-slate-500">{t.settings.subtitle}</p>
      </div>

      {/* Language */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">{t.settings.language}</h2>
        <p className="text-xs text-slate-500">{t.settings.languageHint}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLocale('pt')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              locale === 'pt'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Português
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              locale === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            English
          </button>
        </div>
      </section>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">{t.settings.profileSection}</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.fullName}</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.currentRole}</label>
          <input
            type="text"
            value={currentRole}
            onChange={e => setCurrentRole(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.professionalType}</label>
          <select
            value={professionalType}
            onChange={e => setProfessionalType(e.target.value as ProfessionalType)}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.settings.selectType}</option>
            {PROFESSIONAL_TYPES.map(pt => (
              <option key={pt} value={pt}>
                {t.onboard.professionalTypes[pt]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.linkedinUrl}</label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.areasOfExpertise}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {AREAS_OPTIONS.map(area => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedAreas.includes(area)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p className={`text-xs rounded-xl px-3 py-2 border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? t.settings.saving : t.settings.save}
        </button>
      </section>
    </div>
  )
}
