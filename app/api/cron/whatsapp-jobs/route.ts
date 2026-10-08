import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { generateOpenRouterText } from '@/lib/openrouter'
import { canonicalizeJobUrl, fetchJobDescription, inferSourceBoardFromUrl } from '@/lib/scraper'
import { isPublishableJobRecord } from '@/lib/job-publication'
import { resolveCompanyLogoUrl } from '@/lib/company-logo'
import { isSupportedWhatsAppJobUrl, parseWhatsAppJob, WHATSAPP_JOB_PROMPT } from '@/lib/whatsapp-jobs'

export const dynamic = 'force-dynamic'
export const maxDuration = 180
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

export async function POST(request: Request) {
  // Reuse the existing VPS-to-Worker credential; never accept browser sessions.
  const secret = process.env.WHATSAPP_SUMMARY_INGEST_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return reply({ error: 'Unauthorized' }, 401)
  const body = await request.text()
  if (body.length > 4096) return reply({ error: 'Payload too large' }, 413)
  let input
  try { input = JSON.parse(body) } catch { return reply({ error: 'Invalid JSON' }, 400) }
  if (!isSupportedWhatsAppJobUrl(input?.url)) return reply({ status: 'pending', reason: 'unsupported_url' })
  try {
    const db = createAdminClient()
    const originalUrl = canonicalizeJobUrl(input.url)
    const findExisting = async (url: string) => {
      const { data, error } = await db.from('jobs').select('id,enrichment_status,url_status,eligibility_status').eq('url', url).maybeSingle()
      if (error) throw error
      return data
    }
    let existing = await findExisting(originalUrl)
    if (existing?.enrichment_status === 'done' && existing.url_status === 'live' && existing.eligibility_status === 'eligible') return reply({ status: 'duplicate', job_id: existing.id })
    const page = await fetchJobDescription(originalUrl)
    if (page.urlStatus === 'dead') return reply({ status: 'closed' })
    if (page.urlStatus !== 'live' || !page.description) return reply({ status: 'retry', reason: 'page_unavailable' })
    const url = canonicalizeJobUrl(page.finalUrl)
    existing = await findExisting(url)
    if (existing?.enrichment_status === 'done' && existing.url_status === 'live' && existing.eligibility_status === 'eligible') return reply({ status: 'duplicate', job_id: existing.id })
    const extracted = await generateOpenRouterText({
      systemPrompt: WHATSAPP_JOB_PROMPT, userPrompt: page.description,
      model: 'openai/gpt-4.1-mini', maxTokens: 1800, timeoutMs: 45000,
    })
    const job = parseWhatsAppJob(extracted, page.description)
    if (!job) return reply({ status: 'pending', reason: 'eligibility_not_confirmed' })
    const logo = resolveCompanyLogoUrl(job.company, page.companyLogoUrl)
    if (!isPublishableJobRecord({ url, urlStatus: page.urlStatus, companyLogoUrl: logo })) return reply({ status: 'pending', reason: 'publication_requirements' })
    const now = new Date().toISOString()
    const record = { ...job, url, source_board: inferSourceBoardFromUrl(url),
      raw_description: page.description, company_logo_url: logo,
      enrichment_status: 'done', enrichment_attempts: 0, url_status: 'live',
      eligibility_status: 'eligible', eligibility_reason: 'eligible',
      accepts_brazil: true, url_checked_at: now, last_seen_at: now }
    const query = existing
      ? db.from('jobs').update(record).eq('id', existing.id)
      : db.from('jobs').insert(record)
    const { data, error } = await query.select('id').single()
    if (error?.code === '23505') return reply({ status: 'duplicate' })
    if (error) throw error
    return reply({ status: 'published', job_id: data.id, title: job.title, company: job.company })
  } catch {
    // Do not log provider responses, credentials or conversation data.
    console.error('[whatsapp-jobs] Import failed; source queue will retry')
    return reply({ status: 'retry', reason: 'import_failed' }, 503)
  }
}
