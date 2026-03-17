'use client'

import { useState } from 'react'
import { Save, Eye, EyeOff, Briefcase, User, MapPin, DollarSign, Wrench } from 'lucide-react'
import type { ProfessionalType, RemotePreference } from '@/lib/types'

interface ProfileData {
  user_id: string
  tier: string
  full_name: string | null
  current_role: string | null
  professional_type: ProfessionalType | null
  years_experience: number | null
  areas_of_expertise: string[]
  linkedin_url: string | null
  public_headline: string | null
  public_bio: string | null
  skills: string[]
  certifications: string[]
  tools_used: string[]
  open_to_opportunities: boolean
  desired_salary_min: number | null
  desired_salary_max: number | null
  desired_salary_currency: string
  preferred_remote: RemotePreference | null
  preferred_locations: string[]
  is_public: boolean
}

const PROFESSIONAL_TYPES: { value: ProfessionalType; label: string }[] = [
  { value: 'law_firm', label: 'Escritório de advocacia' },
  { value: 'legal_dept', label: 'Departamento jurídico (in-house)' },
  { value: 'public_sector', label: 'Cargo público / concurso' },
  { value: 'freelance', label: 'Freelance / autônomo(a)' },
  { value: 'other', label: 'Outro' },
]

const AREAS_OPTIONS = [
  'Legal Operations', 'Contratos / CLM', 'Compliance e Governança',
  'M&A e Corporate', 'Trabalhista', 'Tributário', 'Regulatório',
  'Propriedade Intelectual', 'Proteção de Dados / LGPD',
  'Tecnologia Jurídica', 'Contencioso', 'Terceiro Setor / ESG',
  'Mercado de Capitais', 'Direito Bancário',
]

const REMOTE_OPTIONS: { value: RemotePreference; label: string }[] = [
  { value: 'remote', label: 'Remoto' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'onsite', label: 'Presencial' },
  { value: 'any', label: 'Qualquer' },
]

const COMMON_TOOLS = [
  'Ironclad', 'DocuSign CLM', 'Agiloft', 'SimpleLegal', 'Onit',
  'LinkSquares', 'Juro', 'ContractPodAi', 'Icertis', 'Luminance',
  'Kira Systems', 'NetDocuments', 'iManage', 'Clio', 'LegalTracker',
  'Mitratech', 'Thomson Reuters', 'Relativity', 'BRYTER', 'Checkbox',
]

function TagInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
}: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder: string
  suggestions?: string[]
}) {
  const [input, setInput] = useState('')

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  const filteredSuggestions = suggestions?.filter(
    (s) =>
      !value.includes(s) &&
      input.length > 0 &&
      s.toLowerCase().includes(input.toLowerCase())
  )

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-blue-400 hover:text-blue-700"
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag(input)
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {filteredSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {filteredSuggestions.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function SettingsClient({
  profile,
  userEmail,
}: {
  profile: ProfileData | null
  userEmail: string
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [currentRole, setCurrentRole] = useState(profile?.current_role ?? '')
  const [professionalType, setProfessionalType] = useState<ProfessionalType | null>(
    profile?.professional_type ?? null
  )
  const [yearsExperience, setYearsExperience] = useState<number | ''>(
    profile?.years_experience ?? ''
  )
  const [areas, setAreas] = useState<string[]>(profile?.areas_of_expertise ?? [])
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? '')

  // Public profile fields
  const [publicHeadline, setPublicHeadline] = useState(profile?.public_headline ?? '')
  const [publicBio, setPublicBio] = useState(profile?.public_bio ?? '')
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? [])
  const [certifications, setCertifications] = useState<string[]>(profile?.certifications ?? [])
  const [toolsUsed, setToolsUsed] = useState<string[]>(profile?.tools_used ?? [])
  const [openToOpportunities, setOpenToOpportunities] = useState(
    profile?.open_to_opportunities ?? false
  )
  const [desiredSalaryMin, setDesiredSalaryMin] = useState<number | ''>(
    profile?.desired_salary_min ?? ''
  )
  const [desiredSalaryMax, setDesiredSalaryMax] = useState<number | ''>(
    profile?.desired_salary_max ?? ''
  )
  const [desiredSalaryCurrency, setDesiredSalaryCurrency] = useState(
    profile?.desired_salary_currency ?? 'USD'
  )
  const [preferredRemote, setPreferredRemote] = useState<RemotePreference | ''>(
    profile?.preferred_remote ?? ''
  )
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    profile?.preferred_locations ?? []
  )
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? false)

  function toggleArea(area: string) {
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
  }

  async function handleSave() {
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          current_role: currentRole.trim(),
          professional_type: professionalType,
          years_experience: yearsExperience === '' ? null : Number(yearsExperience),
          areas_of_expertise: areas,
          linkedin_url: linkedinUrl.trim() || null,
          public_headline: publicHeadline.trim() || null,
          public_bio: publicBio.trim() || null,
          skills,
          certifications,
          tools_used: toolsUsed,
          open_to_opportunities: openToOpportunities,
          desired_salary_min: desiredSalaryMin === '' ? null : Number(desiredSalaryMin),
          desired_salary_max: desiredSalaryMax === '' ? null : Number(desiredSalaryMax),
          desired_salary_currency: desiredSalaryCurrency,
          preferred_remote: preferredRemote || null,
          preferred_locations: preferredLocations,
          is_public: isPublic,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro ao salvar')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 max-w-2xl space-y-8">
      {/* Account info */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-slate-900">
          <User className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Conta</h2>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <p className="text-slate-500">
            Email: <span className="text-slate-700">{userEmail}</span>
          </p>
          <p className="text-slate-500">
            Plano:{' '}
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
              {profile?.tier ?? 'free'}
            </span>
          </p>
        </div>
      </section>

      {/* Profile visibility */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <h2 className="text-sm font-semibold">Visibilidade do perfil</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPublic ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {isPublic
            ? 'Seu perfil está visível no diretório de profissionais e para empresas.'
            : 'Seu perfil está oculto. Ative para aparecer no diretório e ser encontrado por empresas.'}
        </p>
      </section>

      {/* Basic info */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-slate-900">
          <Briefcase className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Informações profissionais</h2>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo atual</label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Headline pública</label>
            <input
              type="text"
              value={publicHeadline}
              onChange={(e) => setPublicHeadline(e.target.value)}
              placeholder="Ex: Legal Ops Manager | CLM Specialist | Process Automation"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-400">Aparece no diretório de profissionais.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea
              value={publicBio}
              onChange={(e) => setPublicBio(e.target.value)}
              rows={3}
              placeholder="Conte um pouco sobre sua trajetória e o que você faz em Legal Ops..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de atuação</label>
            <select
              value={professionalType ?? ''}
              onChange={(e) =>
                setProfessionalType((e.target.value || null) as ProfessionalType | null)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {PROFESSIONAL_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Anos de experiência
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={yearsExperience}
                onChange={(e) =>
                  setYearsExperience(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Skills & Tools */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-slate-900">
          <Wrench className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Skills e ferramentas</h2>
        </div>
        <div className="mt-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Áreas de especialização
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AREAS_OPTIONS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                    areas.includes(area)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <TagInput
            label="Skills"
            value={skills}
            onChange={setSkills}
            placeholder="Digite uma skill e pressione Enter..."
          />

          <TagInput
            label="Ferramentas (CLM, LegalTech, etc.)"
            value={toolsUsed}
            onChange={setToolsUsed}
            placeholder="Digite o nome da ferramenta..."
            suggestions={COMMON_TOOLS}
          />

          <TagInput
            label="Certificações"
            value={certifications}
            onChange={setCertifications}
            placeholder="Ex: CLOC Core Competencies, PMP..."
          />
        </div>
      </section>

      {/* Job preferences */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            <MapPin className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Preferências de oportunidades</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpenToOpportunities(!openToOpportunities)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              openToOpportunities ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                openToOpportunities ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {openToOpportunities
            ? 'Empresas podem ver que você está aberto a oportunidades.'
            : 'Ative para sinalizar que está aberto a novas oportunidades.'}
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo de trabalho</label>
            <div className="flex flex-wrap gap-2">
              {REMOTE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setPreferredRemote(preferredRemote === opt.value ? '' : opt.value)
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                    preferredRemote === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <label className="text-sm font-medium text-slate-700">Pretensão salarial (anual)</label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                type="number"
                value={desiredSalaryMin}
                onChange={(e) =>
                  setDesiredSalaryMin(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Mínimo"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="number"
                value={desiredSalaryMax}
                onChange={(e) =>
                  setDesiredSalaryMax(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Máximo"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={desiredSalaryCurrency}
                onChange={(e) => setDesiredSalaryCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <TagInput
            label="Localizações preferidas"
            value={preferredLocations}
            onChange={setPreferredLocations}
            placeholder="Ex: São Paulo, Remote, New York..."
          />
        </div>
      </section>

      {/* Save */}
      <div className="sticky bottom-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">Salvo com sucesso</span>
        )}
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>
    </div>
  )
}
