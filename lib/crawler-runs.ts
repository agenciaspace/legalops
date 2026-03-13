export type CrawlerDiscoverySource = 'firecrawl' | 'legacy'

export interface CrawlerRun {
  id: string
  provider: string
  discovery_source: CrawlerDiscoverySource
  scraped_count: number
  inserted_count: number
  duplicate_count: number
  enriched_count: number
  failed_count: number
  leaders_backfilled: number
  notes: Record<string, unknown>
  started_at: string
  completed_at: string
}

export interface CrawlerStats {
  latestRun: CrawlerRun | null
  insertedLast7Days: number
}

export function formatCrawlerDiscoverySource(source: CrawlerDiscoverySource): string {
  return source === 'firecrawl' ? 'Firecrawl' : 'Legacy fallback'
}

export function getCrawlerRunHeadline(stats: CrawlerStats): string {
  if (!stats.latestRun) {
    return 'Crawler sem execucoes registradas ainda.'
  }

  if (stats.latestRun.inserted_count > 0) {
    return `+${stats.latestRun.inserted_count} vagas novas na ultima varredura.`
  }

  return 'Nenhuma vaga nova na ultima varredura.'
}
