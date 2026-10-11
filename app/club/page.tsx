import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'
import { ClubHeader } from '@/components/ClubHeader'
import { LegalOpsEcosystem } from '@/components/LegalOpsEcosystem'
import { ResumeClubSession } from '@/components/community/ResumeClubSession'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isEventDatePending, upcomingCommunityEvents } from '@/lib/community-event-display'

export const metadata: Metadata = {
  title: 'legalops.club | comunidade para profissionais do jurídico',
  description: 'Converse com profissionais de Legal Ops, contratos e tecnologia jurídica. Participe de encontros e encontre referências para o seu trabalho.',
  openGraph: { title: 'legalops.club | comunidade para o trabalho jurídico', description: 'Troque experiências, conheça membros e participe dos encontros da comunidade.', url: 'https://legalops.club', siteName: 'legalops.club', type: 'website' },
}
export const dynamic = 'force-dynamic'
type PublicEvent = { id: string; slug: string; title: string; description: string; starts_at: string; ends_at: string | null; location_label: string | null }
async function loadEvents(): Promise<PublicEvent[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return []
  const db = await createServerSupabaseClient()
  const { data } = await db.from('community_events')
    .select('id,slug,title,description,starts_at,ends_at,location_label')
    .eq('is_published', true).order('starts_at', { ascending: false }).limit(50)
    .abortSignal(AbortSignal.timeout(1500))
  return upcomingCommunityEvents((data ?? []) as PublicEvent[]).slice(0, 3)
}
function SignupLink() {
  return <Link href="/cadastro" className="brand-action">Criar meu perfil gratuito <span aria-hidden="true">↗</span></Link>
}
function eventDate(event: PublicEvent) {
  return isEventDatePending(event) ? 'Data e formato a confirmar' : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.starts_at))
}
const principles = [
  ['01 / conversas', 'pergunte a quem faz', 'Leve uma dúvida para os fóruns de contratos, dados, processos ou tecnologia. Conte também o que funcionou no seu time.'],
  ['02 / pessoas', 'encontre seus pares', 'Conheça membros por atuação e experiência. Participe dos encontros para comparar como vocês trabalham.'],
  ['03 / referências', 'leve algo para usar', 'Consulte o playbook de contratos, a jornada de migração de CLM e os recursos que a comunidade desenvolve.'],
]
const faq = [
  ['Quem pode participar?', 'Profissionais, estudantes, consultores e quem desenvolve soluções para o jurídico podem participar com um perfil compatível.'],
  ['Como eu entro na comunidade?', 'Crie sua conta, confirme o email e complete seu perfil com foto, LinkedIn pessoal, atuação, contexto profissional, cidade e interesses.'],
  ['O que eu encontro na comunidade gratuita?', 'Você pode conversar nos fóruns, acessar encontros, conhecer membros e consultar recursos da comunidade.'],
  ['O que faz parte do Pro?', 'No Pro, você conversa com um agente pessoal com histórico privado, contexto salvo e consulta a publicações, vagas e referências. Estamos preparando a leitura automática do WhatsApp e um aplicativo próprio.'],
]
export default async function ClubLandingPage() {
  const events = await loadEvents()
  const featured = events[0]
  return <div className="brand-surface min-h-screen">
    <ResumeClubSession /><ClubHeader product="club" />
    <main>
      <section className="brand-container brand-hero">
        <div>
          <p className="brand-kicker">legalops.club / comunidade</p>
          <h1 className="brand-headline">troque com quem vive o trabalho jurídico<span className="text-[#E88A6A]">.</span></h1>
          <p className="brand-copy mt-6">Converse com profissionais de Legal Ops, contratos e tecnologia jurídica. Compartilhe experiências e encontre referências para o seu trabalho.</p>
          <div className="brand-actions"><SignupLink /><a href="#comunidade" className="brand-text-link">Conhecer a comunidade ↓</a></div>
          <p className="mt-5 text-xs leading-6 text-[#625E59]">Participe com seu LinkedIn e contexto profissional.</p>
        </div>
        <aside className="brand-card overflow-hidden" aria-label="Em pauta na comunidade">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CEC8BD] px-6 py-3 text-xs"><span>Em pauta no club</span><Link href="/community/calendar" className="text-[#A24D36]">encontros ↗</Link></div>
          <div className="p-6 sm:p-8">
            <p className="brand-kicker">{featured ? eventDate(featured) : 'troca entre pares'}</p>
            <h2 className="mt-4 font-[var(--font-quicksand)] text-2xl font-semibold leading-tight tracking-[-.04em]">{featured?.title ?? 'Como vocês trabalham no jurídico?'}</h2>
            <p className="mt-4 line-clamp-4 text-sm leading-7 text-[#625E59]">{featured?.description ?? 'Leve uma dúvida para os fóruns. Compare critérios, ferramentas e processos com quem também cuida da operação jurídica.'}</p>
            <div className="mt-6 border-t border-[#CEC8BD] pt-5"><p className="brand-kicker">para começar a conversa</p><p className="mt-3 text-sm leading-7">Conte o que você faz hoje, o que funcionou e onde precisa de outra perspectiva.</p></div>
            <Link className="brand-text-link mt-4" href={featured ? `/community/events/${featured.slug}` : '/community'}>{featured ? 'Conhecer o encontro' : 'Conhecer os fóruns'} →</Link>
          </div>
          {events[1] ? <Link className="flex flex-wrap items-center justify-between gap-3 bg-[#EDE5D8] px-6 py-4 text-xs" href={`/community/events/${events[1].slug}`}><span>{events[1].title}</span><span className="text-[#625E59]">{eventDate(events[1])}</span></Link> : null}
        </aside>
      </section>
      <LegalOpsEcosystem active="club" />
      <section id="comunidade" className="brand-container brand-section scroll-mt-24">
        <p className="brand-kicker">gente que conhece o seu trabalho</p><h2 className="brand-section-title mt-4 max-w-2xl">pergunte, compartilhe, encontre outras perspectivas<span className="text-[#E88A6A]">.</span></h2>
        <div className="brand-principles">{principles.map(([label, title, description]) => <article key={label}><p className="brand-kicker">{label}</p><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
      <section className="border-t border-[#CEC8BD]"><div className="brand-container brand-section">
        <p className="brand-kicker">encontros da comunidade</p><h2 className="brand-section-title mt-4 max-w-2xl">continue a conversa com quem também faz<span className="text-[#E88A6A]">.</span></h2>
        {events.length ? <div className="brand-event-list">{events.map(event => <article className="brand-event-row" key={event.id}>
          <div className="brand-date">{isEventDatePending(event) ? '?' : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit' }).format(new Date(event.starts_at))}<small>{isEventDatePending(event) ? 'em pauta' : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'long' }).format(new Date(event.starts_at))}</small></div>
          <div><h3>{event.title}</h3><p>{eventDate(event)}{!isEventDatePending(event) && event.location_label ? ` · ${event.location_label}` : ''}</p></div><Link className="brand-action secondary" href={`/community/events/${event.slug}`}>Ver encontro ↗</Link>
        </article>)}</div> : <p className="brand-copy mt-6">Acompanhe a agenda e as conversas dos encontros anteriores.</p>}
        <Link href="/community/calendar" className="brand-text-link mt-5">Explorar a agenda →</Link>
      </div></section>
      <section id="pro" className="brand-pro brand-section"><div className="brand-container brand-pro-grid">
        <div><p className="brand-kicker">club pro / agente pessoal</p><h2 className="brand-section-title mt-4">um agente para acompanhar seu contexto<span className="text-[#E88A6A]">.</span></h2><p className="mt-6 text-sm leading-7">Retome suas conversas, consulte publicações do Club e peça referências de vagas e contratos com o contexto que você compartilhar.</p><Link href="/club/checkout" className="brand-action mt-7">Conhecer o Pro ↗</Link></div>
        <div><ul>{['Converse com seu agente em um histórico privado.', 'Escolha assuntos e salve seu contexto profissional.', 'Consulte vagas do Work e referências do OpenCLM.', 'Faça até 30 perguntas por dia.'].map(feature => <li key={feature}>{feature}</li>)}</ul><p className="mt-5 text-xs leading-6">Estamos preparando a leitura automática do WhatsApp e um aplicativo próprio.</p></div>
      </div></section>
      <section className="brand-container brand-section brand-join"><div><p className="brand-kicker">comunidade gratuita</p><h2 className="brand-section-title mt-4">crie seu perfil.<br />entre na conversa<span className="text-[#E88A6A]">.</span></h2><p className="brand-copy mt-6">Se você trabalha, estuda ou desenvolve soluções para o jurídico, apresente seu contexto e escolha os assuntos que quer acompanhar.</p><div className="brand-actions"><SignupLink /></div></div><div className="brand-faq">{faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="brand-footer"><div className="brand-container brand-footer-inner"><BrandWordmark suffix="club" /><span>Para quem trabalha, estuda e desenvolve soluções para o jurídico.</span></div></footer>
  </div>
}
