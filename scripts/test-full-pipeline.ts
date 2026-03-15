/**
 * Full pipeline test: Firecrawl scrape -> salary parsing -> formatted output
 * Simulates the complete cron flow without DB
 * Usage: npx tsx scripts/test-full-pipeline.ts
 */
import { scrapeJobsWithFirecrawl } from '@/lib/scraper'
import { extractSalaryFromHtml } from '@/lib/utils'
import { formatSalary, hasSalary } from '@/lib/format-salary'

if (!process.env.FIRECRAWL_API_KEY) {
  process.env.FIRECRAWL_API_KEY = 'fc-ee4f6f509259440e9de314d95eeb36d6'
}

function parseSalaryValues(extracted: { min: string | null; max: string | null; currency: string | null } | null) {
  if (!extracted) return { salary_min: null, salary_max: null, salary_currency: null }

  const parseNum = (val: string | null): number | null => {
    if (!val) return null
    let cleaned = val.replace(/[R$€£₹¥A$C$S$HK$NZ$CHFkrzł₪,\s]/g, '')
    if (/k$/i.test(val.replace(/\s+/g, ''))) {
      cleaned = cleaned.replace(/k$/i, '')
      const num = parseFloat(cleaned)
      return isNaN(num) ? null : Math.round(num * 1000)
    }
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '')
    }
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : Math.round(num)
  }

  return {
    salary_min: parseNum(extracted.min),
    salary_max: parseNum(extracted.max),
    salary_currency: extracted.currency ?? null,
  }
}

async function main() {
  console.log('=== FULL PIPELINE TEST ===\n')
  console.log('1. Scraping job boards via Firecrawl /v1/scrape...\n')

  const jobs = await scrapeJobsWithFirecrawl()

  console.log(`\n2. Found ${jobs.length} Legal Ops jobs. Processing salary...\n`)

  let withSalary = 0
  let withoutSalary = 0

  for (const job of jobs) {
    const extracted = job.salary_range ? extractSalaryFromHtml(job.salary_range) : null
    const parsed = parseSalaryValues(extracted)

    const displayJob = {
      salary_min: parsed.salary_min,
      salary_max: parsed.salary_max,
      salary_currency: parsed.salary_currency,
    }

    const has = hasSalary(displayJob)
    if (has) withSalary++
    else withoutSalary++

    const salaryDisplay = formatSalary(displayJob)

    console.log(`  ${has ? '[$$]' : '[--]'} ${job.title}`)
    console.log(`     ${job.company} | ${job.location ?? '?'}`)
    console.log(`     Raw salary:    ${job.salary_range ?? '(none)'}`)
    console.log(`     Formatted:     ${salaryDisplay}`)
    console.log(`     DB values:     min=${parsed.salary_min} max=${parsed.salary_max} currency=${parsed.salary_currency}`)
    console.log(`     Source: ${job.source_board} | URL: ${job.url}`)
    console.log('')
  }

  console.log('=== RESULTADO ===')
  console.log(`Total jobs Legal Ops:   ${jobs.length}`)
  console.log(`Com salario parseado:   ${withSalary}`)
  console.log(`Sem salario:            ${withoutSalary}`)
  console.log(`Taxa de salario:        ${jobs.length > 0 ? Math.round(withSalary / jobs.length * 100) : 0}%`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
