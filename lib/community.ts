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
