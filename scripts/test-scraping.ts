/**
 * Live smoke test for the full scraping pipeline.
 *
 * Usage:
 *   FIRECRAWL_API_KEY=fc-xxx npx tsx scripts/test-scraping.ts
 *
 * Hits Firecrawl + the four legacy ATS boards, reports counts and a sample.
 * No DB writes.
 */

import { scrapeAllBoards } from '../lib/scraper'

async function main() {
  const startedAt = Date.now()
  const result = await scrapeAllBoards()
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)

  console.log('\n=== SCRAPING SMOKE TEST ===')
  console.log(`elapsed:           ${elapsedSec}s`)
  console.log(`discoverySource:   ${result.discoverySource}`)
  console.log(`firecrawlCount:    ${result.firecrawlCount}`)
  console.log(`legacyCount:       ${result.legacyCount}`)
  console.log(`combined (dedup):  ${result.jobs.length}`)
  if (result.errors.length > 0) {
    console.log(`errors:`)
    for (const err of result.errors) console.log(`  - ${err}`)
  }

  console.log('\n=== SAMPLE (up to 10) ===')
  for (const job of result.jobs.slice(0, 10)) {
    console.log(`  [${job.source_board}] ${job.title} @ ${job.company}`)
    console.log(`     ${job.location ?? '-'} | salary=${job.salary_range ?? '-'}`)
    console.log(`     ${job.url}`)
  }

  console.log('\n=== BREAKDOWN BY SOURCE ===')
  const bySource: Record<string, number> = {}
  for (const job of result.jobs) {
    bySource[job.source_board] = (bySource[job.source_board] ?? 0) + 1
  }
  for (const [source, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source.padEnd(20)} ${count}`)
  }
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
