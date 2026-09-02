import { createAdminClient } from '@/lib/supabase-admin'
import { generateOpenRouterText, getOpenRouterModel } from '@/lib/openrouter'

export type JobTrack = 'technical' | 'strategic' | 'hybrid' | 'operational'

export type PersonalizedCvProfile = {
  full_name: string
  current_role: string | null
  years_experience: number | null
  areas_of_expertise: string[]
  skills: string[]
  tools_used: string[]
  career_summary: string | null
  career_highlights: string[]
  base_cv_text: string | null
}

export type PersonalizedCvJob = {
  title: string
  company: string
  raw_description: string
}

export type PersonalizedCvContent = {
  headline: string
  summary: string
  skills: string[]
  highlights: string[]
  keywords: string[]
  markdown: string
}

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function classifyJobTrack(title: string, description: string): JobTrack {
  const text = normalized(`${title} ${description}`)
  const technicalTerms = ['automation', 'automacao', 'api', 'sql', 'data', 'dados', 'integration', 'integracao', 'engineer', 'developer', 'workflow', 'low-code', 'no-code', 'clm implementation', 'implantacao']
  const strategicTerms = ['head', 'director', 'diretor', 'strategy', 'estrategia', 'leadership', 'lideranca', 'budget', 'orcamento', 'executive', 'stakeholder', 'roadmap', 'governance', 'governanca']
  const technical = technicalTerms.filter(term => text.includes(term)).length
  const strategic = strategicTerms.filter(term => text.includes(term)).length
  if (technical > 0 && strategic > 0) return 'hybrid'
  if (technical > 0) return 'technical'
  if (strategic > 0) return 'strategic'
  return 'operational'
}

function compactJobDescription(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 9000)
}

export function buildPersonalizedCvPrompt(
  profile: PersonalizedCvProfile,
  job: PersonalizedCvJob,
  track: JobTrack,
) {
  return `Crie uma versão personalizada do currículo para esta vaga.

Regra absoluta: Nunca invente cargos, empregadores, datas, resultados, ferramentas ou competências. Apenas reorganize, resuma e enfatize fatos presentes no perfil/base do CV. Quando faltar evidência, omita.

Posicionamento da vaga: ${track}
Vaga: ${job.title} — ${job.company}
Descrição: ${compactJobDescription(job.raw_description)}

Perfil verificado:
${JSON.stringify(profile)}

Retorne somente JSON válido neste formato:
{"headline":"","summary":"","skills":[""],"highlights":[""],"keywords":[""],"markdown":""}

O markdown deve ser um CV completo, conciso, ATS-friendly, em português, preservando os fatos e priorizando sinais relevantes para uma vaga ${track}.`
}

function stringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .map(item => item.trim())
    .slice(0, limit)
}

export function parsePersonalizedCvResponse(text: string): PersonalizedCvContent | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const value = JSON.parse(match[0]) as Record<string, unknown>
    if (typeof value.headline !== 'string' || typeof value.summary !== 'string' || typeof value.markdown !== 'string') return null
    return {
      headline: value.headline.trim(),
      summary: value.summary.trim(),
      skills: stringArray(value.skills, 20),
      highlights: stringArray(value.highlights, 12),
      keywords: stringArray(value.keywords, 20),
      markdown: value.markdown.trim(),
    }
  } catch {
    return null
  }
}

export function buildFallbackPersonalizedCv(
  profile: PersonalizedCvProfile,
  job: PersonalizedCvJob,
  track: JobTrack,
): PersonalizedCvContent {
  const skills = Array.from(new Set([...profile.areas_of_expertise, ...profile.skills, ...profile.tools_used])).slice(0, 20)
    .sort((left, right) => Number(normalized(`${job.title} ${job.raw_description}`).includes(normalized(right))) - Number(normalized(`${job.title} ${job.raw_description}`).includes(normalized(left))))
  const highlights = profile.career_highlights.slice(0, 10)
  const headline = `${profile.current_role ?? 'Profissional'} | Objetivo: ${job.title}`
  const summary = profile.career_summary || `Profissional com experiência aderente à posição de ${job.title}.`
  const markdown = [
    `# ${profile.full_name}`,
    `## ${headline}`,
    summary,
    skills.length ? `## Competências relevantes\n${skills.map(skill => `- ${skill}`).join('\n')}` : '',
    highlights.length ? `## Resultados selecionados\n${highlights.map(item => `- ${item}`).join('\n')}` : '',
    profile.base_cv_text ? `## Experiência profissional\n${profile.base_cv_text}` : '',
  ].filter(Boolean).join('\n\n')
  return { headline, summary, skills, highlights, keywords: skills, markdown }
}

export async function createPersonalizedCvForEntry(params: {
  userId: string
  jobId: string
  pipelineEntryId: string
  useAi?: boolean
}) {
  const admin = createAdminClient()
  const [{ data: profile, error: profileError }, { data: job, error: jobError }] = await Promise.all([
    admin.from('account_profiles')
      .select('full_name, current_role, years_experience, areas_of_expertise, skills, tools_used, career_summary, career_highlights, base_cv_text')
      .eq('user_id', params.userId)
      .single(),
    admin.from('jobs').select('title, company, raw_description').eq('id', params.jobId).single(),
  ])
  if (profileError || jobError || !profile || !job) {
    throw new Error(profileError?.message ?? jobError?.message ?? 'Profile or job not found')
  }

  const normalizedProfile: PersonalizedCvProfile = {
    full_name: profile.full_name || 'Candidato(a)',
    current_role: profile.current_role,
    years_experience: profile.years_experience,
    areas_of_expertise: profile.areas_of_expertise ?? [],
    skills: profile.skills ?? [],
    tools_used: profile.tools_used ?? [],
    career_summary: profile.career_summary,
    career_highlights: profile.career_highlights ?? [],
    base_cv_text: profile.base_cv_text,
  }
  const normalizedJob: PersonalizedCvJob = job
  const track = classifyJobTrack(job.title, job.raw_description)
  const fallback = buildFallbackPersonalizedCv(normalizedProfile, normalizedJob, track)
  let content = fallback
  let model = 'deterministic-fallback'

  if (params.useAi !== false) try {
    const request = {
      systemPrompt: 'Você é um especialista em currículos ATS. Não invente nenhuma informação. Retorne somente JSON válido.',
      userPrompt: buildPersonalizedCvPrompt(normalizedProfile, normalizedJob, track),
      maxTokens: 3000,
      temperature: 0.1,
    }
    const response = await generateOpenRouterText(request)
    content = parsePersonalizedCvResponse(response) ?? fallback
    if (content !== fallback) {
      model = getOpenRouterModel()
    }
  } catch (error) {
    console.error('[personalized-cv] AI generation failed, using factual fallback:', error)
  }

  const { data: cv, error } = await admin.from('personalized_cvs').upsert({
    user_id: params.userId,
    job_id: params.jobId,
    pipeline_entry_id: params.pipelineEntryId,
    status: 'ready',
    job_track: track,
    headline: content.headline,
    summary: content.summary,
    content,
    markdown: content.markdown,
    model,
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,job_id' }).select('id, status, job_track, headline, summary, content, markdown, generated_at').single()
  if (error) throw error
  return cv
}
