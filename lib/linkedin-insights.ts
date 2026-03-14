import { generateKimiText } from './kimi'
import type { LinkedInInsight, ProfessionalType } from './types'

const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  law_firm: 'escritório de advocacia',
  legal_dept: 'departamento jurídico de empresa',
  public_sector: 'cargo público / concurso',
  freelance: 'advogado(a) freelance / autônomo(a)',
  other: 'outro setor jurídico',
}

export async function fetchLinkedInText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LegalOpsCRM/1.0; +https://legalops.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return ''
    const html = await res.text()
    const { stripHtml } = await import('./utils')
    return stripHtml(html).slice(0, 6000)
  } catch {
    return ''
  }
}

export function buildLinkedInInsightsPrompt({
  profileText,
  linkedinUrl,
  currentRole,
  professionalType,
  yearsExperience,
  areasOfExpertise,
}: {
  profileText: string
  linkedinUrl: string
  currentRole: string | null
  professionalType: ProfessionalType | null
  yearsExperience: number | null
  areasOfExpertise: string[]
}): string {
  const contextLines = [
    `LinkedIn URL: ${linkedinUrl}`,
    currentRole ? `Cargo atual: ${currentRole}` : null,
    professionalType
      ? `Tipo de atuação: ${PROFESSIONAL_TYPE_LABELS[professionalType]}`
      : null,
    yearsExperience != null ? `Anos de experiência: ${yearsExperience}` : null,
    areasOfExpertise.length > 0
      ? `Áreas de atuação: ${areasOfExpertise.join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  const profileSection = profileText
    ? `\nConteúdo extraído do perfil LinkedIn (pode estar incompleto):\n${profileText}`
    : '\n(Não foi possível extrair o conteúdo público do perfil LinkedIn automaticamente.)'

  return `Você é um especialista em carreira jurídica e Legal Operations no Brasil. Analise o perfil LinkedIn de um profissional jurídico e gere insights práticos e acionáveis de "quick wins" para melhorar o perfil e conquistar mais vagas na área.

Contexto do profissional:
${contextLines}
${profileSection}

Gere exatamente 5 a 7 insights de quick wins priorizados. Foque em melhorias concretas e específicas para profissionais de Legal Operations no Brasil. Cada insight deve ser altamente acionável.

Retorne APENAS JSON válido, sem explicações, no seguinte formato:
[
  {
    "category": "headline" | "photo" | "about" | "experience" | "skills" | "recommendations" | "activity" | "keywords" | "other",
    "priority": "high" | "medium" | "low",
    "title": "título curto do insight (máx 60 chars)",
    "description": "descrição do problema ou oportunidade (1-2 frases)",
    "action": "ação específica e concreta a tomar (1-2 frases)"
  }
]

Exemplos de bons insights para Legal Ops:
- Headline sem "Legal Operations" prejudica busca por recrutadores
- Seção "Sobre" ausente reduz visualizações em 30%
- Ausência de habilidades como "CLM", "Contract Management", "LegalTech" nas skills
- Sem recomendações de pares ou gestores
- Falta de publicações/posts demonstrando expertise em Legal Ops
- Experiências sem métricas (ex: "reduzi custos em X%", "implementei X contratos/mês")`
}

const VALID_CATEGORIES = new Set([
  'headline', 'photo', 'about', 'experience',
  'skills', 'recommendations', 'activity', 'keywords', 'other',
])
const VALID_PRIORITIES = new Set(['high', 'medium', 'low'])

export function parseInsightsResponse(text: string): LinkedInInsight[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const raw = JSON.parse(jsonMatch[0])
    if (!Array.isArray(raw)) return []

    return raw
      .filter(
        (item: unknown): item is LinkedInInsight =>
          typeof item === 'object' &&
          item !== null &&
          VALID_CATEGORIES.has((item as LinkedInInsight).category) &&
          VALID_PRIORITIES.has((item as LinkedInInsight).priority) &&
          typeof (item as LinkedInInsight).title === 'string' &&
          typeof (item as LinkedInInsight).description === 'string' &&
          typeof (item as LinkedInInsight).action === 'string'
      )
      .slice(0, 10)
  } catch {
    return []
  }
}

export async function generateLinkedInInsights(params: {
  linkedinUrl: string
  currentRole: string | null
  professionalType: ProfessionalType | null
  yearsExperience: number | null
  areasOfExpertise: string[]
}): Promise<{ insights: LinkedInInsight[]; rawText: string }> {
  const profileText = await fetchLinkedInText(params.linkedinUrl)

  const prompt = buildLinkedInInsightsPrompt({
    profileText,
    ...params,
  })

  const apiKey = process.env.KIMI_API_KEY
  if (!apiKey) {
    return { insights: [], rawText: profileText }
  }

  const text = await generateKimiText({
    systemPrompt:
      'Você é um especialista em carreira jurídica. Retorne apenas JSON válido.',
    userPrompt: prompt,
    maxTokens: 2048,
    temperature: 0.3,
  })

  const insights = parseInsightsResponse(text)
  return { insights, rawText: profileText }
}
