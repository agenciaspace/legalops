import Link from 'next/link'
import { ArrowRight, Bot, BriefcaseBusiness, MessagesSquare, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasClubProAccess } from '@/lib/club-membership'
import { isProOfferOpen, PRO_DAILY_QUESTIONS } from '@/lib/club-pro'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pro | legalops.club' }
const resources = [
  {href:'/community/assistant',title:'Meu agente',description:`Converse com contexto e histórico privado. Até ${PRO_DAILY_QUESTIONS} perguntas por dia.`,icon:Bot},
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
  return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-9"><header><p className="text-xs font-semibold uppercase tracking-widest text-[#A94E38]">Club / Pro</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Assistência para o seu trabalho.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#625E59]">Seu agente pessoal, referências e acompanhamento em um só lugar.</p><p className="mt-4 inline-flex rounded-full bg-white px-3 py-2 text-sm font-medium">{active ? 'Seu Pro está ativo' : isProOfferOpen(offer) ? 'Conheça os recursos e condições do Pro' : 'Novas assinaturas em preparação'}</p></header><div className="mt-6 grid gap-4 sm:grid-cols-2">{resources.map(item => <section key={item.href} className="rounded-2xl border border-[#CEC8BD] bg-white p-5"><item.icon className="h-6 w-6 text-[#A94E38]" /><h2 className="mt-4 text-xl font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-7 text-[#625E59]">{item.description}</p>{active ? <Link href={item.href} className="mt-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold underline">Abrir <ArrowRight className="h-4 w-4" /></Link> : null}</section>)}</div><Link href="/club/checkout" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#24231F] px-5 py-3 text-sm font-semibold text-white">{active ? 'Gerenciar meu Pro' : isProOfferOpen(offer) ? 'Ver condições e contratar' : 'Consultar disponibilidade'}</Link></div>
}
