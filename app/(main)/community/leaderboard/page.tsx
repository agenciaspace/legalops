import { Award, MessageCircle, Sparkles, Trophy } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCommunityLevel, getInitials } from '@/lib/community'

type RankingMember = {
  user_id: string
  display_name: string
  current_role: string | null
  points: number
  level: number
}

const medals = ['bg-amber-400 text-amber-950', 'bg-slate-300 text-slate-800', 'bg-orange-300 text-orange-950']

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: rawRanking } = await supabase
    .from('community_leaderboard')
    .select('user_id, display_name, current_role, points, level')
    .order('points', { ascending: false })
    .order('display_name', { ascending: true })

  const ranking = (rawRanking ?? []) as RankingMember[]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <section>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#FF6A00]"><Trophy className="h-4 w-4" /> Ranking do Club</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Reconhecimento para quem contribui.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#1A1A1A]/55">O ranking valoriza conversas úteis — não tempo de tela.</p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[#1A1A1A]/10 bg-white shadow-sm">
            {ranking.map((member, index) => (
              <div key={member.user_id} className="flex items-center gap-3 border-b border-[#1A1A1A]/8 px-4 py-4 last:border-b-0 sm:px-5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${index < 3 ? medals[index] : 'bg-[#F5F4F0] text-[#1A1A1A]/45'}`}>
                  {index + 1}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] text-xs font-black text-white">{getInitials(member.display_name)}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-black">{member.display_name}</h3>
                  <p className="truncate text-[11px] text-[#1A1A1A]/40">{member.current_role || getCommunityLevel(member.level)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{member.points}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#1A1A1A]/35">pontos</p>
                </div>
                <div className="hidden w-24 sm:block">
                  <p className="text-[10px] font-black text-[#FF6A00]">Nível {member.level}</p>
                  <p className="mt-0.5 text-[9px] text-[#1A1A1A]/40">{getCommunityLevel(member.level)}</p>
                </div>
              </div>
            ))}
            {ranking.length === 0 ? <p className="p-10 text-center text-sm text-[#1A1A1A]/45">O ranking começa com a primeira contribuição.</p> : null}
          </div>
        </section>

        <aside className="space-y-4 lg:pt-24">
          <div className="rounded-2xl bg-[#1A1A1A] p-5 text-white">
            <Award className="h-5 w-5 text-[#FF7A45]" />
            <h3 className="mt-4 text-sm font-black">Como pontuar</h3>
            <ul className="mt-4 space-y-3 text-xs text-white/60">
              <li className="flex items-center justify-between"><span>Publicação</span><strong className="text-white">+5</strong></li>
              <li className="flex items-center justify-between"><span>Comentário</span><strong className="text-white">+2</strong></li>
              <li className="flex items-center justify-between"><span>Curtida recebida</span><strong className="text-white">+1</strong></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#1A1A1A]/10 bg-white p-5">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#FF6A00]" /><h3 className="text-sm font-black">O que conta</h3></div>
            <p className="mt-3 text-xs leading-5 text-[#1A1A1A]/55">Contribuição genuína. Publicações repetitivas ou sem contexto podem ser removidas.</p>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-[#1A1A1A]/35"><MessageCircle className="h-3.5 w-3.5" /> Qualidade acima de volume.</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
