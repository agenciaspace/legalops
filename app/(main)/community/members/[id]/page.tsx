import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Building2, Linkedin, ShieldCheck } from 'lucide-react'
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
  linkedin_url: string | null
  profile_verification_status: string
  profile_verified_at: string | null
}

export const dynamic = 'force-dynamic'

export default async function MemberProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('community_members')
    .select('user_id, display_name, current_role, areas_of_expertise, public_headline, public_bio, organization_name, linkedin_url, profile_verification_status, profile_verified_at')
    .eq('user_id', params.id)
    .maybeSingle()

  if (!data) notFound()
  const member = data as Member
  const verified = member.profile_verification_status === 'verified'

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <Link href="/community/members" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#77746E] hover:text-[#D9470F]"><ArrowLeft className="h-3.5 w-3.5" /> Voltar aos membros</Link>

      <article className="mt-4 overflow-hidden rounded-xl border border-[#E1E1DD] bg-white">
        <div className="h-24 bg-[#292825] sm:h-32" />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-9 flex flex-col gap-4 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-xl font-black shadow-sm ${getAvatarTone(member.display_name)}`}>{getInitials(member.display_name)}</div>
            {verified ? (
              <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-700 sm:self-auto"><BadgeCheck className="h-4 w-4" /> Perfil validado</span>
            ) : (
              <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[9px] font-bold text-stone-600 sm:self-auto"><ShieldCheck className="h-4 w-4" /> Validação pendente</span>
            )}
          </div>

          <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.025em] text-[#292824]">{member.display_name}</h1>
          {member.public_headline ? <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5F5C56]">{member.public_headline}</p> : null}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-[#77746E]">
            <span className="flex items-center gap-1.5"><BriefcaseBusiness className="h-4 w-4" /> {member.current_role || 'Profissional do jurídico'}</span>
            {member.organization_name ? <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {member.organization_name}</span> : null}
            {member.linkedin_url ? <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-bold text-[#D9470F] hover:underline"><Linkedin className="h-4 w-4" /> LinkedIn</a> : null}
          </div>

          <div className="mt-6 border-t border-[#ECECE8] pt-6">
            <h2 className="text-xs font-extrabold text-[#34332F]">Sobre a atuação</h2>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[#68655F]">{member.public_bio || 'Este membro ainda está completando sua apresentação profissional.'}</p>
          </div>

          <div className="mt-6 border-t border-[#ECECE8] pt-6">
            <h2 className="text-xs font-extrabold text-[#34332F]">Experiência e temas de troca</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(member.areas_of_expertise ?? []).map(area => <span key={area} className="rounded-lg bg-[#F1F1EE] px-3 py-1.5 text-[9px] font-bold text-[#5F5C56]">{area}</span>)}
              {(member.areas_of_expertise ?? []).length === 0 ? <span className="text-[10px] text-[#999690]">Temas ainda não informados.</span> : null}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
