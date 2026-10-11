'use client'
import { ClubLanguageSelect, useClubLanguage } from '@/components/community/ClubLanguage'


import Link from 'next/link'
import { MapNotifications } from '@/components/community/MapNotifications'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { MemberAvatar } from '@/components/community/MemberAvatar'
import { BrandWordmark } from '@/components/BrandLogo'

interface NavProps {
  discoverCount: number
  jobAlertCount: number
  hasClubAccess: boolean
  isClubMember?: boolean
  member?: {user_id:string;display_name:string;avatar_path?:string|null}|null
  isClubAdmin?: boolean
}

export function Nav({ discoverCount, jobAlertCount, hasClubAccess, isClubMember = false, isClubAdmin = false, member }: NavProps) {
 const { t } = useClubLanguage()

  const pathname = usePathname()
  const router = useRouter()
  const isCommunity = pathname.startsWith('/community')

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLink = (href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        pathname === href || (href === '/community' && pathname.startsWith('/community'))
          ? 'bg-[#EDE5D8] text-[#A24D36]'
          : 'text-[#66615B] hover:bg-white/70 hover:text-[#111111]'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E88A6A] px-1 text-xs font-bold text-[#111111]">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )

  if (isCommunity) {
    return (
      <header className="sticky top-0 z-50 h-16 border-b border-[#CEC8BD] bg-[#F5F1E8]">
        <div className="flex h-full items-center gap-3 px-4 lg:px-5">
          <Link href="/community" className="flex w-auto shrink-0 items-center gap-2.5 lg:w-[188px]" aria-label="legalops.club, início">

            <div className="min-w-0">
              <BrandWordmark className="inline-flex items-baseline text-[22px] font-medium leading-none tracking-[-0.055em] sm:text-[27px] text-[#111111]" />
            </div>

          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-1.5"><span className="hidden sm:inline-flex"><ClubLanguageSelect compact /></span>{isClubMember && <button type="button" onClick={() => document.dispatchEvent(new Event('club:open-agent'))} aria-label={t("Abrir meu agente")} aria-haspopup="dialog" className="inline-flex min-h-11 items-center rounded-lg border border-transparent px-2 text-xs font-medium sm:border-[#CEC8BD] sm:px-4 sm:text-sm">{t("Meu agente")}</button>}
            <details className="relative"><summary className="ml-0.5 flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-[#111111] text-[10px] font-black text-white" aria-label={t("Abrir menu do perfil")}><MemberAvatar userId={member?.user_id} name={member?.display_name || t("Meu perfil")} path={member?.avatar_path} size="h-10 w-10" /></summary><div className="absolute right-0 top-12 w-52 rounded-xl border border-[#CEC8BD] bg-white p-2 text-sm shadow-lg"><div className="flex items-center justify-between px-3"><MapNotifications /><span className="text-xs text-[#625E59]">{t("Idioma / Language / Idioma")}</span><ClubLanguageSelect compact /></div><Link href="/community/profile" className="block rounded-lg p-3 hover:bg-[#F5F1E8]">{t("Meu perfil")}</Link><Link href="/community/members" className="block rounded-lg p-3 hover:bg-[#F5F1E8]">{t("Membros")}</Link><Link href="/community/office" className="block rounded-lg p-3 hover:bg-[#F5F1E8]">{t("Escritório")}</Link><Link href="/community/pro" className="block rounded-lg p-3 hover:bg-[#F5F1E8]">{t("Meu Pro")}</Link>{isClubAdmin&&<Link href="/club/admin/bench" className="block rounded-lg p-3 hover:bg-[#F5F1E8]">Revisar contribuições</Link>}{isClubAdmin&&<Link href="/club/admin/pro" className="block rounded-lg p-3 hover:bg-[#F5F1E8]">Pagamentos do Pro</Link>}<button onClick={handleSignOut} className="w-full rounded-lg p-3 text-left hover:bg-[#F5F1E8]">{t("Sair")}</button></div></details>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#CEC8BD]/75 bg-[#F5F1E8]">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          <Link href="/dashboard" className="mr-6 flex items-center">
            <BrandWordmark
              suffix="work"
              className="inline-flex items-baseline text-[22px] font-medium leading-none tracking-[-0.055em] text-[#111111] sm:text-[27px]"
            />
          </Link>
          {navLink('/community', 'Club')}
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/discover', 'Descobrir', discoverCount)}
          {navLink('/pipeline', 'Pipeline')}
          {navLink('/professionals', 'Profissionais')}
          {navLink('/emails', 'Emails')}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {jobAlertCount > 0 && (
            <Link
              href="/community/jobs"
              className="relative flex items-center justify-center rounded-full p-2 text-[#69635E] transition-colors hover:bg-white/70 hover:text-[#111111]"
              title={`${jobAlertCount} alertas de vagas para o seu perfil do Club`}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E88A6A] text-[9px] font-bold text-[#111111] ring-2 ring-[#F5F1E8]">
                {jobAlertCount > 99 ? '99+' : jobAlertCount}
              </span>
            </Link>
          )}
          <Link href="/community/members" className="hidden rounded-full p-2 text-[#69635E] transition hover:bg-white/70 hover:text-[#111111] sm:flex" title="Membros do Club">
            <Users className="h-5 w-5" />
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-full px-3 py-2 text-xs text-[#66615B] transition-colors hover:bg-white/70 hover:text-[#111111]"
          > {t("Sair")} </button>
        </div>
      </div>
    </header>
  )
}
