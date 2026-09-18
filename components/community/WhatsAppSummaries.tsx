'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WhatsAppDigest, WhatsAppSchedule } from '@/lib/whatsapp-summary'
const date = (value: string) => new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(new Date(value))
export function summaryAvailability(schedule: WhatsAppSchedule | null, now: number) {
  if (!schedule?.enabled) return 'Programação em preparação.'
  if (schedule.last_status === 'error') return 'O resumo está atrasado. Uma nova tentativa será feita automaticamente.'
  if (new Date(schedule.next_run_at).getTime() <= now) return 'Resumo em preparação. Ele aparecerá aqui assim que a geração terminar.'
  return `Próximo resumo: ${date(schedule.next_run_at)} (Brasília).`
}
export function WhatsAppSummaries({summaries,schedule,unavailable}: {summaries: WhatsAppDigest[]; schedule: WhatsAppSchedule | null; unavailable: boolean}) {
  const [now,setNow] = useState(Date.now)
  const router = useRouter()
  useEffect(()=>{const timer=setInterval(()=>{setNow(Date.now());router.refresh()},60000);return()=>clearInterval(timer)},[router])
  return <div className="mx-auto w-full max-w-[920px] px-4 py-5 sm:px-6 lg:px-8">
    <h1 className="text-2xl font-extrabold text-[#24231F]">Resumos do WhatsApp</h1>
    <p className="mt-2 text-sm leading-6 text-[#68655F]">As conversas do grupo legalops.club · conversa, reunidas aqui e no próprio grupo.</p>
    <section className="mt-5 rounded-xl border border-[#FFD6C7] bg-[#FFF6F1] p-5" aria-live="polite">
      <h2 className="text-sm font-bold">Todos os dias, a partir das 18h (Brasília)</h2>
      <p className="mt-2 text-sm">{unavailable ? 'Não foi possível consultar a programação. Tente novamente em instantes.' : summaryAvailability(schedule,now)}</p>
      <p className="mt-2 text-xs leading-5 text-[#68655F]">Cada edição cobre as 24 horas anteriores às 18h. A geração pode levar alguns minutos. Sem novas mensagens, não há edição nem envio ao grupo.</p>
      {schedule?.last_status === 'empty' && <p className="mt-2 text-xs">Último período verificado: nenhuma mensagem disponível para resumir.</p>}
    </section>
    {!summaries.length && !unavailable && <p className="mt-6 text-sm text-[#68655F]">O primeiro resumo será publicado após o horário indicado acima, se houver mensagens no período.</p>}
    <div className="mt-5 space-y-4">{summaries.map(item=><article key={item.id} className="break-words rounded-xl border border-[#E1E1DD] bg-white p-5 sm:p-6">
      <p className="text-xs text-[#77746E]">{date(item.period_start)} a {date(item.period_end)} · Brasília</p>
      <h2 className="mt-3 text-lg font-extrabold">{item.title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#68655F]">{item.summary}</p>
      {!!item.key_points.length && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">{item.key_points.map((point,i)=><li key={i}>{point}</li>)}</ul>}
      <p className="mt-4 border-t pt-3 text-xs leading-5 text-[#77746E]">{item.source_message_count} mensagens · {item.source_participant_count} participantes · Síntese por IA{item.omitted_media_count > 0 ? ` · ${item.omitted_media_count} mídias sem texto ou transcrição não analisadas` : ''}</p>
      <p className="mt-1 text-xs text-[#77746E]">{item.whatsapp_sent_at ? 'Enviado também ao grupo.' : 'Disponível no app; envio ao grupo pendente.'}</p>
    </article>)}</div>
  </div>
}
