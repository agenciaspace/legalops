import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user: { id: 'member' } as { id: string } | null, member: { club_access_status: 'complimentary', club_access_expires_at: null } as any, rpc: vi.fn(), original: null as any, contribution: null as any }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) }, from: (table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.member }), single: async () => ({ data: table === 'contract_map_sections' ? mocks.original : mocks.contribution }) }) }) }), rpc: mocks.rpc }) }))
import { POST } from '@/app/api/community/contract-map/route'
const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Example' }] }] }
const proposal = { action: 'suggest', section: 'contexto', version: 1, content, note: 'Explain contribution', license: true }
const post = (body: unknown) => POST(new Request('https://legalops.club/api/community/contract-map', { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'https://legalops.club' }, body: JSON.stringify(body) }))
beforeEach(() => { mocks.user = { id: 'member' }; mocks.member = { club_access_status: 'complimentary', club_access_expires_at: null }; mocks.rpc.mockReset().mockResolvedValue({ data: 'ok', error: null }) })
describe('Contract map permission boundary', () => {
  it('requires login', async () => { mocks.user = null; expect((await post(proposal)).status).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled() })
  it('requires active membership', async () => { mocks.member = null; expect((await post(proposal)).status).toBe(403); expect(mocks.rpc).not.toHaveBeenCalled() })
  it('requires explicit publishing license for suggestions', async () => { expect((await post({ ...proposal, license: false })).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled() })
  it('sends a suggestion with the authenticated RPC and no supplied author', async () => { expect((await post({ ...proposal, author_id: 'spoof' })).status).toBe(200); expect(mocks.rpc).toHaveBeenCalledWith('contract_map_submit', expect.objectContaining({ p_kind: 'suggestion', p_version: 1, p_license: true })); expect(mocks.rpc.mock.calls[0][1]).not.toHaveProperty('author_id') })
  it('returns a recoverable version conflict', async () => { mocks.rpc.mockResolvedValue({ error: { message: 'VERSION_CONFLICT' } }); const result = await post(proposal); expect(result.status).toBe(409); expect((await result.json()).conflict).toBe(true) })
  it('does not trust a client lead flag', async () => { mocks.rpc.mockResolvedValue({ error: { message: 'LEAD_REQUIRED' } }); expect((await post({ ...proposal, action: 'publish', isLead: true })).status).toBe(403) })
  it('rejects unsafe content before the database', async () => { expect((await post({ ...proposal, content: { type: 'html', text: '<script>' } })).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled() })
})

it('recomputes accepted changes on the server instead of trusting supplied content',async()=>{
 const paragraph=(text:string)=>({type:'paragraph',content:[{type:'text',text}]}); const before={type:'doc',content:[paragraph('A'),paragraph('Keep'),paragraph('B')]}; const after={type:'doc',content:[paragraph('New A'),paragraph('Keep'),paragraph('New B')]};
 mocks.original={content:before,version:1};mocks.contribution={section_id:'contexto',base_version:1,proposed_content:after};
 expect((await post({...proposal,action:'accept',id:'00000000-0000-0000-0000-000000000001',content,decisions:[true,false]})).status).toBe(200);
 expect(mocks.rpc).toHaveBeenCalledWith('contract_map_publish_notify',expect.objectContaining({p_content:{type:'doc',content:[paragraph('New A'),paragraph('Keep'),paragraph('B')]}}));
})
it('rejects incomplete partial reviews and invalid mention IDs',async()=>{expect((await post({...proposal,action:'accept',id:'00000000-0000-0000-0000-000000000001',decisions:[null]})).status).toBe(400);expect((await post({...proposal,mentions:['spoof']})).status).toBe(400);expect(mocks.rpc).not.toHaveBeenCalled()})

it('persists a selected text anchor through the member RPC and returns its id',async()=>{
 const anchor={start:10,end:15,prefix:'Antes ',suffix:' depois',source:'published'}
 expect((await post({action:'comment',section:'contexto',version:1,note:'Revisar prazo',quote:'prazo',anchor})).status).toBe(200)
 expect(mocks.rpc).toHaveBeenCalledWith('contract_map_comment_anchor',expect.objectContaining({p_anchor:anchor,p_quote:'prazo',p_parent:null}))
})
it('rejects invalid anchors and anchors attached to replies',async()=>{
 const anchor={start:-1,end:10,prefix:'',suffix:'',source:'published'}
 expect((await post({action:'comment',section:'contexto',version:1,note:'Revisar prazo',quote:'prazo',anchor})).status).toBe(400)
 expect((await post({action:'comment',section:'contexto',version:1,note:'Revisar prazo',quote:'prazo',anchor:{...anchor,start:1},parent:'00000000-0000-0000-0000-000000000001'})).status).toBe(400)
 expect(mocks.rpc).not.toHaveBeenCalled()
})

it('uses the same membership and review boundary for Playbook sections', async () => {
  expect((await post({ ...proposal, section: 'playbook-posicoes' })).status).toBe(200)
  expect(mocks.rpc).toHaveBeenCalledWith('contract_map_submit', expect.objectContaining({ p_section: 'playbook-posicoes' }))
  mocks.rpc.mockResolvedValue({ error: { message: 'LEAD_REQUIRED' } })
  expect((await post({ ...proposal, action: 'publish', section: 'playbook-posicoes' })).status).toBe(403)
})
