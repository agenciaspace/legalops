import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { Bot, CalendarDays, MessageCircle, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCommunityDate, getCommunityCategory } from '@/lib/community'

type DiscussionSummary = {
  id: string
  category: string
  period_start: string
  period_end: string
  title: string
  summary: string
  key_points: string[]
  source_post_count: number
  source_comment_count: number
  model: string
}

export const dynamic = 'force-dynamic'

export default async function DiscussionSummariesPage() {
  const t = getClubTranslator()
  const supabase = await createServerSupabaseClient()
  const { data: rawSummaries } = await supabase
    .from('community_discussion_summaries')
    .select('id, category, period_start, period_end, title, summary, key_points, source_post_count, source_comment_count, model')
    .order('period_end', { ascending: false })
    .limit(24)

  const summaries = (rawSummaries ?? []) as DiscussionSummary[]

  const translations = await loadClubTranslations(supabase, summaries.map(item => item.id))
  const date = (value:string) => new Intl.DateTimeFormat(getClubLocale(), { dateStyle:"medium", timeZone:getClubTimezone() }).format(new Date(value))
  return (
    <div className="mx-auto w-full max-w-[920px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#D9470F]"><Sparkles className="h-3.5 w-3.5" /> {t("Curadoria assistida por IA")}</div>
        <h1 className="mt-2 text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">{t("Resumos do WhatsApp")}</h1>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-[#77746E]">{t("Aqui entram os resumos das conversas gerais do WhatsApp. No app, os fóruns ficam organizados por assunto; no WhatsApp falamos de tudo para manter a conversa aberta.")}</p>
      </header>

      <section className="mt-5 rounded-xl border border-[#FFD6C7] bg-[#FFF6F1] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C1A] text-white"><Bot className="h-4 w-4" /></div>
          <div>
            <h2 className="text-xs font-extrabold text-[#34332F]">{t("Síntese com rastreabilidade")}</h2>
            <p className="mt-1 text-[10px] leading-4 text-[#77746E]">{t("Os resumos usam apenas publicações e comentários do período, mostram o volume de fontes e preservam as discussões para quem quiser aprofundar.")}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 space-y-4">
        {summaries.map(item => {
          const category = getCommunityCategory(item.category)
          return (
            <article key={item.id} className="rounded-xl border border-[#E1E1DD] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[8px] font-black ${category.tone}`}>{t(category.label)}</span>
                <span className="flex items-center gap-1 text-[9px] font-medium text-[#999690]"><CalendarDays className="h-3 w-3" /> {date(item.period_start)} — {date(item.period_end)}</span>
              </div>
              <TranslatedContent source={translations.sources.get(`summary:${item.id}`)} original={{title:item.title,summary:item.summary,key_points:item.key_points}} enabled={translations.enabled} serverLocale={getClubLocale()} />
              <div className="mt-4 flex items-center gap-4 border-t border-[#ECECE8] pt-3 text-[9px] font-semibold text-[#999690]">
                <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {item.source_post_count} {t("publicações")}</span>
                <span>{item.source_comment_count} {t("comentários analisados")}</span>
                <span className="ml-auto flex items-center gap-1"><Sparkles className="h-3 w-3" /> {t("IA + curadoria")}</span>
              </div>
            </article>
          )
        })}
      </div>

      {summaries.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[#D9D8D3] bg-white/60 p-10 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-[#FF5C1A]" />
          <p className="mt-3 text-xs font-bold text-[#68655F]">{t("O primeiro resumo entra no ar após o próximo ciclo de discussões.")}</p>
        </div>
      ) : null}
    </div>
  )
}
