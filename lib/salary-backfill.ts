import { createAdminClient } from '@/lib/supabase-admin'
import { extractSalaryFromHtml, type ExtractedSalary } from '@/lib/utils'
import { fetchJobDescription } from '@/lib/scraper'

function parseSalaryNum(val: string | null): number | null {
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

export function toSalaryFields(extracted: ExtractedSalary | null) {
  if (!extracted) return null
  const salary_min = parseSalaryNum(extracted.min)
  const salary_max = parseSalaryNum(extracted.max)
  if (!salary_min && !salary_max) return null
  return { salary_min, salary_max, salary_currency: extracted.currency ?? null }
}

/**
 * Backfill salary_min/salary_max for jobs missing salary data.
 * Strategy 1: extract from stored raw_description text.
 * Strategy 2: re-fetch the job page URL and extract from fresh HTML.
 * Self-heals: once salary is set, the job won't be queried again.
 */
export async function backfillMissingSalaries(limit = 20) {
  const admin = createAdminClient()
  const { data: jobs } = await admin
    .from('jobs')
    .select('id, url, raw_description')
    .eq('enrichment_status', 'done')
    .is('salary_min', null)
    .is('salary_max', null)
    .limit(limit)

  if (!jobs || jobs.length === 0) return 0

  let updated = 0

  await Promise.all(jobs.map(async (job) => {
    // Strategy 1: extract from stored raw_description
    if (job.raw_description) {
      const salary = toSalaryFields(extractSalaryFromHtml(job.raw_description))
      if (salary) {
        await admin.from('jobs').update(salary).eq('id', job.id)
        updated++
        return
      }
    }

    // Strategy 2: re-fetch the job page and extract from fresh HTML
    if (job.url) {
      try {
        const { extractedSalary } = await fetchJobDescription(job.url)
        const salary = toSalaryFields(extractedSalary)
        if (salary) {
          await admin.from('jobs').update(salary).eq('id', job.id)
          updated++
        }
      } catch {
        // Fetch failed, skip
      }
    }
  }))

  return updated
}
