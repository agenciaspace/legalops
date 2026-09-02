'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/BrandLogo'
import type { LinkedInInsight, ProfessionalType } from '@/lib/types'

type Step = 'basics' | 'professional' | 'expertise' | 'preferences' | 'cv' | 'linkedin' | 'insights'

const PROFESSIONAL_TYPES: { value: ProfessionalType; label: string; description: string }[] = [
  {
    value: 'law_firm',
    label: 'Escritório de advocacia',
    description: 'Atuo ou quero atuar em escritório de advocacia (societário, consultivo ou contencioso)',
  },
  {
    value: 'legal_dept',
    label: 'Departamento jurídico (in-house)',
    description: 'Atuo ou quero atuar no jurídico de uma empresa (in-house counsel / Legal Ops)',
  },
  {
    value: 'public_sector',
    label: 'Cargo público / concurso',
    description: 'Busco ou já ocupo cargo em órgão público, autarquia, tribunal ou MP',
  },
  {
    value: 'freelance',
    label: 'Freelance / autônomo(a)',
    description: 'Trabalho de forma independente prestando serviços jurídicos',
  },
  {
    value: 'other',
    label: 'Outro',
    description: 'LegalTech, consultoria, academia ou outra área do setor jurídico',
  },
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

const PRIORITY_CONFIG = {
  high: { label: 'Alta prioridade', color: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500' },
  medium: { label: 'Média prioridade', color: 'bg-[#FF6A00]/10 border-[#FF6A00]/20 text-[#FF6A00]', dot: 'bg-[#FF6A00]' },
  low: { label: 'Baixa prioridade', color: 'bg-[#FF6A00]/10 border-[#FF6A00]/20 text-[#FF6A00]', dot: 'bg-[#FF6A00]' },
}

const CATEGORY_ICONS: Record<LinkedInInsight['category'], string> = {
  headline: '✏️',
  photo: '📷',
  about: '📝',
  experience: '💼',
  skills: '🔧',
  recommendations: '⭐',
  activity: '📢',
  keywords: '🔍',
  other: '💡',
}

export default function OnboardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('basics')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [professionalType, setProfessionalType] = useState<ProfessionalType | null>(null)
  const [yearsExperience, setYearsExperience] = useState<number | ''>('')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [desiredRoles, setDesiredRoles] = useState('')
  const [skills, setSkills] = useState('')
  const [toolsUsed, setToolsUsed] = useState('')
  const [preferredRemote, setPreferredRemote] = useState('any')
  const [careerSummary, setCareerSummary] = useState('')
  const [careerHighlights, setCareerHighlights] = useState('')
  const [baseCvText, setBaseCvText] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [insights, setInsights] = useState<LinkedInInsight[]>([])
  const [insightsScrapeSuccess, setInsightsScrapeSuccess] = useState(false)

  function finishDestination() {
    const requestedPath = new URLSearchParams(window.location.search).get('next')
    return requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : '/discover'
  }

  function toggleArea(area: string) {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  async function saveStep(patch: Record<string, unknown>) {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erro ao salvar dados')
    }
  }

  async function handleBasicsNext() {
    if (!fullName.trim() || !currentRole.trim()) { setError('Informe seu nome completo e cargo atual.'); return }
    setError(null)
    setSaving(true)
    try {
      await saveStep({ full_name: fullName.trim(), current_role: currentRole.trim() })
      setStep('professional')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleProfessionalNext() {
    if (!professionalType) { setError('Selecione seu tipo de atuação.'); return }
    setError(null)
    setSaving(true)
    try {
      await saveStep({
        professional_type: professionalType,
        years_experience: yearsExperience === '' ? null : Number(yearsExperience),
      })
      setStep('expertise')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleExpertiseNext() {
    if (selectedAreas.length === 0) { setError('Selecione ao menos uma especialidade.'); return }
    setError(null)
    setSaving(true)
    try {
      await saveStep({ areas_of_expertise: selectedAreas })
      setStep('preferences')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  function commaList(value: string) {
    return value.split(',').map(item => item.trim()).filter(Boolean)
  }

  async function handlePreferencesNext() {
    if (commaList(desiredRoles).length === 0 || !careerSummary.trim()) {
      setError('Informe ao menos um cargo desejado e um resumo profissional.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await saveStep({
        desired_roles: commaList(desiredRoles),
        skills: commaList(skills),
        tools_used: commaList(toolsUsed),
        preferred_remote: preferredRemote,
        career_summary: careerSummary.trim(),
        open_to_opportunities: true,
        job_alerts_enabled: true,
        cv_suggestions_enabled: true,
      })
      setStep('cv')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleCvNext() {
    if (baseCvText.trim().length < 50) {
      setError('Cole um CV base com pelo menos 50 caracteres para evitar currículos genéricos ou inventados.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await saveStep({
        base_cv_text: baseCvText.trim(),
        career_highlights: careerHighlights.split('\n').map(item => item.trim()).filter(Boolean),
      })
      setStep('linkedin')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleLinkedInAnalyze() {
    if (!linkedinUrl.trim() || !linkedinUrl.includes('linkedin.com')) {
      setError('Informe uma URL válida do LinkedIn (ex: https://linkedin.com/in/seuperfil)')
      return
    }
    setError(null)
    setSaving(true)
    try {
      // Save linkedin_url first
      await saveStep({ linkedin_url: linkedinUrl.trim() })

      // Generate insights
      const res = await fetch('/api/profile/linkedin-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_url: linkedinUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao analisar LinkedIn')

      setInsights(data.insights ?? [])
      setInsightsScrapeSuccess(!!data.scraped)
      setStep('insights')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleSkipLinkedIn() {
    setError(null)
    setSaving(true)
    try {
      await saveStep({ onboarding_completed: true })
      router.push(finishDestination())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleFinish() {
    setError(null)
    setSaving(true)
    try {
      await saveStep({ onboarding_completed: true })
      router.push(finishDestination())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  const STEP_LABELS: Record<Step, string> = {
    basics: 'Dados básicos',
    professional: 'Tipo de atuação',
    expertise: 'Especialidades',
    preferences: 'Objetivos',
    cv: 'CV base',
    linkedin: 'LinkedIn',
    insights: 'Quick wins',
  }
  const STEPS: Step[] = ['basics', 'professional', 'expertise', 'preferences', 'cv', 'linkedin', 'insights']
  const currentStepIndex = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col items-center py-10 px-4">
      <div className="mb-8 text-center">
        <BrandLogo
          className="flex flex-col items-center gap-3"
          markClassName="h-10 w-10 text-[#1A1A1A]"
          titleClassName="text-xl font-semibold tracking-[0.18em] text-[#1A1A1A] uppercase"
          subtitle="Vamos configurar seu perfil profissional"
          subtitleClassName="text-sm text-[#1A1A1A]/60"
        />
      </div>

      {/* Step indicator */}
      <div className="flex max-w-4xl flex-wrap items-center justify-center gap-2 mb-8">
        {STEPS.filter(s => s !== 'insights').map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              i < currentStepIndex
                ? 'bg-emerald-50 text-emerald-700'
                : i === currentStepIndex
                ? 'bg-[#FF6A00] text-white'
                : 'bg-[#1A1A1A]/5 text-[#1A1A1A]/50'
            }`}>
              {i < currentStepIndex && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {STEP_LABELS[s]}
            </div>
            {i < STEPS.filter(s => s !== 'insights').length - 1 && (
              <div className={`h-px w-6 ${i < currentStepIndex ? 'bg-emerald-300' : 'bg-[#1A1A1A]/10'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-lg">

        {/* ─── STEP: BASICS ─────────────────────────────────────────────── */}
        {step === 'basics' && (
          <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Dados básicos</h2>
              <p className="text-sm text-[#1A1A1A]/60 mt-0.5">Como devemos te chamar e qual é seu cargo atual?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-1">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ex: Maria Clara Souza"
                className="w-full border border-[#1A1A1A]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-1">
                Cargo atual
              </label>
              <input
                type="text"
                value={currentRole}
                onChange={e => setCurrentRole(e.target.value)}
                placeholder="Ex: Legal Operations Specialist, Advogada Sênior..."
                className="w-full border border-[#1A1A1A]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
              />
              <p className="text-xs text-[#1A1A1A]/50 mt-1">Se estiver em transição, informe o cargo que deseja ou o mais recente.</p>
            </div>

            {error && <p className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

            <button
              onClick={handleBasicsNext}
              disabled={saving}
              className="w-full bg-[#FF6A00] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-[#E65C00] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : 'Continuar →'}
            </button>
          </div>
        )}

        {/* ─── STEP: PROFESSIONAL TYPE ──────────────────────────────────── */}
        {step === 'professional' && (
          <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Tipo de atuação</h2>
              <p className="text-sm text-[#1A1A1A]/60 mt-0.5">Onde você atua ou quer atuar profissionalmente?</p>
            </div>

            <div className="space-y-2">
              {PROFESSIONAL_TYPES.map(pt => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setProfessionalType(pt.value)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    professionalType === pt.value
                      ? 'border-[#FF6A00] bg-[#FF6A00]/10 ring-1 ring-[#FF6A00]'
                      : 'border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/5'
                  }`}
                >
                  <p className="text-sm font-medium text-[#1A1A1A]">{pt.label}</p>
                  <p className="text-xs text-[#1A1A1A]/60 mt-0.5">{pt.description}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-1">
                Anos de experiência jurídica
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={yearsExperience}
                onChange={e => setYearsExperience(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 5"
                className="w-full border border-[#1A1A1A]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
              />
            </div>

            {error && <p className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('basics')}
                className="flex-1 border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-xl py-2.5 text-sm font-bold hover:bg-[#1A1A1A]/5 transition-colors"
              >
                ← Voltar
              </button>
              <button
                onClick={handleProfessionalNext}
                disabled={saving}
                className="flex-1 bg-[#FF6A00] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-[#E65C00] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Continuar →'}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: EXPERTISE ─────────────────────────────────────────── */}
        {step === 'expertise' && (
          <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Áreas de especialização</h2>
              <p className="text-sm text-[#1A1A1A]/60 mt-0.5">Selecione as áreas em que você atua ou tem interesse. Isso melhora as sugestões de vagas.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {AREAS_OPTIONS.map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    selectedAreas.includes(area)
                      ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                      : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/10 hover:border-[#FF6A00] hover:text-[#FF6A00]'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>

            {selectedAreas.length > 0 && (
              <p className="text-xs text-[#1A1A1A]/50">{selectedAreas.length} área{selectedAreas.length > 1 ? 's' : ''} selecionada{selectedAreas.length > 1 ? 's' : ''}</p>
            )}

            {error && <p className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('professional')}
                className="flex-1 border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-xl py-2.5 text-sm font-bold hover:bg-[#1A1A1A]/5 transition-colors"
              >
                ← Voltar
              </button>
              <button
                onClick={handleExpertiseNext}
                disabled={saving}
                className="flex-1 bg-[#FF6A00] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-[#E65C00] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Continuar →'}
              </button>
            </div>
          </div>
        )}

        {step === 'preferences' && (
          <div className="space-y-5 rounded-2xl border border-[#1A1A1A]/10 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Objetivos e posicionamento</h2>
              <p className="mt-0.5 text-sm text-[#1A1A1A]/60">Esses sinais definem quais vagas serão enviadas e se o CV deve destacar execução técnica, gestão ou estratégia.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]/70">Cargos desejados *</label>
              <input value={desiredRoles} onChange={event => setDesiredRoles(event.target.value)} placeholder="Ex: Legal Ops Manager, Head of Legal Operations" className="w-full rounded-xl border border-[#1A1A1A]/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]" />
              <p className="mt-1 text-xs text-[#1A1A1A]/50">Separe por vírgulas.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1A1A1A]/70">Competências</label>
                <input value={skills} onChange={event => setSkills(event.target.value)} placeholder="Projetos, dados, liderança" className="w-full rounded-xl border border-[#1A1A1A]/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1A1A1A]/70">Ferramentas</label>
                <input value={toolsUsed} onChange={event => setToolsUsed(event.target.value)} placeholder="Ironclad, Power BI, SQL" className="w-full rounded-xl border border-[#1A1A1A]/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]/70">Modelo preferido</label>
              <select value={preferredRemote} onChange={event => setPreferredRemote(event.target.value)} className="w-full rounded-xl border border-[#1A1A1A]/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]">
                <option value="any">Qualquer modelo</option>
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]/70">Resumo profissional *</label>
              <textarea value={careerSummary} onChange={event => setCareerSummary(event.target.value)} rows={4} placeholder="Descreva seu nível, escopo, setores e tipo de impacto real." className="w-full rounded-xl border border-[#1A1A1A]/20 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]" />
            </div>
            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep('expertise')} className="flex-1 rounded-xl border-2 border-[#1A1A1A] py-2.5 text-sm font-bold">← Voltar</button>
              <button onClick={handlePreferencesNext} disabled={saving} className="flex-1 rounded-xl bg-[#FF6A00] py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Continuar →'}</button>
            </div>
          </div>
        )}

        {step === 'cv' && (
          <div className="space-y-5 rounded-2xl border border-[#1A1A1A]/10 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Sua fonte de verdade</h2>
              <p className="mt-0.5 text-sm text-[#1A1A1A]/60">O sistema adapta a ênfase para cada vaga, mas nunca pode inventar experiência.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]/70">CV base *</label>
              <textarea value={baseCvText} onChange={event => setBaseCvText(event.target.value)} rows={10} placeholder="Cole aqui o texto do seu currículo: cargos, empresas, datas, responsabilidades e formação." className="w-full rounded-xl border border-[#1A1A1A]/20 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]/70">Resultados comprovados</label>
              <textarea value={careerHighlights} onChange={event => setCareerHighlights(event.target.value)} rows={5} placeholder={'Um resultado por linha. Ex:\nReduzi o ciclo contratual em 30%.\nImplantei CLM para 120 usuários.'} className="w-full rounded-xl border border-[#1A1A1A]/20 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF6A00]" />
            </div>
            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep('preferences')} className="flex-1 rounded-xl border-2 border-[#1A1A1A] py-2.5 text-sm font-bold">← Voltar</button>
              <button onClick={handleCvNext} disabled={saving} className="flex-1 rounded-xl bg-[#FF6A00] py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Continuar →'}</button>
            </div>
          </div>
        )}

        {/* ─── STEP: LINKEDIN ───────────────────────────────────────────── */}
        {step === 'linkedin' && (
          <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Perfil LinkedIn</h2>
              <p className="text-sm text-[#1A1A1A]/60 mt-0.5">
                Informe o link do seu LinkedIn. Vamos analisar seu perfil e sugerir <strong>quick wins</strong> para você conquistar mais vagas na área jurídica.
              </p>
            </div>

            <div className="bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-medium text-[#FF6A00]">O que você vai receber:</p>
              <ul className="text-xs text-[#FF6A00] space-y-1">
                <li>✓ Análise do headline e visibilidade nos recrutadores</li>
                <li>✓ Gaps de keywords relevantes para Legal Ops</li>
                <li>✓ Sugestões de seções em falta (Sobre, Skills, etc.)</li>
                <li>✓ Dicas para aumentar o alcance orgânico do perfil</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-1">URL do LinkedIn</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/seuperfil"
                className="w-full border border-[#1A1A1A]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
              />
              <p className="text-xs text-[#1A1A1A]/50 mt-1">Certifique-se de que seu perfil está público para melhor análise.</p>
            </div>

            {error && <p className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

            <button
              onClick={handleLinkedInAnalyze}
              disabled={saving || !linkedinUrl.trim()}
              className="w-full bg-[#FF6A00] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-[#E65C00] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Analisando perfil...' : 'Analisar meu LinkedIn →'}
            </button>

            <button
              onClick={handleSkipLinkedIn}
              disabled={saving}
              className="w-full text-[#1A1A1A]/50 text-xs hover:text-[#1A1A1A]/70 transition-colors"
            >
              Pular por agora — adicionar depois nas configurações
            </button>
            <button onClick={() => setStep('cv')} className="w-full text-xs text-[#1A1A1A]/50 hover:text-[#1A1A1A]/70">← Voltar ao CV base</button>
          </div>
        )}

        {/* ─── STEP: INSIGHTS ───────────────────────────────────────────── */}
        {step === 'insights' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Seus quick wins do LinkedIn</h2>
              <p className="text-sm text-[#1A1A1A]/60 mt-0.5">
                {insightsScrapeSuccess
                  ? 'Analisamos seu perfil e identificamos as principais oportunidades de melhoria.'
                  : 'Geramos recomendações baseadas no seu contexto profissional para impulsionar seu perfil.'}
              </p>
            </div>

            {insights.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-6 text-center shadow-sm">
                <p className="text-[#1A1A1A]/60 text-sm">Não foi possível gerar insights agora. Você pode tentar novamente nas configurações.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights
                  .sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 }
                    return order[a.priority] - order[b.priority]
                  })
                  .map((insight, i) => {
                    const cfg = PRIORITY_CONFIG[insight.priority]
                    return (
                      <div
                        key={i}
                        className={`bg-white rounded-xl border p-4 shadow-sm ${cfg.color.includes('red') ? 'border-red-100' : 'border-[#FF6A00]/20'}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl leading-none mt-0.5">{CATEGORY_ICONS[insight.category]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-[#1A1A1A]">{insight.title}</h3>
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-[#1A1A1A]/70 mt-1">{insight.description}</p>
                            <div className="mt-2 bg-[#1A1A1A]/5 rounded-lg px-3 py-2">
                              <p className="text-xs font-medium text-[#1A1A1A]/70">
                                <span className="text-emerald-700">Ação: </span>
                                {insight.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {error && <p className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full bg-[#FF6A00] text-white rounded-xl py-3 text-sm font-bold hover:bg-[#E65C00] disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? 'Finalizando...' : 'Ir para a plataforma →'}
            </button>
            <p className="text-center text-xs text-[#1A1A1A]/50">Esses insights ficam salvos nas suas configurações de perfil.</p>
          </div>
        )}
      </div>
    </div>
  )
}
