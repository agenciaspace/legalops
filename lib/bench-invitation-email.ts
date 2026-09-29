import { buildClubEmail, escapeEmailHtml } from '@/lib/club-email'

export const BENCH_EVENT_SLUG = 'bench-honorarios-exito-2026'
export const BENCH_EVENT_URL = `https://legalops.club/community/events/${BENCH_EVENT_SLUG}`
export const BENCH_TIME_ZONE = 'America/Sao_Paulo'
export const BENCH_TEST_RECIPIENT = 'leonhatori@gmail.com'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BENCH_TIME_ZONE,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BENCH_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function upperFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function buildBenchInvitationEmail({
  title,
  startsAt,
  test = false,
}: {
  title: string
  startsAt: string
  test?: boolean
}) {
  const parsed = new Date(startsAt)
  if (Number.isNaN(parsed.getTime())) throw new Error('Bench event start date is invalid.')

  const eventTitle = title.trim() || 'Bench de honorários de êxito'
  const dateLabel = upperFirst(dateFormatter.format(parsed))
  const timeLabel = timeFormatter.format(parsed)
  const subject = `${test ? '[TESTE] ' : ''}Convite oficial · ${eventTitle}`
  const preview = `${dateLabel}, às ${timeLabel} (horário de Brasília).`
  const textBody = [
    test ? 'TESTE DO CONVITE — não encaminhado às pessoas inscritas.' : '',
    'Olá!',
    '',
    `Sua inscrição está confirmada para o ${eventTitle}.`,
    '',
    `${dateLabel}, às ${timeLabel} (horário de Brasília)`,
    'Formato remoto',
    '',
    'O link de acesso será enviado ao email informado na inscrição antes do encontro.',
    '',
    `Detalhes do encontro: ${BENCH_EVENT_URL}`,
  ].filter((line, index, lines) => !(line === '' && index === 1 && lines[0] === '')).join('\n')

  const testNotice = test
    ? '<p style="padding:12px 14px;background:#FFF1E8;border:1px solid #E88A6A;border-radius:8px;color:#6B3524"><strong>Teste do convite.</strong> Este email não foi encaminhado às pessoas inscritas.</p>'
    : ''
  const htmlBody = buildClubEmail({
    title: 'Convite oficial',
    preview,
    contentHtml: `${testNotice}<p>Olá!</p><p>Sua inscrição está confirmada para o <strong>${escapeEmailHtml(eventTitle)}</strong>.</p><p style="margin:24px 0;padding:18px;border-left:4px solid #E88A6A;background:#F5F1E8"><strong>${escapeEmailHtml(dateLabel)}</strong><br>${escapeEmailHtml(timeLabel)} · horário de Brasília<br>Formato remoto</p><p>O link de acesso será enviado ao email informado na inscrição antes do encontro.</p>`,
    actionLabel: 'Ver detalhes do encontro',
    actionUrl: BENCH_EVENT_URL,
  })

  return { subject, preview, textBody, htmlBody }
}
