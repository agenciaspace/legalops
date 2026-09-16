import { describe, expect, it } from 'vitest'
import { isProOfferOpen, receiptFileType, PRO_PIX_KEY } from '@/lib/club-pro'
import { personalAgentPrompt, rankAgentSources, OPENCLM_AGENT_SOURCE } from '@/lib/club-personal-agent'
describe('Pro sale and assistant boundaries',()=>{
  it('does not sell without an explicitly configured price and period',()=>{
    expect(isProOfferOpen({active:false,price_cents:null,period_months:null})).toBe(false)
    expect(isProOfferOpen({active:true,price_cents:null,period_months:12})).toBe(false)
    expect(isProOfferOpen({active:true,price_cents:9900,period_months:0})).toBe(false)
    expect(isProOfferOpen({active:true,price_cents:9900,period_months:1})).toBe(true)
    expect(PRO_PIX_KEY).toBe('leonhatori@gmail.com')
  })
  it('checks file contents instead of trusting the uploaded filename',()=>{
    expect(receiptFileType(new TextEncoder().encode('<script>fake receipt</script>'))).toBeNull()
    expect(receiptFileType(new TextEncoder().encode('%PDF-1.4\n'))?.contentType).toBe('application/pdf')
    expect(receiptFileType(new Uint8Array([137,80,78,71,13,10,26,10]))?.extension).toBe('png')
  })
  it('retrieves actual Dev documentation for OpenCLM questions',()=>{
    const sources=[{kind:'club' as const,title:'Encontro',url:'https://legalops.club/community',content:'Discussão sobre carreira'},OPENCLM_AGENT_SOURCE]
    expect(rankAgentSources(sources,'Como instalar OpenCLM?')[0].kind).toBe('dev')
  })
  it('passes member context and recent history without promising WhatsApp access',()=>{
    const prompt=personalAgentPrompt({profile:{current_role:'Legal Ops'},focus:'Implantar CLM',topics:['contratos-clm'],history:[],sources:[OPENCLM_AGENT_SOURCE],question:'Como começar?'})
    expect(prompt.userPrompt).toContain('Implantar CLM')
    expect(prompt.userPrompt).toContain('https://legalops.dev/openclm')
    expect(prompt.systemPrompt).toContain('não tem acesso ao WhatsApp')
  })
})
