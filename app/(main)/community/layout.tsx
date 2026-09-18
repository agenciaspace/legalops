import {ClubLanguageSelect} from '@/components/community/ClubLanguage'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {hasClubProAccess} from '@/lib/club-membership'
import {AgentBubble} from '@/components/community/AgentBubble'
import type { Metadata } from 'next'
import {ClubPwa} from '@/components/community/ClubPwa'
import {ClubWelcomeNotice} from '@/components/community/ClubWelcomeNotice'
import {CommunityTabs} from '@/components/community/CommunityTabs'
export const metadata: Metadata = { title: 'Comunidade | legalops.club', description: 'Posts, Eventos e Pro em áreas próprias.', manifest: '/club-pwa/manifest.webmanifest', appleWebApp: { capable: true, title: 'LegalOps Club', statusBarStyle: 'default' }, icons: { icon: '/club-pwa/icon-192.png', apple: '/club-pwa/icon-192.png' } }

export default async function CommunityLayout({children}:{children:React.ReactNode}) {const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser();const {data:member}=await db.from('community_members').select('club_pro_status,club_pro_expires_at').eq('user_id',user?.id??'').maybeSingle();return <div className="club-shell min-h-[calc(100dvh-4rem)] bg-[#F3F0E8] text-[#24231F]"><div className="flex min-h-[calc(100dvh-4rem)]"><CommunityTabs/><div className="club-content min-w-0 flex-1"><ClubPwa/>{!user && <div className="flex justify-end px-4 pt-4"><ClubLanguageSelect /></div>}<ClubWelcomeNotice/>{children}</div></div><AgentBubble hasPro={hasClubProAccess(member)}/></div>}
