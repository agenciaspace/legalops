import { BriefcaseBusiness, Search, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getInitials } from '@/lib/community'

type Member = {
  user_id: string
  display_name: string
  current_role: string | null
  areas_of_expertise: string[] | null
}

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: rawMembers } = await supabase
    .from('community_members')
    .select('user_id, display_name, current_role, areas_of_expertise')
    .order('created_at', { ascending: true })

  const members = (rawMembers ?? []) as Member[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#FF6A00]"><Users className="h-4 w-4" /> Diretório de membros</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Encontre quem entende o desafio.</h2>
          <p className="mt-3 text-sm leading-6 text-[#1A1A1A]/55">Conecte-se por especialidade, contexto e experiência em operações jurídicas.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1A1A1A]/10 bg-white px-4 py-2 text-xs font-black text-[#1A1A1A]/55 shadow-sm">
          <Users className="h-3.5 w-3.5 text-[#FF6A00]" /> {members.length} {members.length === 1 ? 'membro' : 'membros'}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(member => {
          const name = member.display_name?.trim() || 'Membro LegalOps'
          const areas = member.areas_of_expertise ?? []
          return (
            <article key={member.user_id} className="flex min-h-64 flex-col rounded-2xl border border-[#1A1A1A]/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1A1A] text-sm font-black text-white">{getInitials(name)}</div>
              </div>
              <h3 className="mt-5 text-lg font-black tracking-[-0.02em]">{name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]/45"><BriefcaseBusiness className="h-3.5 w-3.5" /> {member.current_role || 'Profissional do jurídico'}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {areas.slice(0, 3).map(area => <span key={area} className="rounded-full bg-[#F5F4F0] px-2.5 py-1 text-[10px] font-bold text-[#1A1A1A]/55">{area}</span>)}
                {areas.length === 0 ? <span className="text-[11px] text-[#1A1A1A]/30">Perfil em construção</span> : null}
              </div>
            </article>
          )
        })}
      </div>

      {members.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#1A1A1A]/15 bg-white/60 p-10 text-center">
          <Search className="mx-auto h-7 w-7 text-[#FF6A00]" />
          <p className="mt-3 text-sm font-bold text-[#1A1A1A]/55">Os primeiros perfis aparecerão aqui.</p>
        </div>
      ) : null}
    </div>
  )
}
