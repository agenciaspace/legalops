import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'
import { ProPilotTerms } from '@/components/community/ProPilotTerms'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isProOfferOpen, proPrice, proPaymentUrl, PRO_SUPPORT_EMAIL } from '@/lib/club-pro'
import { hasActiveClubAccess } from '@/lib/community'
import { hasClubProAccess } from '@/lib/club-membership'
import { createProOrder } from './actions'
import { ReceiptForm } from './ReceiptForm'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Assinar Club Pro | legalops.club' }
export default async function ProCheckout({ searchParams }: { searchParams?: {error?:string} }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{data:offer},{data:member},{data:orders},{data:subscription}] = await Promise.all([
    supabase.from('club_pro_offer').select('price_cents,period_months,active,payment_mode,payment_url,trial_days').eq('id',true).maybeSingle(),
    user ? supabase.from('community_members').select('club_access_status,club_access_expires_at,club_pro_status,club_pro_expires_at').eq('user_id',user.id).maybeSingle() : Promise.resolve({data:null}),
    user ? supabase.from('club_pro_orders').select('id,price_cents,period_months,status,review_note,created_at,payment_mode,payment_url,trial_days').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5) : Promise.resolve({data:null}),
    user ? supabase.from('club_pro_subscriptions').select('state,next_charge_at').eq('user_id',user.id).maybeSingle() : Promise.resolve({data:null}),
  ])
  const pending = orders?.find(order=>['pending','submitted'].includes(order.status))
  const active = hasActiveClubAccess(member) && hasClubProAccess(member)
  const recurring = offer?.payment_mode === 'mercadopago_subscription'
  const date = (value:string) => new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'long',timeStyle:'short'})
  return <main className="min-h-screen bg-[#F5F1E8] px-4 py-8 text-[#111111] sm:px-5 sm:py-10"><div className="mx-auto max-w-3xl">
    <Link href="/club"><BrandWordmark suffix="club" className="text-3xl" /></Link>
    <p className="mt-10 text-xs font-bold uppercase tracking-widest text-[#A24D36]">Club Pro</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Prepare seu próximo passo em Legal Ops.</h1>
    <p className="mt-4 text-sm leading-7 text-[#69635E]">Use seu contexto profissional para consultar oportunidades, preparar candidaturas e praticar entrevistas. Retome suas conversas com um agente privado e confira as fontes das respostas.</p>
    <section className="mt-7 rounded-xl border border-[#CEC8BD] bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold">O que você pode fazer</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-[#69635E]"><li>Consultar vagas do Work e escolher uma oportunidade para seu perfil.</li><li>Preparar uma carta ou currículo personalizado nos recursos de carreira.</li><li>Praticar respostas para uma entrevista e revisar os próximos passos com seu agente.</li></ol><p className="mt-4 text-xs leading-6 text-[#69635E]">Seu agente consulta publicações do site, vagas e referências disponíveis. Estamos preparando a leitura automática do WhatsApp.</p></section>
    <section className="mt-6 rounded-xl border border-[#CEC8BD] bg-white p-5 sm:p-6">
      {isProOfferOpen(offer) ? <><h2 className="text-3xl font-semibold">{proPrice(offer.price_cents)} <span className="text-base font-normal text-[#69635E]">por {offer.period_months===12?'12 meses':'mês'}</span></h2><p className="mt-3 text-sm leading-7 text-[#69635E]">{recurring ? `${offer.trial_days} dias de teste grátis. O Mercado Pago faz as cobranças mensais após o teste, até você cancelar a assinatura. A administração confere sua assinatura e as cobranças para liberar cada período de acesso.` : 'Você paga por PIX, com renovação manual. A administração confere o pagamento antes de liberar o acesso e preserva seu período restante na renovação.'}</p></> : <h2 className="text-lg font-semibold">Estamos preparando as novas assinaturas.</h2>}
      {searchParams?.error && <p role="alert" className="mt-4 text-sm text-red-700">Não conseguimos abrir o pedido. Atualize a página ou fale com a administração.</p>}
      <div className="mt-6">{!user ? <div className="space-y-4"><Link href="/cadastro?next=/club/checkout" className="block rounded-lg bg-[#111] px-5 py-3 text-center font-semibold text-white">Criar minha conta e continuar</Link><Link href="/login?next=/club/checkout" className="block text-center text-sm underline">Já tenho conta</Link></div> : !hasActiveClubAccess(member) ? <Link href="/club/entrar?next=/club/checkout" className="font-semibold underline">Complete seu perfil para contratar o Pro →</Link> : pending?.status==='submitted' ? <div role="status"><h3 className="font-semibold">Recebemos sua confirmação</h3><p className="mt-2 text-sm leading-7">A administração vai conferir seu pedido de {proPrice(pending.price_cents)} e avisar você por email em até um dia útil. Acompanhe a liberação nesta página.</p></div> : pending ? <><h3 className="mb-4 font-semibold">Pedido {pending.id.slice(0,8)} · {proPrice(pending.price_cents)}</h3><ReceiptForm orderId={pending.id} paymentUrl={proPaymentUrl(pending)} /></> : subscription && subscription.state !== 'canceled' ? <div className="space-y-3 text-sm leading-7"><p>Você já cadastrou uma assinatura no Mercado Pago. A administração confere cada cobrança para atualizar seu acesso.</p><p>Próxima cobrança prevista: {date(subscription.next_charge_at)}.</p><a href="https://www.mercadopago.com.br" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">Abrir minha conta no Mercado Pago ↗</a></div> : isProOfferOpen(offer) ? <><form action={createProOrder}><button className="min-h-12 w-full rounded-lg bg-[#111] px-5 py-3 font-semibold text-white">{recurring ? 'Continuar com o Mercado Pago' : active?'Renovar meu Pro por PIX':'Contratar Pro por PIX'}</button></form><p className="mt-3 text-xs leading-6 text-[#69635E]">Ao continuar, você confirma o preço, as condições de cobrança e a conferência descritos nesta página.</p></> : null}</div>
      {active && <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm leading-7">Você tem acesso ao Pro{member?.club_pro_expires_at ? ` até ${date(member.club_pro_expires_at)}`:''}. <Link href="/community/pro" className="font-semibold underline">Começar minha primeira tarefa →</Link></p>}
      {orders?.filter(order=>order.status==='rejected').slice(0,1).map(order=><p key={order.id} className="mt-4 text-sm text-red-700">A administração não aprovou o pedido anterior: {order.review_note ?? 'Fale com a administração para conferir o pedido.'}</p>)}
    </section>
    <ProPilotTerms recurring={recurring} />
    <p className="mt-6 text-xs leading-6 text-[#69635E]">Peça uma demonstração de dez minutos ou ajuda para sua primeira tarefa: <a className="break-all underline" href={`mailto:${PRO_SUPPORT_EMAIL}?subject=Demonstração%20Club%20Pro`}>{PRO_SUPPORT_EMAIL}</a>.</p>
  </div></main>
}
