/**
 * Test script for Firecrawl /v2/agent endpoint.
 * Usage: FIRECRAWL_API_KEY=fc-xxx npx tsx scripts/test-firecrawl.ts
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY ?? ''
const FIRECRAWL_AGENT_URL = 'https://api.firecrawl.dev/v2/agent'

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

const AGENT_PROMPT = `Find current job listings for Legal Operations roles. Search job boards like Indeed, GoInhouse, CLOC Jobs, Legal.io, and LegalOperators for positions with titles containing "Legal Operations", "Legal Ops", "Head of Legal", "General Counsel", "Chief Legal Officer", or "CLM Manager". Return all matching job listings with their title, company, location, salary range (if available), and application link.`

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  if (!FIRECRAWL_API_KEY) {
    console.error('Set FIRECRAWL_API_KEY env var')
    process.exit(1)
  }

  console.log('=== Firecrawl Agent Test ===\n')

  // Start agent
  console.log('Starting agent...')
  const startRes = await fetch(FIRECRAWL_AGENT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: AGENT_PROMPT,
      schema: EXTRACT_SCHEMA,
      model: 'spark-1-mini',
      maxCredits: 500,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!startRes.ok) {
    console.error(`Agent start failed: HTTP ${startRes.status} ${await startRes.text()}`)
    process.exit(1)
  }

  const startData = await startRes.json()
  if (!startData.success || !startData.id) {
    console.error('Agent start error:', startData.error ?? 'no job id')
    process.exit(1)
  }

  const jobId = startData.id
  console.log(`Agent job started: ${jobId}`)

  // Poll for completion
  const deadline = Date.now() + 120_000
  let result: { data?: { jobListings?: Array<Record<string, string>> }; creditsUsed?: number } | null = null

  while (Date.now() < deadline) {
    await sleep(5_000)
    process.stdout.write('.')

    const statusRes = await fetch(`${FIRECRAWL_AGENT_URL}/${jobId}`, {
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
      signal: AbortSignal.timeout(15_000),
    })

    if (!statusRes.ok) continue

    const statusData = await statusRes.json()

    if (statusData.status === 'completed') {
      result = statusData
      break
    }

    if (statusData.status === 'failed') {
      console.error(`\nAgent failed: ${statusData.error ?? 'unknown'}`)
      process.exit(1)
    }
  }

  if (!result) {
    console.error('\nAgent timed out after 120s')
    process.exit(1)
  }

  const listings = result.data?.jobListings ?? []
  const credits = result.creditsUsed ?? '?'
  console.log(`\nCredits used: ${credits} | Listings found: ${listings.length}`)

  let withSalary = 0
  const legalOpsRe = /\blegal\s+(operations|ops)\b/i

  console.log('\n=== ALL RESULTS ===\n')
  for (const job of listings) {
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

  const legalOpsCount = listings.filter(j => legalOpsRe.test(j.jobTitle ?? '')).length
  console.log('\n=== SUMMARY ===')
  console.log(`Total listings:       ${listings.length}`)
  console.log(`Legal Ops matches:    ${legalOpsCount}`)
  console.log(`With salary data:     ${withSalary}`)
  console.log(`Salary hit rate:      ${listings.length > 0 ? Math.round(withSalary / listings.length * 100) : 0}%`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
