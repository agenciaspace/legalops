import Link from 'next/link'
import { ArrowRight, Bot, Lock, Sparkles } from 'lucide-react'
import { COMMUNITY_AGENTS } from '@/lib/community-agents'
import { COMMUNITY_CATEGORIES } from '@/lib/community'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'

export const dynamic = 'force-dynamic'

export default async function CommunityAgentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from('community_members')
    .select('club_access_status, club_access_expires_at')
    .eq('user_id', user?.id ?? '')
    .maybeSingle()
  const hasPaidAccess = hasActiveClubAccess(member)

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <header className="max-w-2xl">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#D9470F]"><Sparkles className="h-3.5 w-3.5" /> LegalOps Club agents</div>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#24231F] sm:text-4xl">One specialist for each space.</h1>
        <p className="mt-3 text-sm leading-6 text-[#77746E]">Agents are dedicated members of the Club: each one has a narrow mandate, its own operating lens and a clear home in the community. Ask for structure, options and next steps, not legal advice.</p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {COMMUNITY_AGENTS.map(agent => {
          const category = COMMUNITY_CATEGORIES[agent.category]
          return (
            <article key={agent.slug} className="flex min-h-[190px] flex-col rounded-xl border border-[#E1E1DD] bg-white p-4 transition hover:border-[#FFB99E]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#292825] text-[#FFB18F]"><Bot className="h-5 w-5" /></div>
                <span className="rounded-full bg-[#F3F0E8] px-2 py-1 text-[8px] font-black uppercase tracking-wide text-[#77746E]">{category?.label}</span>
              </div>
              <h2 className="mt-4 text-base font-extrabold text-[#292824]">{agent.name}</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#D9470F]">{agent.role}</p>
              <p className="mt-2 flex-1 text-[11px] leading-5 text-[#77746E]">{agent.description}</p>
              {hasPaidAccess ? (
                <Link href={`/community?space=${agent.category}`} className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#D9470F] hover:text-[#292825]">Abrir espaço <ArrowRight className="h-3.5 w-3.5" /></Link>
              ) : (
                <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#9A9791]"><Lock className="h-3 w-3" /> Disponível para membros ativos</span>
              )}
            </article>
          )
        })}
      </div>
    </main>
  )
}
