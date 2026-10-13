import Link from 'next/link'
import { ArrowRight, Bot, BriefcaseBusiness, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasClubProAccess } from '@/lib/club-membership'
import { isProOfferOpen, proPrice, PRO_SUPPORT_EMAIL } from '@/lib/club-pro'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pro | legalops.club' }
const resources = [
  {href:'/community/credits',title:'Créditos do Pro',description:'Consulte saldo, custo por ação, extrato e créditos extras.',icon:Sparkles},
  {href:'/community/assistant',title:'Meu agente',description:`Converse com contexto e histórico privado. Créditos compartilhados com os outros recursos Pro.`,icon:Bot},
  {href:'/community/summaries',title:'Resumos da comunidade',description:'Retome os assuntos discutidos a partir das publicações e comentários disponíveis.',icon:Sparkles},
  {href:'/community/jobs',title:'Oportunidades para seu perfil',description:'Acompanhe vagas relacionadas ao seu contexto profissional.',icon:BriefcaseBusiness},
]
export default async function ProPage() {
  const supabase = await createServerSupabaseClient()
  const {data:{user}} = await supabase.auth.getUser()
  const [{data:member},{data:offer}] = await Promise.all([
    supabase.from('community_members').select('club_pro_status,club_pro_expires_at').eq('user_id',user?.id ?? '').maybeSingle(),
    supabase.from('club_pro_offer').select('price_cents,period_months,active').eq('id',true).maybeSingle(),
  ])
  const active = hasClubProAccess(member)
  return <div className="brand-page">
    <header className="brand-page-heading">
      <div>
        <p className="brand-kicker">Club / Pro</p>
        <h1>Assistência para o seu trabalho.</h1>
        <p className="max-w-2xl">Consulte oportunidades, prepare candidaturas e pratique entrevistas com seu contexto profissional.</p>
      </div>
    </header>
    <p className="mb-6 text-sm text-[var(--lo-muted)]">
      {active ? 'Seu Pro está ativo' : isProOfferOpen(offer) ? `${proPrice(offer.price_cents)} por mês` : 'Novas assinaturas em preparação'}
    </p>
    {active && <section className="brand-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Sua primeira tarefa</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7">
        <li><Link className="underline" href="/community/profile">Revise seu perfil e contexto profissional.</Link></li>
        <li><Link className="underline" href="/community/jobs">Escolha uma oportunidade relacionada ao seu perfil.</Link></li>
        <li><Link className="underline" href="/community/assistant">Converse com seu agente sobre a vaga e prepare os próximos passos.</Link></li>
      </ol>
      <p className="mt-4 text-sm leading-7">Você pode pedir ajuda de até 20 minutos: <a className="break-all underline" href={`mailto:${PRO_SUPPORT_EMAIL}?subject=Primeira%20tarefa%20Club%20Pro`}>{PRO_SUPPORT_EMAIL}</a>.</p>
    </section>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {resources.map(item => <section key={item.href} className="brand-card p-5 sm:p-6">
        <item.icon aria-hidden="true" className="h-6 w-6 text-[var(--lo-accent)]" />
        <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--lo-muted)]">{item.description}</p>
        {active ? <Link href={item.href} className="brand-text-link mt-4" aria-label={`Abrir ${item.title}`}>
          Abrir <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link> : null}
      </section>)}
    </div>
    <Link href="/club/checkout" className="brand-action mt-6">
      {active ? 'Gerenciar meu Pro' : isProOfferOpen(offer) ? 'Ver condições e contratar' : 'Consultar disponibilidade'}
    </Link>
  </div>
}
