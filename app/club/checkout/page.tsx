import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isProOfferOpen, proPrice, PRO_DAILY_QUESTIONS, PRO_PIX_KEY } from '@/lib/club-pro'
import { hasActiveClubAccess } from '@/lib/community'
import { hasClubProAccess } from '@/lib/club-membership'
import { createProOrder } from './actions'
import { ReceiptForm } from './ReceiptForm'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Assinar Club Pro | legalops.club' }
export default async function ProCheckout({ searchParams }: { searchParams?: {error?:string} }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{data:offer},{data:member},{data:orders}] = await Promise.all([
    supabase.from('club_pro_offer').select('price_cents,period_months,active').eq('id',true).maybeSingle(),
    user ? supabase.from('community_members').select('club_access_status,club_access_expires_at,club_pro_status,club_pro_expires_at').eq('user_id',user.id).maybeSingle() : Promise.resolve({data:null}),
    user ? supabase.from('club_pro_orders').select('id,price_cents,period_months,status,review_note,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5) : Promise.resolve({data:null}),
  ])
  const pending = orders?.find(order=>['pending','submitted'].includes(order.status))
  const active = hasActiveClubAccess(member) && hasClubProAccess(member)
  return <main className="min-h-screen bg-[#F5F1E8] px-5 py-10 text-[#111111]"><div className="mx-auto max-w-3xl">
    <Link href="/club"><BrandWordmark suffix="club" className="text-3xl" /></Link>
    <p className="mt-10 text-xs font-bold uppercase tracking-widest text-[#A24D36]">Club Pro</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Seu agente. Seu contexto.</h1>
    <p className="mt-4 text-sm leading-7 text-[#69635E]">Converse com um agente privado, mantenha o histórico e consulte discussões do Club, vagas do Work e referências do OpenCLM no Dev.</p>
    <section className="mt-7 rounded-xl border border-[#CEC8BD] bg-white p-6"><h2 className="text-xl font-semibold">O que está incluído</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-[#69635E]"><li>Agente com histórico e preferências salvas; até {PRO_DAILY_QUESTIONS} perguntas por dia.</li><li>Respostas com links para as fontes consultadas no site, no Work e no Dev.</li><li>Agentes por assunto, resumos do Club e recursos de carreira já disponíveis.</li></ul><p className="mt-4 text-xs leading-6 text-[#69635E]">A primeira versão consulta conteúdo publicado no site. Leitura automática do WhatsApp ainda não faz parte da entrega.</p></section>
    <section className="mt-6 rounded-xl border border-[#CEC8BD] bg-white p-6">
      {isProOfferOpen(offer) ? <><h2 className="text-3xl font-semibold">{proPrice(offer.price_cents)} <span className="text-base font-normal text-[#69635E]">por {offer.period_months===12?'12 meses':'1 mês'}</span></h2><p className="mt-3 text-sm leading-6 text-[#69635E]">Pagamento único por PIX. Sem renovação automática. O período começa após a conferência manual do pagamento; numa renovação, soma-se ao período restante.</p></> : <h2 className="text-lg font-semibold">As vendas serão abertas em breve.</h2>}
      {searchParams?.error && <p role="alert" className="mt-4 text-sm text-red-700">Não conseguimos abrir o pedido. Atualize a página ou fale com a administração.</p>}
      <div className="mt-6">{!user ? <div className="space-y-4"><Link href="/cadastro?next=/club/checkout" className="block rounded-lg bg-[#111] px-5 py-3 text-center font-semibold text-white">Criar minha conta e continuar</Link><Link href="/login?next=/club/checkout" className="block text-center text-sm underline">Já tenho conta</Link></div> : !hasActiveClubAccess(member) ? <Link href="/club/entrar?next=/club/checkout" className="font-semibold underline">Complete seu perfil para contratar o Pro →</Link> : pending?.status==='submitted' ? <div role="status"><h3 className="font-semibold">Comprovante recebido</h3><p className="mt-2 text-sm leading-6">Seu pedido de {proPrice(pending.price_cents)} está em conferência. A ativação aparecerá nesta página. Não é preciso pagar novamente.</p></div> : pending ? <><h3 className="mb-4 font-semibold">Pedido {pending.id.slice(0,8)} · {proPrice(pending.price_cents)}</h3><ReceiptForm orderId={pending.id} /></> : isProOfferOpen(offer) ? <><form action={createProOrder}><button className="w-full rounded-lg bg-[#111] px-5 py-3 font-semibold text-white">{active?'Renovar meu Pro por PIX':'Contratar Pro por PIX'}</button></form><p className="mt-3 text-xs leading-5 text-[#69635E]">Ao abrir o pedido, você confirma o preço, o período e a conferência manual descritos acima.</p></> : null}</div>
      {active && <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm">Seu Pro está ativo{member?.club_pro_expires_at ? ` até ${new Date(member.club_pro_expires_at).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}`:''}. <Link href="/community/assistant" className="font-semibold underline">Abrir meu agente →</Link></p>}
      {orders?.filter(order=>order.status==='rejected').slice(0,1).map(order=><p key={order.id} className="mt-4 text-sm text-red-700">Pedido anterior não aprovado: {order.review_note ?? 'Fale com a administração antes de fazer outro pagamento.'}</p>)}
    </section><p className="mt-6 text-xs leading-6 text-[#69635E]">Dúvidas sobre pagamento, cancelamento ou reembolso: <a className="underline" href={`mailto:${PRO_PIX_KEY}`}>{PRO_PIX_KEY}</a>. O término do Pro preserva seu acesso à comunidade.</p>
  </div></main>
}
