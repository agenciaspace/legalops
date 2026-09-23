'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClubLanguage } from './ClubLanguage'
import { TranslatedContent } from './TranslatedContent'
import { clubTranslator, type ClubLocale } from '@/lib/club-locale'
import type { TranslationSource } from '@/lib/club-translations'
import type { WhatsAppDigest, WhatsAppSchedule } from '@/lib/whatsapp-summary'
const date = (value: string, locale: ClubLocale = 'pt-BR') => new Intl.DateTimeFormat(locale,{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(new Date(value))
export function summaryAvailability(schedule: WhatsAppSchedule | null, now: number, locale: ClubLocale = 'pt-BR') {
  const t = clubTranslator(locale)
  if (!schedule?.enabled) return t("Programação em preparação.")
  if (schedule.last_status === 'error') return t("O resumo está atrasado. Uma nova tentativa será feita automaticamente.")
  if (new Date(schedule.next_run_at).getTime() <= now) return t("Resumo em preparação. Ele aparecerá aqui assim que a geração terminar.")
  return t('Próximo resumo: {date} (Brasília).', {date:date(schedule.next_run_at,locale)})
}
export function WhatsAppSummaries({summaries,schedule,unavailable,translations={},translationEnabled=false,serverLocale='pt-BR'}: {summaries: WhatsAppDigest[]; schedule: WhatsAppSchedule | null; unavailable: boolean; translations?: Record<string,TranslationSource>; translationEnabled?: boolean; serverLocale?: ClubLocale}) {
  const {locale,t} = useClubLanguage()
  const [now,setNow] = useState(Date.now)
  const router = useRouter()
  useEffect(()=>{const timer=setInterval(()=>{setNow(Date.now());router.refresh()},60000);return()=>clearInterval(timer)},[router])
  return <div className="mx-auto w-full max-w-[920px] px-4 py-5 sm:px-6 lg:px-8">
    <h1 className="text-2xl font-extrabold text-[#24231F]">{t("Resumos do WhatsApp")}</h1>
    <p className="mt-2 text-sm leading-6 text-[#68655F]">{t("As conversas do grupo legalops.club · conversa, reunidas aqui e no próprio grupo.")}</p>
    <section className="mt-5 rounded-xl border border-[#FFD6C7] bg-[#FFF6F1] p-5" aria-live="polite">
      <h2 className="text-sm font-bold">{t("Todos os dias, a partir das 18h (Brasília)")}</h2>
      <p className="mt-2 text-sm">{unavailable ? t('Não foi possível consultar a programação. Tente novamente em instantes.') : summaryAvailability(schedule,now,locale)}</p>
      <p className="mt-2 text-xs leading-5 text-[#68655F]">{t("Cada edição cobre as 24 horas anteriores às 18h. A geração pode levar alguns minutos. Sem conteúdo substantivo, não há edição nem envio ao grupo.")}</p>
      {schedule?.last_status === 'empty' && <p className="mt-2 text-xs">{t("Último período verificado: nenhuma conversa substantiva para resumir.")}</p>}
    </section>
    {!summaries.length && !unavailable && <p className="mt-6 text-sm text-[#68655F]">{t("O primeiro resumo será publicado após o horário indicado acima, se houver mensagens no período.")}</p>}
    <div className="mt-5 space-y-4">{summaries.map(item=><article key={item.id} className="break-words rounded-xl border border-[#E1E1DD] bg-white p-5 sm:p-6">
      <p className="text-xs text-[#77746E]">{date(item.period_start,locale)} a {date(item.period_end,locale)} · Brasília</p>
      <div className="mt-3"><TranslatedContent source={translations[`whatsapp_summary:${item.id}`]} original={{title:item.title,summary:item.summary,key_points:item.key_points}} enabled={translationEnabled} serverLocale={serverLocale} /></div>
      <p className="mt-4 border-t pt-3 text-xs leading-5 text-[#77746E]">{item.source_message_count} {t('mensagens')} · {item.source_participant_count} {t('participantes')} · {t('Síntese por IA')}{item.omitted_media_count > 0 ? ` · ${t('{n} mídias sem texto ou transcrição não analisadas',{n:item.omitted_media_count})}` : ''}</p>
      <p className="mt-1 text-xs text-[#77746E]">{item.whatsapp_sent_at ? t('Enviado também ao grupo.') : t('Disponível no app; envio ao grupo pendente.')}</p>
    </article>)}</div>
  </div>
}
