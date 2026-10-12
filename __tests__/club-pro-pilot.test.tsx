import {cleanup,render,screen} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const state=vi.hoisted(()=>({user:null as any,member:null as any,offer:{active:true,price_cents:4900,period_months:1,payment_mode:'mercadopago_subscription',payment_url:'https://mpago.la/2gCAVGU',trial_days:7},orders:[] as any[],subscription:null as any}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})},from:(table:string)=>{const data=()=>table==='club_pro_offer'?state.offer:table==='community_members'?state.member:table==='club_pro_subscriptions'?state.subscription:state.orders;const q:any={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>({data:data()}),then:(resolve:any)=>resolve({data:data()})};return q}})}))
vi.mock('@/app/club/checkout/actions',()=>({createProOrder:vi.fn(),submitProReceipt:vi.fn()}))
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}))
import Checkout from '@/app/club/checkout/page'
import {isProOfferOpen,proPaymentUrl} from '@/lib/club-pro'
afterEach(cleanup)
beforeEach(()=>{state.user=null;state.member=null;state.orders=[];state.subscription=null})
it('states monthly recurrence, trial, credits and cancellation before signup',async()=>{
 render(await Checkout({}))
 expect(screen.getByRole('heading',{name:/R\$\s*49/})).toBeInTheDocument()
 expect(screen.getByText(/7 dias de teste grátis/)).toBeInTheDocument()
 expect(screen.getByText(/O Mercado Pago faz as cobranças mensais/)).toBeInTheDocument()
 expect(screen.getByText(/300 créditos por mês calendário/)).toBeInTheDocument()
 expect(screen.getByRole('link',{name:'Criar minha conta e continuar'})).toHaveAttribute('href','/cadastro?next=/club/checkout')
})
it('uses the stored payment link after creating an owned order',async()=>{
 state.user={id:'owner'};state.member={club_access_status:'active'}
 state.orders=[{id:'order',status:'pending',price_cents:4900,period_months:1,payment_mode:'mercadopago_subscription',payment_url:'https://mpago.la/2gCAVGU',trial_days:7}]
 render(await Checkout({}))
 expect(screen.getByRole('link',{name:/Abrir assinatura no Mercado Pago/})).toHaveAttribute('href','https://mpago.la/2gCAVGU')
 expect(screen.getByLabelText('Confirmação da assinatura ou comprovante')).toHaveAttribute('type','file')
 expect(screen.queryByText('Chave PIX · email')).not.toBeInTheDocument()
})
it('does not prompt an existing subscriber to create another subscription',async()=>{
 state.user={id:'owner'};state.member={club_access_status:'active',club_pro_status:'active',club_pro_expires_at:'2099-01-01'}
 state.subscription={state:'active',next_charge_at:'2099-01-01'}
 render(await Checkout({}))
 expect(screen.getByText(/Você já cadastrou uma assinatura/)).toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'Continuar com o Mercado Pago'})).not.toBeInTheDocument()
 expect(screen.getByRole('link',{name:/Começar minha primeira tarefa/})).toHaveAttribute('href','/community/pro')
})
it('rejects unsafe links and incomplete recurring offers',()=>{
 for(const payment_url of ['javascript:alert(1)','https://mpago.la.evil.example/plan','https://mpago.la@evil.example/plan','https://mpago.la/plan?redirect=other']){
  expect(proPaymentUrl({payment_mode:'mercadopago_subscription',payment_url})).toBeNull()
  expect(isProOfferOpen({...state.offer,payment_url})).toBe(false)
 }
 expect(isProOfferOpen({...state.offer,period_months:12})).toBe(false)
 expect(isProOfferOpen({...state.offer,trial_days:0})).toBe(false)
})
