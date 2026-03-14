import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  calculateCompanyJobMatch,
  calculateCrawledJobMatch,
  MATCH_THRESHOLD,
} from '@/lib/job-matching'
import type { AccountProfile, CompanyJob, Job } from '@/lib/types'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get candidate profile
  const { data: profile } = await supabase
    .from('account_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const accountProfile = profile as unknown as AccountProfile

  // Get existing match IDs to avoid duplicates
  const { data: existingMatches } = await supabase
    .from('job_matches')
    .select('company_job_id, crawled_job_id')
    .eq('user_id', user.id)

  const existingCompanyJobIds = new Set(
    (existingMatches ?? []).filter(m => m.company_job_id).map(m => m.company_job_id)
  )
  const existingCrawledJobIds = new Set(
    (existingMatches ?? []).filter(m => m.crawled_job_id).map(m => m.crawled_job_id)
  )

  // Also exclude jobs already in user's pipeline
  const { data: pipelineEntries } = await supabase
    .from('user_pipeline_entries')
    .select('job_id')
    .eq('user_id', user.id)

  const pipelineJobIds = new Set((pipelineEntries ?? []).map(e => e.job_id))

  let newMatches = 0

  // Match against company-posted jobs
  const { data: companyJobs } = await supabase
    .from('company_jobs')
    .select('*')
    .eq('status', 'active')
    .limit(200)

  if (companyJobs) {
    const matchInserts = []
    for (const job of companyJobs as unknown as CompanyJob[]) {
      if (existingCompanyJobIds.has(job.id)) continue
      const { score, breakdown } = calculateCompanyJobMatch(accountProfile, job)
      if (score >= MATCH_THRESHOLD) {
        matchInserts.push({
          user_id: user.id,
          company_job_id: job.id,
          score,
          score_breakdown: breakdown,
        })
      }
    }
    if (matchInserts.length > 0) {
      const { data } = await supabase
        .from('job_matches')
        .upsert(matchInserts, { onConflict: 'user_id,company_job_id' })
        .select()
      newMatches += data?.length ?? 0
    }
  }

  // Match against crawled jobs (enriched ones only)
  const { data: crawledJobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(200)

  if (crawledJobs) {
    const matchInserts = []
    for (const job of crawledJobs as unknown as Job[]) {
      if (existingCrawledJobIds.has(job.id) || pipelineJobIds.has(job.id)) continue
      const { score, breakdown } = calculateCrawledJobMatch(accountProfile, job)
      if (score >= MATCH_THRESHOLD) {
        matchInserts.push({
          user_id: user.id,
          crawled_job_id: job.id,
          score,
          score_breakdown: breakdown,
        })
      }
    }
    if (matchInserts.length > 0) {
      const { data } = await supabase
        .from('job_matches')
        .upsert(matchInserts, { onConflict: 'user_id,crawled_job_id' })
        .select()
      newMatches += data?.length ?? 0
    }
  }

  return NextResponse.json({ new_matches: newMatches })
}
