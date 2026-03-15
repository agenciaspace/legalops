/**
 * Test script for Firecrawl /v2/scrape endpoint with salary extraction.
 * Usage: FIRECRAWL_API_KEY=fc-xxx npx tsx scripts/test-firecrawl.ts
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY ?? ''
const FIRECRAWL_SCRAPE_URL = 'https://api.firecrawl.dev/v2/scrape'

const TARGETS = [
  'https://www.indeed.com/jobs?q=%22Legal+Operations%22&sort=date',
  'https://www.indeed.com/jobs?q=%22Legal+Ops%22&sort=date',
  'https://www.goinhouse.com/jobs/search?q=Legal+Operations',
  'https://jobs.cloc.org/jobs?keywords=Legal+Operations',
]

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    jobListings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          jobTitle: { type: 'string' },
          companyName: { type: 'string' },
          location: { type: 'string' },
          salaryRange: { type: 'string', description: 'Salary or compensation range if shown' },
          applicationLink: { type: 'string' },
        },
        required: ['jobTitle', 'companyName', 'applicationLink'],
      },
    },
  },
  required: ['jobListings'],
}

async function scrapeBoard(url: string) {
  console.log(`\n--- Scraping: ${url}`)
  const res = await fetch(FIRECRAWL_SCRAPE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: [{ type: 'json', schema: EXTRACT_SCHEMA }],
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    console.error(`  HTTP ${res.status}: ${await res.text()}`)
    return []
  }

  const data = await res.json()
  if (!data.success) {
    console.error(`  Error: ${data.error}`)
    return []
  }

  const credits = data.data?.metadata?.creditsUsed ?? '?'
  const listings = data.data?.json?.jobListings ?? []
  console.log(`  Credits used: ${credits} | Listings found: ${listings.length}`)
  return listings
}

async function main() {
  if (!FIRECRAWL_API_KEY) {
    console.error('Set FIRECRAWL_API_KEY env var')
    process.exit(1)
  }

  console.log('=== Firecrawl Scrape Test ===')

  const allListings = (await Promise.all(TARGETS.map(scrapeBoard))).flat()

  let withSalary = 0
  const legalOpsRe = /\blegal\s+(operations|ops)\b/i

  console.log('\n=== ALL RESULTS ===\n')
  for (const job of allListings) {
    const isLegalOps = legalOpsRe.test(job.jobTitle ?? '')
    const salary = job.salaryRange || '(none)'
    const hasSalary = salary !== '(none)' &&
      !salary.toLowerCase().includes('not') &&
      salary.toLowerCase() !== 'n/a' &&
      salary.toLowerCase() !== 'full-time'

    if (hasSalary) withSalary++

    console.log(`  ${isLegalOps ? '[LO]' : '[--]'} ${job.jobTitle} @ ${job.companyName}`)
    console.log(`       Location: ${job.location ?? '?'} | Salary: ${salary}`)
  }

  const legalOpsCount = allListings.filter((j: { jobTitle?: string }) => legalOpsRe.test(j.jobTitle ?? '')).length
  console.log('\n=== SUMMARY ===')
  console.log(`Total listings:       ${allListings.length}`)
  console.log(`Legal Ops matches:    ${legalOpsCount}`)
  console.log(`With salary data:     ${withSalary}`)
  console.log(`Salary hit rate:      ${allListings.length > 0 ? Math.round(withSalary / allListings.length * 100) : 0}%`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
