type SummarySource = {
  title: string
  body: string
}

export type GeneratedDiscussionSummary = {
  title: string
  summary: string
  keyPoints: string[]
}

export function parseDiscussionSummaryResponse(raw: string): GeneratedDiscussionSummary | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

  try {
    const parsed = JSON.parse(cleaned) as { title?: unknown; summary?: unknown; key_points?: unknown }
    if (typeof parsed.title !== 'string' || typeof parsed.summary !== 'string') return null
    const keyPoints = Array.isArray(parsed.key_points)
      ? parsed.key_points.filter((point): point is string => typeof point === 'string').slice(0, 6)
      : []

    return {
      title: parsed.title.trim().slice(0, 180),
      summary: parsed.summary.trim().slice(0, 10000),
      keyPoints,
    }
  } catch {
    return null
  }
}

export function buildDiscussionSummaryFallback(sources: SummarySource[]): GeneratedDiscussionSummary {
  const distinctTitles = Array.from(new Set(sources.map(source => source.title.trim()).filter(Boolean)))
  const keyPoints = distinctTitles.slice(0, 5)
  const excerpts = sources
    .map(source => source.body.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map(body => body.length > 220 ? `${body.slice(0, 217)}…` : body)

  return {
    title: distinctTitles[0] ? `Radar da semana: ${distinctTitles[0]}`.slice(0, 180) : 'Radar semanal das discussões',
    summary: excerpts.join(' ') || 'Ainda não houve conteúdo suficiente para uma síntese detalhada neste período.',
    keyPoints,
  }
}
