import Link from 'next/link'
import { BadgeCheck, BriefcaseBusiness, Building2, Search, SlidersHorizontal, UserPlus, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAvatarTone, getInitials } from '@/lib/community'

type Member = {
  user_id: string
  display_name: string
  current_role: string | null
  areas_of_expertise: string[] | null
  public_headline: string | null
  public_bio: string | null
  organization_name: string | null
  profile_verification_status: string
}

export const dynamic = 'force-dynamic'

export default async function MembersPage({ searchParams }: { searchParams?: { q?: string } }) {
  const supabase = await createServerSupabaseClient()
  const search = searchParams?.q?.trim() ?? ''
  let membersQuery = supabase
    .from('community_members')
    .select('user_id, display_name, current_role, areas_of_expertise, public_headline, public_bio, organization_name, profile_verification_status')

  if (search) membersQuery = membersQuery.ilike('display_name', `%${search}%`)

  const { data: rawMembers } = await membersQuery.order('created_at', { ascending: true })
  const members = (rawMembers ?? []) as Member[]

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">Membros</h1>
          <p className="mt-1 text-xs text-[#77746E]">Encontre pessoas por experiência, função ou especialidade.</p>
        </div>
        <button className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg bg-[#FF5C1A] px-3.5 text-[11px] font-extrabold text-white hover:bg-[#E84D10]">
          <UserPlus className="h-4 w-4" /> Convidar pessoas
        </button>
      </header>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <form className="relative flex-1" action="/community/members">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999690]" />
          <input name="q" defaultValue={search} placeholder="Buscar membros" className="h-10 w-full rounded-lg border border-[#DFDFDB] bg-white pl-9 pr-3 text-xs outline-none transition focus:border-[#FFB99E] focus:ring-2 focus:ring-[#FFF0E9]" />
        </form>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DFDFDB] bg-white px-3 text-[10px] font-bold text-[#66635E] hover:bg-[#FAFAF8]">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between border-b border-[#E3E3DF] pb-3">
        <p className="text-[10px] font-bold text-[#8B8882]">{members.length} {members.length === 1 ? 'membro encontrado' : 'membros encontrados'}</p>
        <button className="text-[10px] font-bold text-[#8B8882]">Mais recentes</button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {members.map(member => {
          const name = member.display_name?.trim() || 'Membro LegalOps'
          const areas = member.areas_of_expertise ?? []
          return (
            <article key={member.user_id} className="group flex min-h-64 flex-col rounded-xl border border-[#E1E1DD] bg-white p-4 transition hover:border-[#CBCAC5] hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-black ${getAvatarTone(name)}`}>{getInitials(name)}</div>
                {member.profile_verification_status === 'verified' ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Validado</span> : <span className="rounded-full bg-stone-100 px-2 py-1 text-[8px] font-bold text-stone-500">Em validação</span>}
              </div>
              <h2 className="mt-4 flex items-center gap-1.5 text-sm font-extrabold tracking-[-0.01em] text-[#2C2B27]">{name}</h2>
              {member.public_headline ? <p className="mt-1.5 line-clamp-2 text-[10px] font-semibold leading-4 text-[#5F5C56]">{member.public_headline}</p> : null}
              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-[#88857F]"><BriefcaseBusiness className="h-3.5 w-3.5" /> {member.current_role || 'Profissional do jurídico'}</p>
              {member.organization_name ? <p className="mt-1 flex items-center gap-1.5 text-[9px] text-[#999690]"><Building2 className="h-3.5 w-3.5" /> {member.organization_name}</p> : null}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {areas.slice(0, 3).map(area => <span key={area} className="rounded-md bg-[#F1F1EE] px-2 py-1 text-[8px] font-bold text-[#67645F]">{area}</span>)}
                {areas.length > 3 ? <span className="rounded-md bg-[#FFF0E9] px-2 py-1 text-[8px] font-bold text-[#D9470F]">+{areas.length - 3}</span> : null}
                {areas.length === 0 ? <span className="text-[9px] text-[#AAA7A1]">Perfil em construção</span> : null}
              </div>
              <Link href={`/community/members/${member.user_id}`} className="mt-auto pt-4 text-left text-[9px] font-extrabold text-[#D9470F] transition group-hover:translate-x-0.5">Ver perfil completo →</Link>
            </article>
          )
        })}
      </div>

      {members.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[#D9D8D3] bg-white/60 p-10 text-center">
          <Users className="mx-auto h-7 w-7 text-[#FF5C1A]" />
          <p className="mt-3 text-xs font-bold text-[#68655F]">{search ? 'Nenhum membro corresponde à busca.' : 'Os primeiros perfis aparecerão aqui.'}</p>
        </div>
      ) : null}
    </div>
  )
}
