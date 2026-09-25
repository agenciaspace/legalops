import {ClubLanguageSelect} from '@/components/community/ClubLanguage'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {hasClubProAccess} from '@/lib/club-membership'
import {AgentBubble} from '@/components/community/AgentBubble'
import type { Metadata } from 'next'
import {ClubPwa} from '@/components/community/ClubPwa'
import {ClubWelcomeNotice} from '@/components/community/ClubWelcomeNotice'
import {CommunityTabs} from '@/components/community/CommunityTabs'
import {ProfileCompletionNotice} from '@/components/community/ProfileCompletionNotice'
import {BrandWordmark} from '@/components/BrandLogo'
import {hasActiveClubAccess} from '@/lib/community'
import Link from 'next/link'
import {getClubTranslator} from '@/lib/club-locale-server'
import {headers} from 'next/headers'
export const metadata: Metadata = { title: 'Comunidade | legalops.club', description: 'Posts, Eventos e Pro em áreas próprias.', manifest: '/club-pwa/manifest.webmanifest', appleWebApp: { capable: true, title: 'LegalOps Club', statusBarStyle: 'default' }, icons: { icon: '/club-pwa/icon-192.png', apple: '/club-pwa/icon-192.png' } }

export default async function CommunityLayout({children}:{children:React.ReactNode}) {
  const t=getClubTranslator()
  const publicEventFallback=headers().get('x-public-event-fallback')
  if (publicEventFallback) return <div className="min-h-screen bg-[#F5F1E8] text-[#24231F]">
    <header className="border-b border-[#CEC8BD] bg-[#F5F1E8]/95">
      <div className="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-3 px-5 sm:px-8">
        <Link href="/club" aria-label="Página inicial do legalops.club"><BrandWordmark suffix="club" className="inline-flex items-baseline text-[24px] leading-none"/></Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ClubLanguageSelect compact/>
          <Link href={`/login?next=${encodeURIComponent(`/community/events/${publicEventFallback}`)}`} className="inline-flex min-h-11 items-center rounded-lg border border-[#24231F] px-3 text-xs font-bold sm:px-4">{t('Entrar')}</Link>
        </div>
      </div>
    </header>
    {children}
  </div>
  const db=await createServerSupabaseClient()
  const {data:{user}}=await db.auth.getUser()
  const {data:member}=user ? await db.from('community_members').select('club_access_status,club_access_expires_at,club_pro_status,club_pro_expires_at,profile_verification_status').eq('user_id',user.id).maybeSingle() : {data:null}
  const isMember=hasActiveClubAccess(member)

  if (!user) return <div className="min-h-screen bg-[#F5F1E8] text-[#24231F]">
    <header className="border-b border-[#CEC8BD] bg-[#F5F1E8]/95">
      <div className="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-3 px-5 sm:px-8">
        <Link href="/club" aria-label="Página inicial do legalops.club"><BrandWordmark suffix="club" className="inline-flex items-baseline text-[24px] leading-none"/></Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ClubLanguageSelect compact/>
          <Link href="/login?next=/community" className="inline-flex min-h-11 items-center rounded-lg border border-[#24231F] px-3 text-xs font-bold sm:px-4">{t('Entrar')}</Link>
        </div>
      </div>
    </header>
    {children}
  </div>

  if (!isMember) return <div className="min-h-[calc(100dvh-4rem)] bg-[#F5F1E8] text-[#24231F]">{children}</div>

  return <div className="club-shell min-h-[calc(100dvh-4rem)] bg-[#F3F0E8] text-[#24231F]">
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <CommunityTabs/>
      <div className="club-content min-w-0 flex-1">
        <ClubPwa/>
        <ProfileCompletionNotice visible={Boolean(member && member.profile_verification_status !== 'verified')}/>
        <ClubWelcomeNotice/>
        {children}
      </div>
    </div>
    <AgentBubble hasPro={hasClubProAccess(member)}/>
  </div>
}
