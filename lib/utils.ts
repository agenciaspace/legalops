export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const KEYWORDS = [
  'legal operations',
  'legal ops',
  'clm',
  'contract management',
  'head of legal',
  'operações jurídicas',
  'gestão de contratos',
]

export function matchesKeywords(text: string, keywords: string[] = KEYWORDS): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}
