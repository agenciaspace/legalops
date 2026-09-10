import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Linkedin, MapPin, MessageCircle, UsersRound } from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'
import { BrandWordmark } from '@/components/BrandLogo'
import { createAdminClient } from '@/lib/supabase-admin'
import { applyRegionalLeadership } from '@/app/bench/actions'

export const metadata: Metadata = {
  title: 'regiões — legalops.club',
  description: 'Comunidades regionais de Legal e Legal Ops: encontre sua região, participe e ajude a liderar encontros locais.',
}

export const dynamic = 'force-dynamic'

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

const macroOrder = ['Sudeste', 'Sul', 'Centro-Oeste', 'Nordeste', 'Norte']
const statusLabel: Record<string, string> = { active: 'ativa', forming: 'formando liderança', paused: 'precisa de liderança' }

export default async function RegionsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const admin = createAdminClient()
  const [{ data: rawRegions }, { data: rawLeaders }] = await Promise.all([
    admin
      .from('community_regions')
      .select('id, slug, name, region_type, macro_region, state_code, status, description, whatsapp_url, meeting_cadence')
      .eq('is_public', true)
      .neq('status', 'archived')
      .order('sort_order')
      .order('name'),
    admin
      .from('community_regional_leaders')
      .select('id, region_id, display_name, title, organization, linkedin_url, role')
      .eq('status', 'active')
      .order('role'),
  ])

  const regions = rawRegions ?? []
  const leaders = rawLeaders ?? []
  const leadersByRegion = new Map<string, typeof leaders>()
  leaders.forEach(leader => leadersByRegion.set(leader.region_id, [...(leadersByRegion.get(leader.region_id) ?? []), leader]))
  const appliedSlug = typeof searchParams?.applied === 'string' ? searchParams.applied : null
  const selectedRegion = appliedSlug ? regions.find(region => region.slug === appliedSlug) : null

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <ClubHeader active="communities" />
      <main>
        <section className="border-b border-[#CEC8BD]">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#C9684F]">legalops.club / regiões</p>
              <h1 className="mt-5 max-w-[790px] text-[44px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-[68px]" style={roundedFont}>
                comunidade local não deveria depender de uma pessoa só<span className="text-[#E88A6A]">.</span>
              </h1>
              <p className="mt-6 max-w-[720px] text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
                Cada região pode ter liderança compartilhada, responsáveis claros, canal local e uma agenda de encontros e benchs. Se um grupo estiver parado, novos líderes podem se candidatar e reativá-lo.
              </p>
            </div>
            <div className="border-l-2 border-[#E88A6A] pl-5">
              <p className="text-sm font-bold">Modelo distribuído</p>
              <p className="mt-2 text-sm leading-6 text-[#69635E]">Lead, co-leads e organizadores. A comunidade continua mesmo quando alguém muda de função ou deixa de ter disponibilidade.</p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1180px] sm:grid-cols-3">
            {[
              ['liderança compartilhada', 'Mais de uma pessoa pode manter a região ativa.'],
              ['agenda local', 'Benchs, encontros e conversas podem ser criados pela liderança regional.'],
              ['continuidade', 'Regiões sem liderança aparecem publicamente para receber novas candidaturas.'],
            ].map(([title, copy], index) => (
              <div key={title} className={`px-5 py-9 sm:px-8 ${index ? 'border-t border-[#E6DED0] sm:border-l sm:border-t-0' : ''}`}>
                <p className="text-base font-semibold tracking-[-0.03em]" style={roundedFont}>{title}<span className="text-[#E88A6A]">.</span></p>
                <p className="mt-2 text-sm leading-6 text-[#69635E]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col gap-4 border-b border-[#CEC8BD] pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">Brasil</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>encontre sua regional<span className="text-[#E88A6A]">.</span></h2></div>
            <Link href="/bench" className="inline-flex items-center gap-2 text-xs font-bold hover:text-[#C9684F]">Ver benchs <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          <div className="mt-10 space-y-12">
            {macroOrder.map(macro => {
              const items = regions.filter(region => region.macro_region === macro && region.region_type === 'state')
              if (!items.length) return null
              return (
                <section key={macro}>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#817A73]">{macro}</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.map(region => {
                      const regionLeaders = leadersByRegion.get(region.id) ?? []
                      const needsLeadership = region.status !== 'active' || regionLeaders.length === 0
                      return (
                        <article key={region.id} className="flex min-h-[235px] flex-col border border-[#CEC8BD] bg-[#FAF7F1] p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#C9684F]" /><h4 className="text-lg font-bold tracking-[-0.03em]">{region.name}</h4></div>
                            <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wide ${needsLeadership ? 'bg-[#FFF0E9] text-[#A24D36]' : 'bg-emerald-50 text-emerald-700'}`}>{needsLeadership ? 'liderança aberta' : statusLabel[region.status] || region.status}</span>
                          </div>
                          {region.description ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#69635E]">{region.description}</p> : <p className="mt-3 text-xs leading-5 text-[#817A73]">Regional disponível para conexão, benchs e encontros locais.</p>}
                          <div className="mt-4 space-y-2">
                            {regionLeaders.slice(0, 3).map(leader => (
                              <div key={leader.id} className="flex items-center justify-between gap-2 border-t border-[#E6DED0] pt-2">
                                <div className="min-w-0"><p className="truncate text-xs font-bold">{leader.display_name}</p><p className="truncate text-[10px] text-[#817A73]">{[leader.title, leader.organization].filter(Boolean).join(' · ') || 'Liderança regional'}</p></div>
                                {leader.linkedin_url ? <a href={leader.linkedin_url} target="_blank" rel="noreferrer" aria-label={`LinkedIn de ${leader.display_name}`}><Linkedin className="h-3.5 w-3.5 text-[#817A73] hover:text-[#111111]" /></a> : null}
                              </div>
                            ))}
                          </div>
                          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[#E6DED0] pt-4">
                            {region.whatsapp_url ? <a href={region.whatsapp_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold"><MessageCircle className="h-3.5 w-3.5" /> Grupo local</a> : null}
                            <a href="#liderar" className="ml-auto text-xs font-bold text-[#C9684F]">{needsLeadership ? 'Quero liderar' : 'Ser co-líder'} →</a>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </section>

        <section id="liderar" className="border-t border-[#CEC8BD] bg-[#111111] text-white">
          <div className="mx-auto grid max-w-[1080px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[.75fr_1.25fr]">
            <div>
              <UsersRound className="h-5 w-5 text-[#E88A6A]" />
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl" style={roundedFont}>ajude a liderar sua região.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#BEB7AA]">Não precisa assumir tudo. Você pode entrar como lead, co-lead ou organizador e dividir a operação com outras pessoas.</p>
              {selectedRegion ? <p className="mt-5 rounded-lg border border-[#4A4742] bg-[#1D1C1A] px-4 py-3 text-sm font-bold text-[#E88A6A]">Candidatura para {selectedRegion.name} recebida.</p> : null}
            </div>
            <form action={applyRegionalLeadership} className="grid gap-3 sm:grid-cols-2">
              <select name="region_id" required className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm text-[#D7D1C8] outline-none focus:border-[#E88A6A]">
                <option value="">Escolha a região</option>
                {regions.filter(region => region.region_type === 'state').map(region => <option key={region.id} value={region.id}>{region.name} · {statusLabel[region.status] || region.status}</option>)}
              </select>
              <input name="display_name" required minLength={2} maxLength={120} placeholder="Nome" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="email" type="email" required maxLength={254} placeholder="Email" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="title" maxLength={120} placeholder="Cargo / função" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="organization" maxLength={120} placeholder="Empresa / organização" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="linkedin_url" type="url" maxLength={300} placeholder="LinkedIn (opcional)" className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <select name="role" className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm text-[#D7D1C8] outline-none focus:border-[#E88A6A]"><option value="co_lead">Co-lead · dividir a liderança</option><option value="lead">Lead · puxar a regional</option><option value="organizer">Organizador · apoiar encontros e benchs</option></select>
              <textarea name="motivation" required minLength={10} maxLength={2000} rows={4} placeholder="Como você gostaria de ajudar a regional?" className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <button className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#E88A6A] px-5 py-3 text-sm font-bold text-[#111111] hover:bg-[#F09A7D]">Enviar candidatura <ArrowRight className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#CEC8BD] bg-[#FAF7F1] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[1180px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><BrandWordmark suffix="club" className="inline-flex items-baseline text-[23px] font-semibold leading-none tracking-[-0.055em] text-[#111111]" /><div className="flex flex-wrap gap-5 text-xs font-semibold text-[#716B65]"><Link href="/bench">bench</Link><Link href="/club">comunidade</Link><Link href="/login?next=/regions/manage">gerir região</Link></div></div></footer>
    </div>
  )
}
