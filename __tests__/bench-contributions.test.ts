// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { parseBenchSubmission, publicBenchEntry } from '@/lib/bench-contributions'
const state = vi.hoisted(() => ({ rpc: vi.fn(), admin: vi.fn(), query: vi.fn(), rows: [] as unknown[], count: 0 }))
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => { state.admin(); return { rpc: state.rpc, from: (table: string) => {
  state.query('from', table)
  const query: any = Object.fromEntries(['select','eq','order','range'].map(method => [method, (...args: unknown[]) => {state.query(method, ...args); return query}]))
  query.then = (resolve: (value: unknown) => unknown) => resolve({data: state.rows, count: state.count, error: null})
  return query
} } } }))
import { GET, POST, OPTIONS } from '@/app/api/bench/contributions/route'
const content = { kind: 'evidence', tool_name: 'Example CLM', tool_url: '', criterion: 'integrations', title: 'Integração no piloto', body: 'Teste sintético em um piloto de integração com sistemas existentes.', source_url: '', evidence_kind: 'hypothesis', observed_on: '', context: 'Cenário fictício de compras para validação técnica.', relationship: 'independent', public_name: 'Example contributor' }
const payload = () => ({...content, email: 'Private@Example.com', consent: true})
const request = (body: unknown, headers: Record<string,string> = {}) => new NextRequest('https://legalops.club/api/bench/contributions', {method:'POST', headers:{origin:'https://legalops.dev','content-type':'application/json','cf-connecting-ip':'192.0.2.1',...headers}, body:JSON.stringify(body)})
beforeEach(() => { vi.clearAllMocks(); state.rows = []; state.count = 0; vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-secret'); state.rpc.mockResolvedValue({ data: 'submission-id', error: null }) })
describe('public contribution intake', () => {
  it('rejects forged status, reviewer and extra personal fields from the public payload', async () => {
    const response = await POST(request({...payload(), status:'approved', reviewed_by:'attacker', secret:'hidden'}))
    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({status:'pending'})
    const args = state.rpc.mock.calls[0][1]
    expect(args.submission_content).toEqual(content)
    expect(args.contact_email).toBe('private@example.com')
    expect(args.network_key).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(args)).not.toContain('192.0.2.1')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://legalops.dev')
  })
  it('requires consent, useful context and appropriately dated evidence', async () => {
    for (const patch of [{consent:false},{body:'Short'},{evidence_kind:'official'},{evidence_kind:'demo'},{observed_on:'2026-02-30'},{source_url:'javascript:alert(1)'},{source_url:'https://user:secret@example.com'},{website:'bot'}]) {
      expect((await POST(request({...payload(), ...patch}))).status).toBe(400)
    }
    expect(state.admin).not.toHaveBeenCalled()
  })
  it('allows only supported origins and bounded JSON bodies', async () => {
    expect((await POST(request(payload(), {origin:'https://evil.example'}))).status).toBe(403)
    expect((await POST(request(payload(), {origin:''}))).status).toBe(403)
    expect((await OPTIONS(new NextRequest('https://legalops.club/api/bench/contributions', {headers:{origin:'https://legalops.dev'}}))).status).toBe(204)
    expect((await POST(request('x'.repeat(20001)))).status).toBe(413)
    expect((await POST(request(payload(), {'content-type':'text/plain'}))).status).toBe(415)
    expect(state.admin).not.toHaveBeenCalled()
  })
  it('fails closed without an edge IP and respects transactional daily rate limits', async () => {
    expect((await POST(request(payload(), {'cf-connecting-ip':''}))).status).toBe(503)
    expect(state.rpc).not.toHaveBeenCalled()
    state.rpc.mockResolvedValue({error:{message:'BENCH_RATE_LIMIT'}})
    expect((await POST(request(payload()))).status).toBe(429)
  })
  it('projects only reviewed public fields and applies publication filtering and pagination', async () => {
    state.rows = [{id:'pub',content:{...content,email:'secret@example.com',private_note:'secret'},published_at:'2026-09-17',review_note:'Reviewed for context',contact_email:'secret@example.com'}]
    state.count = 25
    const response = await GET(new NextRequest('https://legalops.club/api/bench/contributions?page=1'))
    const data = await response.json()
    expect(data.entries[0]).toEqual(publicBenchEntry(state.rows[0] as any))
    expect(JSON.stringify(data)).not.toContain('secret')
    expect(state.query).toHaveBeenCalledWith('eq','is_public',true)
    expect(state.query).toHaveBeenCalledWith('range',20,39)
    expect(data.has_more).toBe(false)
    expect(parseBenchSubmission(payload()).email).toBe('private@example.com')
  })
})
