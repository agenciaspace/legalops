import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { extractSalaryFromHtml } from '@/lib/utils'
import { fetchJobDescription } from '@/lib/scraper'
import { toSalaryFields, backfillMissingSalaries } from '@/lib/salary-backfill'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fix = req.nextUrl.searchParams.get('fix') === 'true'
  const supabase = createAdminClient()

  // Get all jobs with missing salary
  const { data: allJobs, error: allError } = await supabase
    .from('jobs')
    .select('id, title, company, url, salary_min, salary_max, salary_currency, enrichment_status')
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(50)

  if (allError) {
    return NextResponse.json({ error: 'Failed to query jobs', details: allError.message })
  }

  const { data: missingSalary, error: missingError } = await supabase
    .from('jobs')
    .select('id, title, company, url, raw_description')
    .eq('enrichment_status', 'done')
    .is('salary_min', null)
    .is('salary_max', null)
    .limit(20)

  if (missingError) {
    return NextResponse.json({ error: 'Failed to query missing salary jobs', details: missingError.message })
  }

  const diagnostics = []

  for (const job of missingSalary ?? []) {
    const diag: Record<string, unknown> = {
      id: job.id,
      title: job.title,
      company: job.company,
      url: job.url,
      raw_description_length: job.raw_description?.length ?? 0,
      raw_description_first_500: job.raw_description?.slice(0, 500) ?? null,
      has_salary_range_text: job.raw_description?.includes('Salary range:') ?? false,
      has_salary_keyword: job.raw_description?.toLowerCase().includes('salary') ?? false,
    }

    // Try strategy 1: extract from raw_description
    if (job.raw_description) {
      const extracted = extractSalaryFromHtml(job.raw_description)
      diag.strategy1_extracted = extracted
      diag.strategy1_parsed = extracted ? toSalaryFields(extracted) : null
    }

    // Try strategy 2: re-fetch job page
    if (job.url) {
      try {
        const { description, extractedSalary } = await fetchJobDescription(job.url)
        diag.strategy2_fetched = true
        diag.strategy2_description_length = description?.length ?? 0
        diag.strategy2_description_first_500 = description?.slice(0, 500) ?? null
        diag.strategy2_extracted = extractedSalary
        diag.strategy2_parsed = extractedSalary ? toSalaryFields(extractedSalary) : null

        // Apply fix if requested
        if (fix) {
          const salary = toSalaryFields(extractedSalary) ?? (job.raw_description ? toSalaryFields(extractSalaryFromHtml(job.raw_description)) : null)
          if (salary) {
            const { error: updateError } = await supabase.from('jobs').update(salary).eq('id', job.id)
            diag.fix_applied = !updateError
            diag.fix_salary = salary
            diag.fix_error = updateError?.message ?? null
          } else {
            diag.fix_applied = false
            diag.fix_reason = 'no salary found from any strategy'
          }
        }
      } catch (e) {
        diag.strategy2_fetched = false
        diag.strategy2_error = String(e)
      }
    }

    diagnostics.push(diag)
  }

  return NextResponse.json({
    total_jobs: allJobs?.length ?? 0,
    jobs_with_salary: allJobs?.filter(j => j.salary_min || j.salary_max).length ?? 0,
    jobs_without_salary: missingSalary?.length ?? 0,
    all_jobs_summary: allJobs?.map(j => ({
      id: j.id,
      title: j.title,
      company: j.company,
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      salary_currency: j.salary_currency,
    })),
    diagnostics,
  })
}
