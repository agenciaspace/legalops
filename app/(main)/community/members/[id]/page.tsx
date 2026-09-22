import { verificationState } from '@/lib/member-verification'
import { PROFESSIONAL_ENVIRONMENTS } from '@/lib/member-directory'
import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { ProfileContactCode } from '@/components/community/ProfileContactCode'
import { MemberAvatar } from '@/components/community/MemberAvatar'
import Link from 'next/link'
import {isDirectoryMember} from '@/lib/community-directory'
import { notFound } from 'next/navigation'
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Building2, Linkedin, ShieldCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAvatarTone, getInitials } from '@/lib/community'

type Member = {
  directory_country: string | null
  directory_region: string | null
  directory_city: string | null
  directory_qualifications: string[]
  professional_type: string | null
  avatar_path: string | null
  organization_description: string | null
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
  const t = getClubTranslator()
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('community_members')
    .select('directory_country,directory_region,directory_city,directory_qualifications,professional_type,club_access_status,club_access_expires_at,avatar_path, organization_description, user_id, display_name, current_role, areas_of_expertise, public_headline, public_bio, organization_name, linkedin_url, profile_verification_status, profile_verified_at')
    .eq('user_id', params.id)
    .maybeSingle()

  if (!data || !isDirectoryMember(data)) notFound()
  const member = data as Member
  const countryNames = new Intl.DisplayNames([getClubLocale()], { type: 'region' })
  const location = [member.directory_city,member.directory_region,member.directory_country ? countryNames.of(member.directory_country) : null].filter(Boolean).join(' · ')
  const verified = member.profile_verification_status === 'verified'

  const translations = await loadClubTranslations(supabase, [member.user_id])
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <Link href="/community/members" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#77746E] hover:text-[#D9470F]"><ArrowLeft className="h-3.5 w-3.5" /> {t("Voltar aos membros")}</Link>

      <article className="mt-4 overflow-hidden rounded-xl border border-[#E1E1DD] bg-white">
        <div className="h-24 bg-[#292825] sm:h-32" />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-9 flex flex-col gap-4 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
            <MemberAvatar userId={member.user_id} path={member.avatar_path} name={member.display_name} size="h-20 w-20 border-4 border-white" />
            {verified ? (
              <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-700 sm:self-auto"><BadgeCheck className="h-4 w-4" /> {t(verificationState(member.profile_verification_status).publicLabel)}</span>
            ) : (
              <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[9px] font-bold text-stone-600 sm:self-auto"><ShieldCheck className="h-4 w-4" /> {t(verificationState(member.profile_verification_status).publicLabel)}</span>
            )}
          </div>

          <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.025em] text-[#292824]">{member.display_name}</h1>
          <Link href={`/contact/${member.user_id}`} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">{t("Trocar contatos")}</Link>
          <details className="mt-3 max-w-sm"><summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold underline">{t("QR de contato deste perfil")}</summary><div className="mt-2"><ProfileContactCode userId={member.user_id} /></div></details>
          <TranslatedContent source={translations.sources.get(`member:${member.user_id}`)} original={{public_headline:member.public_headline,current_role:member.current_role,organization_description:member.organization_description,public_bio:member.public_bio,areas_of_expertise:member.areas_of_expertise}} enabled={translations.enabled} serverLocale={getClubLocale()} />

          {location && <p className="mt-4 text-sm text-[#625E59]">{location}</p>}
          {member.professional_type && <p className="mt-2 text-sm text-[#625E59]">{t(PROFESSIONAL_ENVIRONMENTS[member.professional_type] ?? member.professional_type)}</p>}
          {!!member.directory_qualifications?.length && <section className="mt-5"><h2 className="text-base font-semibold">{t('Qualificações públicas')}</h2><div className="mt-2 flex flex-wrap gap-2">{member.directory_qualifications.map(value=><span key={value} className="rounded-lg bg-[#F5F1E8] px-3 py-2 text-sm">{value}</span>)}</div><p className="mt-2 text-xs text-[#625E59]">{t('Informações declaradas pelo membro, sem certificação pelo Club.')}</p></section>}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#77746E]">

            {member.organization_name ? <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {member.organization_name}</span> : null}
            {member.linkedin_url ? <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-bold text-[#D9470F] hover:underline"><Linkedin className="h-4 w-4" /> {t("LinkedIn")}</a> : null}
          </div>

        </div>
      </article>
    </div>
  )
}
