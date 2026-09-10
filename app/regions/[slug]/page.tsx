import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Linkedin, MapPin, MessageCircle, UsersRound } from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'
import { createAdminClient } from '@/lib/supabase-admin'
import { applyRegionalLeadership } from '@/app/bench/actions'

export const dynamic = 'force-dynamic'

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

type PageProps = {
  params: { slug: string }
  searchParams?: Record<string, string | string[] | undefined>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const admin = createAdminClient()
  const { data } = await admin.from('community_regions').select('name, description').eq('slug', params.slug).maybeSingle()
  return data
    ? { title: `${data.name} — regiões | legalops.club`, description: data.description || `Comunidade regional de Legal e Legal Ops em ${data.name}.` }
    : { title: 'regiões — legalops.club' }
}

export default async function RegionPage({ params, searchParams }: PageProps) {
  const admin = createAdminClient()
  const { data: region } = await admin
    .from('community_regions')
    .select('id, slug, name, region_type, macro_region, state_code, status, description, timezone, whatsapp_url, meeting_cadence')
    .eq('slug', params.slug)
    .eq('is_public', true)
    .neq('status', 'archived')
    .maybeSingle()
  if (!region) notFound()

  const [{ data: leaders }, { data: topics }] = await Promise.all([
    admin
      .from('community_regional_leaders')
      .select('id, display_name, title, organization, linkedin_url, role, responsibilities')
      .eq('region_id', region.id)
      .eq('status', 'active')
      .order('role'),
    admin
      .from('bench_topics')
      .select('id, slug, title, description, status, interest_count')
      .eq('region_id', region.id)
      .eq('is_public', true)
      .neq('status', 'archived')
      .order('created_at', { ascending: false }),
  ])

  const hasLeadership = Boolean(leaders?.length)
  const applied = searchParams?.applied === '1'

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <ClubHeader active="communities" />
      <main>
        <section className="border-b border-[#CEC8BD]">
          <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-16">
            <Link href="/regions" className="inline-flex items-center gap-2 text-xs font-bold text-[#716B65]"><ArrowLeft className="h-3.5 w-3.5" /> Todas as regiões</Link>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_330px] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">legalops.club / região</span><span className="rounded-full border border-[#CEC8BD] px-2.5 py-1 text-[9px] font-bold uppercase text-[#716B65]">{region.status === 'active' && hasLeadership ? 'ativa' : hasLeadership ? 'em organização' : 'liderança aberta'}</span></div>
                <h1 className="mt-5 text-[48px] font-semibold leading-none tracking-[-0.065em] sm:text-[72px]" style={roundedFont}>{region.name}<span className="text-[#E88A6A]">.</span></h1>
                <p className="mt-5 max-w-[700px] text-base leading-7 text-[#625E59]">{region.description || `Comunidade regional para profissionais de Legal e Legal Ops em ${region.name}. Conecte-se com pessoas da região, organize benchs e mantenha uma agenda local.`}</p>
                <div className="mt-7 flex flex-wrap gap-3"><a href="#lideranca" className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-5 py-3 text-sm font-bold text-white">{hasLeadership ? 'Ajudar a liderar' : 'Quero reativar esta regional'} <ArrowRight className="h-4 w-4" /></a><Link href="/bench" className="rounded-lg border border-[#BEB7AA] px-5 py-3 text-sm font-bold">Ver benchs</Link></div>
              </div>
              <div className="border-l-2 border-[#E88A6A] pl-5 text-sm leading-6 text-[#69635E]">{region.meeting_cadence ? <p><strong className="text-[#111111]">Cadência:</strong> {region.meeting_cadence}</p> : <p>A liderança define cadência e formatos conforme a demanda local.</p>}{region.whatsapp_url ? <a href={region.whatsapp_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-bold text-[#111111]"><MessageCircle className="h-4 w-4" /> Entrar no grupo local</a> : null}</div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#817A73]">liderança atual</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]" style={roundedFont}>{hasLeadership ? 'quem mantém a regional em movimento.' : 'esta regional está procurando pessoas.'}</h2>
            {!hasLeadership ? <p className="mt-4 max-w-md text-sm leading-6 text-[#69635E]">O objetivo é evitar que a comunidade pare quando uma única pessoa fica sem disponibilidade. A liderança pode ser compartilhada entre lead, co-leads e organizadores.</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(leaders ?? []).map(leader => (
              <article key={leader.id} className="border border-[#CEC8BD] bg-[#FAF7F1] p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{leader.display_name}</p><p className="mt-1 text-xs leading-5 text-[#77716A]">{[leader.title, leader.organization].filter(Boolean).join(' · ') || 'Liderança regional'}</p></div>{leader.linkedin_url ? <a href={leader.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4 text-[#817A73]" /></a> : null}</div>
                <span className="mt-4 inline-flex rounded-full bg-[#FFF0E9] px-2 py-1 text-[9px] font-bold uppercase text-[#A24D36]">{leader.role.replace('_', '-')}</span>
                {leader.responsibilities?.length ? <p className="mt-3 text-[10px] leading-4 text-[#817A73]">{leader.responsibilities.join(' · ')}</p> : null}
              </article>
            ))}
            {!leaders?.length ? <a href="#lideranca" className="sm:col-span-2 flex min-h-[150px] items-center justify-center border border-dashed border-[#C9684F] bg-[#FFF8F3] p-6 text-center text-sm font-bold text-[#A24D36]"><UsersRound className="mr-2 h-4 w-4" /> Quero ajudar a liderar {region.name}</a> : null}
          </div>
        </section>

        <section className="border-y border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
            <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">bench local</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]" style={roundedFont}>temas da região<span className="text-[#E88A6A]">.</span></h2></div>{hasLeadership ? <Link href="/login?next=/bench/manage" className="text-xs font-bold">Criar bench →</Link> : null}</div>
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(topics ?? []).map(topic => <Link key={topic.id} href={`/bench/${topic.slug}`} className="border border-[#CEC8BD] bg-white p-5 hover:border-[#E88A6A]"><span className="text-[9px] font-bold uppercase text-[#C9684F]">{topic.status}</span><h3 className="mt-4 text-lg font-bold tracking-[-0.03em]">{topic.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#77716A]">{topic.description}</p><p className="mt-4 text-[10px] font-bold text-[#716B65]">{topic.interest_count} interessados</p></Link>)}
              {!topics?.length ? <div className="md:col-span-2 lg:col-span-3 border border-dashed border-[#CEC8BD] p-7 text-sm text-[#817A73]">Ainda não há bench regional. A liderança local pode abrir o primeiro tema.</div> : null}
            </div>
          </div>
        </section>

        <section id="lideranca" className="bg-[#111111] text-white">
          <div className="mx-auto grid max-w-[1080px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[.75fr_1.25fr]">
            <div><MapPin className="h-5 w-5 text-[#E88A6A]" /><h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl" style={roundedFont}>liderar {region.name.toLowerCase()}.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-[#BEB7AA]">Escolha o nível de envolvimento. A proposta é distribuir trabalho e permitir sucessão, não criar um cargo vitalício.</p>{applied ? <p className="mt-5 border border-[#4A4742] bg-[#1D1C1A] px-4 py-3 text-sm font-bold text-[#E88A6A]">Candidatura recebida.</p> : null}</div>
            <form action={applyRegionalLeadership} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="region_id" value={region.id} />
              <input name="display_name" required minLength={2} maxLength={120} placeholder="Nome" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="email" type="email" required maxLength={254} placeholder="Email" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="title" maxLength={120} placeholder="Cargo / função" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="organization" maxLength={120} placeholder="Empresa / organização" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="linkedin_url" type="url" maxLength={300} placeholder="LinkedIn (opcional)" className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <select name="role" className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm text-[#D7D1C8]"><option value="co_lead">Co-lead · dividir liderança</option><option value="lead">Lead · puxar a regional</option><option value="organizer">Organizador · apoiar encontros e benchs</option></select>
              <textarea name="motivation" required minLength={10} maxLength={2000} rows={4} placeholder="Como você gostaria de ajudar a regional?" className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <button className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#E88A6A] px-5 py-3 text-sm font-bold text-[#111111]">Enviar candidatura <ArrowRight className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
