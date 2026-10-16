export const NEWS_SOURCE_DOMAINS = ['harvey.ai', 'legora.com', 'cloc.org', 'acc.com', 'thomsonreuters.com', 'lexisnexis.com', 'netlex.com.br', 'projuris.com.br', 'aurum.com.br', 'docusign.com', 'ironcladapp.com', 'sirion.ai', 'imanage.com']

export function newsCandidateFromSearch(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const hit = value as Record<string, unknown>
  if (typeof hit.url !== 'string' || typeof hit.title !== 'string' || !hit.title.trim() || typeof hit.description !== 'string' || !hit.description.trim()) return null
  try {
    const url = new URL(hit.url)
    const domain = url.hostname.replace(/^www\./, '')
    if (url.protocol !== 'https:' || url.username || url.password || !NEWS_SOURCE_DOMAINS.includes(domain) || url.pathname === '/') return null
    url.hash = ''; url.search = ''
    return { url: url.toString(), title: hit.title.slice(0, 240), excerpt: hit.description.slice(0, 3000), source_name: domain }
  } catch { return null }
}
