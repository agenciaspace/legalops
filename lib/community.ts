export type CommunityCategoryGroup = 'start' | 'latent' | 'operations' | 'strategy'

type CommunityCategory = {
  label: string
  title: string
  description: string
  tone: string
  group: CommunityCategoryGroup
}

export const COMMUNITY_CATEGORIES: Record<string, CommunityCategory> = {
  anuncio: {
    label: 'Anúncios',
    title: 'Anúncios',
    description: 'Novidades, comunicados e atualizações importantes do Club.',
    tone: 'bg-orange-100 text-orange-800',
    group: 'start',
  },
  apresentacoes: {
    label: 'Apresentações',
    title: 'Apresente-se',
    description: 'Conheça as pessoas por trás das operações jurídicas.',
    tone: 'bg-sky-100 text-sky-800',
    group: 'start',
  },
  discussao: {
    label: 'Discussão geral',
    title: 'Discussões gerais',
    description: 'Perguntas e trocas sobre o dia a dia de Legal Operations.',
    tone: 'bg-stone-100 text-stone-700',
    group: 'start',
  },
  cases: {
    label: 'Cases & playbooks',
    title: 'Cases & playbooks',
    description: 'O que funcionou, o que falhou e o que faríamos diferente.',
    tone: 'bg-amber-100 text-amber-800',
    group: 'start',
  },
  'ia-automacao': {
    label: 'IA & automação',
    title: 'IA & automação',
    description: 'Casos de uso, agentes, automações, governança e adoção responsável.',
    tone: 'bg-fuchsia-100 text-fuchsia-800',
    group: 'latent',
  },
  'dados-metricas': {
    label: 'Dados, métricas & BI',
    title: 'Dados, métricas & BI',
    description: 'Indicadores, dashboards e decisões orientadas por evidências.',
    tone: 'bg-blue-100 text-blue-800',
    group: 'latent',
  },
  'contratos-clm': {
    label: 'Contratos & CLM',
    title: 'Contratos & CLM',
    description: 'Processo contratual, tecnologia, adoção, dados e experiência do negócio.',
    tone: 'bg-teal-100 text-teal-800',
    group: 'latent',
  },
  'processos-projetos': {
    label: 'Processos & projetos',
    title: 'Processos & projetos',
    description: 'Intake, priorização, desenho de fluxo e gestão de portfólio.',
    tone: 'bg-cyan-100 text-cyan-800',
    group: 'operations',
  },
  ferramentas: {
    label: 'Tech stack & integrações',
    title: 'Tech stack & integrações',
    description: 'Ferramentas, arquitetura, integrações e tecnologia aplicada à operação.',
    tone: 'bg-emerald-100 text-emerald-800',
    group: 'operations',
  },
  'financeiro-fornecedores': {
    label: 'Spend & fornecedores',
    title: 'Spend, escritórios & fornecedores',
    description: 'Orçamento, performance, sourcing e relacionamento com parceiros.',
    tone: 'bg-lime-100 text-lime-800',
    group: 'operations',
  },
  'governanca-conhecimento': {
    label: 'Governança & conhecimento',
    title: 'Governança & conhecimento',
    description: 'Informação, segurança, retenção, taxonomias e playbooks vivos.',
    tone: 'bg-slate-100 text-slate-800',
    group: 'operations',
  },
  'estrategia-maturidade': {
    label: 'Estratégia & maturidade',
    title: 'Estratégia & maturidade',
    description: 'Diagnósticos, roadmaps, business cases e alinhamento ao negócio.',
    tone: 'bg-indigo-100 text-indigo-800',
    group: 'strategy',
  },
  'modelos-entrega': {
    label: 'Modelos de entrega',
    title: 'Modelos de entrega',
    description: 'Sourcing, autosserviço, ALSPs e desenho da entrega jurídica.',
    tone: 'bg-rose-100 text-rose-800',
    group: 'strategy',
  },
  carreira: {
    label: 'Pessoas & liderança',
    title: 'Pessoas, carreira & liderança',
    description: 'Competências, desenho de equipe, influência e saúde organizacional.',
    tone: 'bg-violet-100 text-violet-800',
    group: 'strategy',
  },
}

export function getCommunityCategory(category: string) {
  return COMMUNITY_CATEGORIES[category] ?? COMMUNITY_CATEGORIES.discussao
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'LO'
}

const AVATAR_TONES = [
  'bg-[#E4EEFF] text-[#315B94]',
  'bg-[#F3E8FF] text-[#74459A]',
  'bg-[#E3F5EB] text-[#276A49]',
  'bg-[#FFF0E3] text-[#9B5729]',
  'bg-[#FFE7EB] text-[#99485A]',
]

export function getAvatarTone(name: string) {
  const seed = Array.from(name).reduce((total, character) => total + character.charCodeAt(0), 0)
  return AVATAR_TONES[seed % AVATAR_TONES.length]
}

export function formatCommunityDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: includeTime ? 'short' : 'long',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

export function getCommunityLevel(level: number) {
  const labels: Record<number, string> = {
    1: 'Explorador',
    2: 'Operador',
    3: 'Construtor',
    4: 'Estrategista',
    5: 'Referência',
  }
  return labels[level] ?? labels[1]
}

export type ClubAccess = {
  club_access_status?: string | null
  club_access_expires_at?: string | null
}

export function hasActiveClubAccess(access?: ClubAccess | null, now = new Date()) {
  if (!access || !['active', 'complimentary'].includes(access.club_access_status ?? '')) return false
  if (!access.club_access_expires_at) return true
  return new Date(access.club_access_expires_at).getTime() > now.getTime()
}
