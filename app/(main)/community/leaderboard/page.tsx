import { Award, Heart, MessageCircle, Sparkles, Trophy } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAvatarTone, getCommunityLevel, getInitials } from '@/lib/community'

type RankingMember = {
  user_id: string
  display_name: string
  current_role: string | null
  points: number
  level: number
}

const medals = ['bg-[#FFF0BF] text-[#8A6500]', 'bg-[#E9EBED] text-[#59616A]', 'bg-[#F3DED1] text-[#8A5132]']

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
    <div className="mx-auto w-full max-w-[1000px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">Leaderboard</h1>
        <p className="mt-1 text-xs text-[#77746E]">Reconhecimento para quem melhora a conversa e ajuda outros membros.</p>
      </header>

      <section className="relative mt-5 overflow-hidden rounded-xl bg-[#292825] px-5 py-6 text-white sm:px-7">
        <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-[#FF5C1A]/30 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF5C1A]"><Trophy className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-extrabold">Contribuição acima de volume.</h2>
            <p className="mt-1 max-w-xl text-[11px] leading-5 text-white/60">Compartilhe aprendizados reais, responda com contexto e ajude a comunidade a avançar.</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
        <section className="overflow-hidden rounded-xl border border-[#E1E1DD] bg-white">
          <div className="grid grid-cols-[40px_minmax(0,1fr)_60px] gap-2 border-b border-[#ECECE8] px-4 py-3 text-[8px] font-black uppercase tracking-[0.1em] text-[#9A9791] sm:grid-cols-[40px_minmax(0,1fr)_80px_100px]">
            <span>#</span><span>Membro</span><span className="text-right">Pontos</span><span className="hidden sm:block">Nível</span>
          </div>
          {ranking.map((member, index) => (
            <div key={member.user_id} className="grid grid-cols-[40px_minmax(0,1fr)_60px] items-center gap-2 border-b border-[#ECECE8] px-4 py-3.5 last:border-b-0 sm:grid-cols-[40px_minmax(0,1fr)_80px_100px]">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${index < 3 ? medals[index] : 'bg-[#F2F2EF] text-[#85827C]'}`}>{index + 1}</div>
              <div className="flex min-w-0 items-center gap-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${getAvatarTone(member.display_name)}`}>{getInitials(member.display_name)}</div>
                <div className="min-w-0"><h2 className="truncate text-[11px] font-extrabold text-[#34332F]">{member.display_name}</h2><p className="truncate text-[8px] text-[#999690]">{member.current_role || getCommunityLevel(member.level)}</p></div>
              </div>
              <p className="text-right text-xs font-black text-[#34332F]">{member.points}</p>
              <div className="hidden sm:block"><p className="text-[9px] font-extrabold text-[#D9470F]">Nível {member.level}</p><p className="mt-0.5 text-[8px] text-[#999690]">{getCommunityLevel(member.level)}</p></div>
            </div>
          ))}
          {ranking.length === 0 ? <p className="p-10 text-center text-xs text-[#77746E]">O ranking começa com a primeira contribuição.</p> : null}
        </section>

        <aside className="space-y-3">
          <section className="rounded-xl border border-[#E1E1DD] bg-white p-4">
            <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[#FF5C1A]" /><h2 className="text-xs font-extrabold">Como pontuar</h2></div>
            <ul className="mt-3 divide-y divide-[#ECECE8] text-[10px] text-[#77746E]">
              <li className="flex items-center justify-between py-2"><span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Publicação</span><strong className="text-[#34332F]">+5</strong></li>
              <li className="flex items-center justify-between py-2"><span className="flex items-center gap-1.5"><MessageCircle className="h-3 w-3" /> Comentário</span><strong className="text-[#34332F]">+2</strong></li>
              <li className="flex items-center justify-between py-2"><span className="flex items-center gap-1.5"><Heart className="h-3 w-3" /> Curtida recebida</span><strong className="text-[#34332F]">+1</strong></li>
            </ul>
          </section>
          <p className="rounded-xl bg-[#FFF0E9] p-3 text-[9px] leading-4 text-[#8B4B31]">Publicações repetitivas ou sem contexto podem ser removidas. Qualidade sempre vence quantidade.</p>
        </aside>
      </div>
    </div>
  )
}
