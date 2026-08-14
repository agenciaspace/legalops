export const COMMUNITY_CATEGORIES: Record<string, { label: string; tone: string }> = {
  anuncio: { label: 'Anúncios', tone: 'bg-orange-100 text-orange-800' },
  apresentacoes: { label: 'Apresentações', tone: 'bg-sky-100 text-sky-800' },
  discussao: { label: 'Discussão', tone: 'bg-stone-100 text-stone-700' },
  carreira: { label: 'Carreira', tone: 'bg-violet-100 text-violet-800' },
  ferramentas: { label: 'Ferramentas', tone: 'bg-emerald-100 text-emerald-800' },
  cases: { label: 'Cases', tone: 'bg-amber-100 text-amber-800' },
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
