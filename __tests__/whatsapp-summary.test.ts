import { describe, expect, it, vi, beforeEach } from 'vitest'
import { latestSummarySlot, validateWhatsAppInput, parseWhatsAppDigest, whatsAppDigestPrompt } from '@/lib/whatsapp-summary'
import { summaryAvailability } from '@/components/community/WhatsAppSummaries'
vi.mock('@/lib/supabase-admin',()=>({createAdminClient:vi.fn()}))
vi.mock('@/lib/openrouter',()=>({generateOpenRouterText:vi.fn(),getOpenRouterModel:()=> 'test'}))
import { POST } from '@/app/api/cron/whatsapp-summary/route'
import { createAdminClient } from '@/lib/supabase-admin'
const now=new Date('2026-09-18T21:01:00Z')
const payload={source:'legalops-community',action:'publish',period_start:'2026-09-17T21:00:00Z',period_end:'2026-09-18T21:00:00Z',omitted_media_count:0,messages:[{id:'1',at:'2026-09-18T20:00:00Z',author:'Participante 1',text:'Podemos discutir contratos amanhã.'}]}
describe('community WhatsApp summary',()=>{
 beforeEach(()=>{vi.clearAllMocks();delete process.env.WHATSAPP_SUMMARY_INGEST_SECRET})
 it('requires a configured secret before accessing storage',async()=>{
  for(const secret of [undefined,'expected']){
   if(secret)process.env.WHATSAPP_SUMMARY_INGEST_SECRET=secret
   for(const authorization of ['', 'Bearer wrong']) expect((await POST(new Request('https://test/api/cron/whatsapp-summary',{method:'POST',headers:{authorization},body:JSON.stringify(payload)}))).status).toBe(401)
  }
  expect(createAdminClient).not.toHaveBeenCalled()
 })
 it('uses fixed daily 18h Brasília windows',()=>{
  expect(latestSummarySlot(new Date('2026-09-18T20:59:59Z')).toISOString()).toBe('2026-09-17T21:00:00.000Z')
  expect(latestSummarySlot(now).toISOString()).toBe('2026-09-18T21:00:00.000Z')
  expect(validateWhatsAppInput(payload,now)).not.toBeNull()
 })
 it('rejects other sources, duplicate messages and out-of-window messages',()=>{
  expect(validateWhatsAppInput({...payload,source:'other'},now)).toBeNull()
  expect(validateWhatsAppInput({...payload,messages:[...payload.messages,...payload.messages]},now)).toBeNull()
  expect(validateWhatsAppInput({...payload,messages:[{...payload.messages[0],at:payload.period_end}]},now)).toBeNull()
  expect(validateWhatsAppInput({...payload,period_start:'2026-09-16T21:00:00Z'},now)).toBeNull()
 })
 it('does not allow publishing an arbitrary rolling window',()=>{
  const rolling={...payload,period_start:'2026-09-17T21:01:00Z',period_end:'2026-09-18T21:01:00Z'}
  expect(validateWhatsAppInput(rolling,now)).toBeNull()
  expect(validateWhatsAppInput({...rolling,action:'preview'},now)).not.toBeNull()
 })
 it('requires a structured, specific digest or an explicit skip',()=>{
  expect(parseWhatsAppDigest('not JSON')).toBeNull()
  expect(parseWhatsAppDigest(JSON.stringify({publish:false}))).toEqual({publish:false})
  expect(parseWhatsAppDigest(JSON.stringify({publish:true,title:'Tema',summary:'Síntese da conversa.',highlights:Array(6).fill({type:'context',owner:null,text:'Ponto concreto'})}))).toBeNull()
  expect(parseWhatsAppDigest('```json\n{"publish":true,"title":"Acesso ao playbook após o cadastro","summary":"Bea encontrou o playbook apenas depois de explorar os menus.","highlights":[{"type":"feedback","owner":"Bea","text":"O evento do Nubank domina a tela após o login e dificulta encontrar o playbook."},{"type":"next_step","owner":"Leon","text":"Tornar playbooks e ferramentas mais visíveis no pós-login."}]}\n```')).toEqual({
    publish:true,
    title:'Acesso ao playbook após o cadastro',
    summary:'Bea encontrou o playbook apenas depois de explorar os menus.',
    key_points:[
      'Feedback — Bea: O evento do Nubank domina a tela após o login e dificulta encontrar o playbook.',
      'Próximo passo — Leon: Tornar playbooks e ferramentas mais visíveis no pós-login.',
    ],
  })
 })
 it('asks for names, concrete details and silence on low-signal chatter',()=>{
  const prompt=whatsAppDigestPrompt([{id:'1',at:'2026-09-18T20:00:00Z',author:'Bea',text:'Depois do login só aparece o evento do Nubank.'}])
  expect(prompt).toContain('Bea')
  expect(prompt).toContain('nomes fornecidos')
  expect(prompt).toContain('publish":false')
  expect(prompt).toContain('elogios genéricos')
 })
 it('shows the actual first slot and a pending state when overdue',()=>{
  const schedule={enabled:true,first_run_at:payload.period_end,next_run_at:payload.period_end,last_status:'scheduled' as const,last_period_end:null,last_checked_at:null}
  expect(summaryAvailability(schedule,new Date('2026-09-18T20:00:00Z').getTime())).toContain('18/09/2026, 18:00')
  expect(summaryAvailability(schedule,now.getTime())).toContain('em preparação')
  expect(summaryAvailability({...schedule,last_status:'error'},now.getTime())).toContain('atrasado')
  expect(summaryAvailability({...schedule,enabled:false},now.getTime())).toBe('Programação em preparação.')
 })
})
