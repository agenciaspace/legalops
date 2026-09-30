import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadEventAdminOverview, type EventAdminRegistration } from '@/lib/event-admin'
import { requireLegalOpsAdmin } from '@/lib/legalops-admin'

export const dynamic = 'force-dynamic'

function statusLabel(response: EventAdminRegistration['response']) {
  if (response === 'confirmed') return 'Confirmada'
  if (response === 'declined') return 'Desistiu'
  return 'Pendente'
}

function statusClass(response: EventAdminRegistration['response']) {
  if (response === 'confirmed') return 'bg-emerald-50 text-emerald-800'
  if (response === 'declined') return 'bg-stone-100 text-stone-600'
  return 'bg-amber-50 text-amber-900'
}

function registeredAt(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value))
}

function singular(value: number, one: string, many: string) {
  return `${value} ${value === 1 ? one : many}`
}

export default async function EventRegistrationsAdminPage({ params }: { params: { slug: string } }) {
  const nextPath = `/club/admin/events/${params.slug}`
  await requireLegalOpsAdmin(nextPath)
  const overview = await loadEventAdminOverview(params.slug)
  if (!overview) notFound()

  const { event, registrations, counts } = overview
  return <main className="mx-auto w-full max-w-6xl px-4 py-8 text-[#24231F] sm:px-6 lg:py-12">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link href={`/community/events/${event.slug}`} className="inline-flex min-h-11 items-center text-xs font-bold text-[#A94E38] underline underline-offset-4">← Voltar ao evento</Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Inscrições · {event.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#716B65]">Dados privados para organização do encontro. O vínculo com o Club considera a conta encontrada pelo usuário ou pelo mesmo e-mail da inscrição.</p>
      </div>
      <Link href="/community/events/manage" className="inline-flex min-h-11 items-center rounded-lg border border-[#CEC8BD] bg-white px-4 text-xs font-bold">Configurar eventos</Link>
    </div>

    <section aria-label="Resumo das inscrições" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[
        ['Total', String(counts.total)],
        ['Confirmadas', singular(counts.confirmed, 'confirmada', 'confirmadas')],
        ['No Club', singular(counts.clubLinked, 'no Club', 'no Club')],
        ['Pendentes', String(counts.pending)],
        ['Desistências', String(counts.declined)],
      ].map(([label, value]) => <div key={label} className="rounded-xl border border-[#CEC8BD] bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#817A73]">{label}</p><p className="mt-2 text-2xl font-semibold tracking-[-.035em]">{value}</p></div>)}
    </section>

    <section className="mt-10">
      <div className="flex items-end justify-between gap-3 border-b border-[#CEC8BD] pb-4"><div><h2 className="text-2xl font-bold tracking-[-.03em]">Pessoas inscritas</h2><p className="mt-1 text-xs text-[#716B65]">Mais recentes primeiro.</p></div></div>
      {!registrations.length ? <div className="mt-6 rounded-xl border border-dashed border-[#CEC8BD] bg-[#FAF7F1] p-8 text-sm">Nenhuma inscrição recebida.</div> : <div className="mt-5 space-y-4">
        {registrations.map(registration => <article key={registration.id} className="rounded-xl border border-[#CEC8BD] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{registration.guest_name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] ${statusClass(registration.response)}`}>{statusLabel(registration.response)}</span></div>
              <p className="mt-1 text-sm text-[#625E59]">{registration.guest_role} · {registration.organization_name}</p>
              <p className="mt-2 break-all text-sm font-semibold">{registration.guest_email}</p>
              {registration.guest_phone ? <p className="mt-1 text-sm text-[#625E59]">{registration.guest_phone}</p> : null}
            </div>
            <div className="text-left sm:text-right">
              <p className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.1em] ${registration.club ? 'bg-[#E7F4E9] text-[#246338]' : 'bg-[#FFF0E9] text-[#A94E38]'}`}>{registration.club ? 'Perfil ativo no Club' : 'Sem cadastro no Club'}</p>
              <p className="mt-2 text-xs text-[#817A73]">Inscrição em {registeredAt(registration.created_at)}</p>
            </div>
          </div>

          {registration.club ? <div className="mt-5 grid gap-3 rounded-lg bg-[#F5F1E8] p-4 text-sm sm:grid-cols-3">
            <div><p className="text-[10px] font-black uppercase tracking-[.12em] text-[#817A73]">Cadastro do Club</p><p className="mt-1 font-semibold">{registration.club.display_name || registration.guest_name}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-[.12em] text-[#817A73]">Acesso</p><p className="mt-1 font-semibold">{registration.club.club_access_status || 'não informado'}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-[.12em] text-[#817A73]">Perfil</p><p className="mt-1 font-semibold">{registration.club.profile_verification_status || 'não verificado'}</p>{registration.club.linkedin_url ? <a className="mt-1 inline-block text-xs underline" href={registration.club.linkedin_url} target="_blank" rel="noreferrer">Abrir LinkedIn</a> : null}</div>
          </div> : null}

          {(registration.arrival_notes || registration.dietary_restrictions || registration.accessibility_needs) ? <details open className="mt-5 border-t border-[#E6DED0] pt-4"><summary className="cursor-pointer text-xs font-bold">Informações adicionais</summary><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            {registration.arrival_notes ? <div><dt className="text-xs text-[#817A73]">Observações</dt><dd className="mt-1 whitespace-pre-wrap">{registration.arrival_notes}</dd></div> : null}
            {registration.dietary_restrictions ? <div><dt className="text-xs text-[#817A73]">Alimentação</dt><dd className="mt-1 whitespace-pre-wrap">{registration.dietary_restrictions}</dd></div> : null}
            {registration.accessibility_needs ? <div><dt className="text-xs text-[#817A73]">Acessibilidade</dt><dd className="mt-1 whitespace-pre-wrap">{registration.accessibility_needs}</dd></div> : null}
          </dl></details> : null}
        </article>)}
      </div>}
    </section>
  </main>
}
