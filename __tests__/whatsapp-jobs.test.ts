import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isSupportedWhatsAppJobUrl, parseWhatsAppJob } from '@/lib/whatsapp-jobs'
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/openrouter', () => ({ generateOpenRouterText: vi.fn() }))
vi.mock('@/lib/scraper', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/scraper')>(), fetchJobDescription: vi.fn() }))
import { createAdminClient } from '@/lib/supabase-admin'
import { fetchJobDescription } from '@/lib/scraper'
import { generateOpenRouterText } from '@/lib/openrouter'
import { POST } from '@/app/api/cron/whatsapp-jobs/route'

const source = 'Analista de Legal Operations — Acme. LOCATION: São Paulo. Excel, dashboards.'
const extracted = { is_job: true, title: 'Analista de Legal Operations', company: 'Acme', location: 'São Paulo' }
const url = 'https://acme.gupy.io/jobs/1234567'
describe('CLOC job ingestion', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('WHATSAPP_SUMMARY_INGEST_SECRET', 'test-secret') })
  it.each(['http://acme.gupy.io/jobs/1','https://gupy.io.evil.test/x','https://127.0.0.1','https://user:pass@acme.gupy.io/jobs/1','https://acme.gupy.io:8443/jobs/1'])('rejects unsafe or unsupported URL %s', value => {
    expect(isSupportedWhatsAppJobUrl(value)).toBe(false)
  })
  it('accepts public ATS and LinkedIn URLs', () => {
    expect(isSupportedWhatsAppJobUrl(url)).toBe(true)
    expect(isSupportedWhatsAppJobUrl('https://www.linkedin.com/jobs/view/123456789')).toBe(true)
  })
  it('requires page evidence and Legal Ops relevance', () => {
    expect(parseWhatsAppJob(JSON.stringify(extracted), source)?.title).toBe(extracted.title)
    expect(parseWhatsAppJob(JSON.stringify({...extracted,company:'Invented'}), source)).toBeNull()
    expect(parseWhatsAppJob(JSON.stringify({...extracted,location:'Brasil'}), source)).toBeNull()
    expect(parseWhatsAppJob(JSON.stringify({...extracted,title:'Advogado'}), source+' Advogado')).toBeNull()
    expect(parseWhatsAppJob(JSON.stringify({...extracted,is_job:false}), source)).toBeNull()
  })
  it.each([undefined, 'Bearer wrong'])('rejects unauthorized requests %s before touching database', async authorization => {
    const response = await POST(new Request('https://legalops.work/api/cron/whatsapp-jobs', {method:'POST',headers:authorization?{authorization}:{},body:JSON.stringify({url})}))
    expect(response.status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })
  it('fails closed when the server secret is absent', async () => {
    vi.stubEnv('WHATSAPP_SUMMARY_INGEST_SECRET','')
    expect((await POST(request({url}))).status).toBe(401)
  })
  it('rejects malformed JSON and oversized payloads', async () => {
    expect((await POST(new Request('https://example.com', {method:'POST',headers:{authorization:'Bearer test-secret'},body:'{'}))).status).toBe(400)
    expect((await POST(request({url:'a'.repeat(4100)}))).status).toBe(413)
  })
  it('does not publish or call AI for an existing live job', async () => {
    const chain = {select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:{id:'existing',enrichment_status:'done',url_status:'live',eligibility_status:'eligible'},error:null})}
    vi.mocked(createAdminClient).mockReturnValue({from:vi.fn().mockReturnValue(chain)} as never)
    expect(await (await POST(request({url}))).json()).toEqual({status:'duplicate',job_id:'existing'})
    expect(fetchJobDescription).not.toHaveBeenCalled()
  })
  it('only publishes verified, enriched public page content', async () => {
    const insert = vi.fn().mockReturnValue({select:()=>({single:async()=>({data:{id:'new-job'},error:null})})})
    const chain = {select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:null,error:null}),insert}
    vi.mocked(createAdminClient).mockReturnValue({from:()=>chain} as never)
    vi.mocked(fetchJobDescription).mockResolvedValue({description:source,finalUrl:url,urlStatus:'live',httpStatus:200,companyLogoUrl:'https://acme.com/logo.png',extractedSalary:null})
    vi.mocked(generateOpenRouterText).mockResolvedValue(JSON.stringify(extracted))
    expect(await (await POST(request({url}))).json()).toMatchObject({status:'published',job_id:'new-job'})
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({raw_description:source,enrichment_status:'done',eligibility_status:'eligible',url_status:'live'}))
  })
})
function request(body: unknown) {
  return new Request('https://legalops.work/api/cron/whatsapp-jobs',{method:'POST',headers:{authorization:'Bearer test-secret'},body:JSON.stringify(body)})
}
