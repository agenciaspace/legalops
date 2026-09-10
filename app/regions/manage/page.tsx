import Link from 'next/link'
import { ArrowLeft, Check, MapPin, Plus, UsersRound, X } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { createCommunityRegion, reviewLeadershipApplication, updateCommunityRegion } from '@/app/bench/actions'
import { requireCommunityManager } from '@/lib/legalops-admin'

export const dynamic = 'force-dynamic'

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

export default async function RegionsManagePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const manager = await requireCommunityManager('/regions/manage')
  const regionIds = manager.isAdmin ? null : Array.from(manager.managedRegionIds)

  let regionsQuery = manager.admin
    .from('community_regions')
    .select('id, slug, name, region_type, macro_region, state_code, status, description, timezone, whatsapp_url, meeting_cadence')
    .order('name')
  if (regionIds) regionsQuery = regionsQuery.in('id', regionIds.length ? regionIds : ['00000000-0000-0000-0000-000000000000'])

  const { data: regions } = await regionsQuery
  const managedIds = (regions ?? []).map(region => region.id)
  const { data: activeLeaders } = managedIds.length
    ? await manager.admin
        .from('community_regional_leaders')
        .select('id, region_id, display_name, email, title, organization, role, status, approved_at')
        .in('region_id', managedIds)
        .eq('status', 'active')
        .order('role')
    : { data: [] }

  const { data: pending } = manager.isAdmin
    ? await manager.admin
        .from('community_regional_leaders')
        .select('id, region_id, display_name, email, title, organization, linkedin_url, role, motivation, status, created_at')
        .eq('status', 'pending')
        .order('created_at')
    : { data: [] }

  const regionById = new Map((regions ?? []).map(region => [region.id, region]))
  const leadersByRegion = new Map<string, NonNullable<typeof activeLeaders>>()
  ;(activeLeaders ?? []).forEach(leader => leadersByRegion.set(leader.region_id, [...(leadersByRegion.get(leader.region_id) ?? []), leader]))
  const saved = searchParams?.saved === '1'

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <header className="border-b border-[#CEC8BD] bg-[#FAF7F1]"><div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 sm:px-8"><BrandWordmark suffix="club" className="inline-flex items-baseline text-[24px] font-semibold leading-none tracking-[-0.055em]" /><div className="flex gap-4 text-xs font-bold"><Link href="/regions">Ver regiões</Link><Link href="/bench/manage">Bench</Link></div></div></header>
      <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/regions" className="inline-flex items-center gap-2 text-xs font-bold text-[#716B65]"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
        <div className="mt-7 border-b border-[#CEC8BD] pb-8"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">gestão regional</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl" style={roundedFont}>lideranças<span className="text-[#E88A6A]">.</span></h1><p className="mt-2 text-sm text-[#69635E]">Configure a regional, divida responsabilidades e mantenha uma sucessão visível.</p></div>
        {saved ? <div className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Configuração salva.</div> : null}

        {manager.isAdmin && pending && pending.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Candidaturas pendentes</h2><span className="rounded-full bg-[#FFF0E9] px-2 py-1 text-[9px] font-bold text-[#A24D36]">{pending.length}</span></div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {pending.map(application => {
                const region = regionById.get(application.region_id)
                return (
                  <article key={application.id} className="border border-[#CEC8BD] bg-[#FAF7F1] p-5">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{application.display_name}</p><p className="mt-1 text-xs text-[#77716A]">{[application.title, application.organization].filter(Boolean).join(' · ')}</p></div><span className="text-[9px] font-bold uppercase text-[#C9684F]">{region?.name || 'Região'}</span></div>
                    <p className="mt-4 text-xs leading-5 text-[#625E59]">{application.motivation}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#817A73]"><span>{application.email}</span><span>·</span><span>{application.role}</span>{application.linkedin_url ? <><span>·</span><a href={application.linkedin_url} target="_blank" rel="noreferrer" className="underline">LinkedIn</a></> : null}</div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <form action={reviewLeadershipApplication}><input type="hidden" name="leadership_id" value={application.id} /><input type="hidden" name="decision" value="active" /><button className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#111111] px-3 py-2.5 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" /> Aprovar</button></form>
                      <form action={reviewLeadershipApplication}><input type="hidden" name="leadership_id" value={application.id} /><input type="hidden" name="decision" value="declined" /><button className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#CEC8BD] px-3 py-2.5 text-xs font-bold"><X className="h-3.5 w-3.5" /> Recusar</button></form>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Regionais sob sua gestão</h2><span className="text-xs text-[#817A73]">{regions?.length ?? 0}</span></div>
            <div className="mt-4 space-y-4">
              {(regions ?? []).map(region => {
                const regionLeaders = leadersByRegion.get(region.id) ?? []
                return (
                  <article key={region.id} className="border border-[#CEC8BD] bg-[#FAF7F1] p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#C9684F]" /><div><h3 className="text-lg font-bold">{region.name}</h3><p className="text-[10px] text-[#817A73]">{region.region_type} · {region.timezone}</p></div></div><span className="rounded-full border border-[#CEC8BD] px-2 py-1 text-[9px] font-bold uppercase text-[#716B65]">{region.status}</span></div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-[.8fr_1.2fr]">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#817A73]">liderança ativa</p>
                        <div className="mt-2 space-y-2">
                          {regionLeaders.map(leader => <div key={leader.id} className="border-t border-[#E6DED0] pt-2"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold">{leader.display_name}</p><span className="text-[9px] font-semibold text-[#C9684F]">{leader.role}</span></div><p className="mt-0.5 text-[10px] text-[#817A73]">{[leader.title, leader.organization].filter(Boolean).join(' · ')}</p></div>)}
                          {!regionLeaders.length ? <p className="text-xs leading-5 text-[#A24D36]">Sem liderança ativa. A regional aparece publicamente como aberta para candidaturas.</p> : null}
                        </div>
                      </div>

                      <form action={updateCommunityRegion} className="space-y-3">
                        <input type="hidden" name="region_id" value={region.id} />
                        <textarea name="description" defaultValue={region.description || ''} rows={3} maxLength={2000} placeholder="Descrição da regional" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#E88A6A]" />
                        <input name="whatsapp_url" type="url" defaultValue={region.whatsapp_url || ''} placeholder="Link do grupo de WhatsApp" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#E88A6A]" />
                        <input name="meeting_cadence" defaultValue={region.meeting_cadence || ''} placeholder="Cadência: ex. encontro mensal" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#E88A6A]" />
                        <div className="grid grid-cols-[1fr_auto] gap-2"><select name="status" defaultValue={region.status} className="rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs"><option value="forming">Formando liderança</option><option value="active">Ativa</option><option value="paused">Pausada</option>{manager.isAdmin ? <option value="archived">Arquivada</option> : null}</select><button className="rounded-lg bg-[#111111] px-4 py-2.5 text-xs font-bold text-white">Salvar</button></div>
                      </form>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="border border-[#CEC8BD] bg-[#FAF7F1] p-5"><UsersRound className="h-4 w-4 text-[#C9684F]" /><h2 className="mt-4 text-lg font-semibold tracking-[-0.03em]" style={roundedFont}>divida a operação.</h2><p className="mt-2 text-xs leading-5 text-[#77716A]">Use co-leads e organizadores para não concentrar grupo, agenda e encontros em uma pessoa.</p><Link href="/regions#liderar" className="mt-4 inline-flex text-xs font-bold text-[#C9684F]">Abrir candidaturas →</Link></div>
            {manager.isAdmin ? (
              <div className="border border-[#CEC8BD] bg-[#FAF7F1] p-5"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-[#C9684F]" /><h2 className="text-sm font-bold">Criar cidade / metro</h2></div><form action={createCommunityRegion} className="mt-4 space-y-2.5"><input name="name" required minLength={2} maxLength={120} placeholder="Nome da região" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs" /><div className="grid grid-cols-2 gap-2"><select name="region_type" className="rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs"><option value="city">Cidade</option><option value="metro">Região metropolitana</option><option value="state">Estado</option></select><input name="state_code" maxLength={2} placeholder="UF" className="rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs" /></div><input name="macro_region" placeholder="Macro região" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs" /><input name="timezone" defaultValue="America/Sao_Paulo" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-xs" /><button className="w-full rounded-lg border border-[#111111] px-3 py-2.5 text-xs font-bold">Criar regional</button></form></div>
            ) : null}
          </aside>
        </section>
      </main>
    </div>
  )
}
