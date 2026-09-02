import { createAdminClient } from '@/lib/supabase-admin'
import { buildHtmlEmail } from '@/lib/brevo'
import { sendCloudflareTransactionalEmail } from '@/lib/cloudflare-email'
import { hasActiveClubAccess } from '@/lib/community'

const ACCOUNT_WELCOME_SUBJECT = 'Sua conta LegalOps está pronta'
const CLUB_WELCOME_SUBJECT = 'Bem-vindo ao LegalOps Club'
const CLUB_INVITATION_SUBJECT = 'Seu convite para o LegalOps Club'

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendClubInvitationEmail({ email, actionLink }: { email: string; actionLink: string }) {
  const textBody = [
    'Olá!',
    '',
    'Seu acesso ao LegalOps Club foi liberado.',
    'Use o link abaixo para ativar a conta, criar sua senha e montar o perfil que será usado nas vagas e currículos personalizados:',
    '',
    actionLink,
    '',
    'Se você não esperava este convite, ignore esta mensagem.',
  ].join('\n')
  const htmlBody = `${buildHtmlEmail(textBody)}<p><a href="${escapeHtmlAttribute(actionLink)}">Ativar meu acesso ao LegalOps Club</a></p>`
  return sendCloudflareTransactionalEmail({
    to: [email],
    subject: CLUB_INVITATION_SUBJECT,
    textBody,
    htmlBody,
  })
}

function buildAccountWelcomeEmail(email: string) {
  const textBody = [
    'Olá!',
    '',
    'Sua conta LegalOps está pronta.',
    '',
    'Com a mesma conta, você pode usar:',
    '- legalops.work para encontrar e acompanhar oportunidades;',
    '- legalops.club para participar da comunidade e dos espaços do Club;',
    '- legalops.dev para aprender construindo sistemas para o jurídico.',
    '',
    'Comece por aqui: https://legalops.work/dashboard',
    'Comunidade: https://legalops.club',
    'Builds: https://legalops.dev',
    '',
    `Este email foi enviado para ${email}.`,
    'Se você não criou esta conta, responda a esta mensagem.',
  ].join('\n')

  return {
    subject: ACCOUNT_WELCOME_SUBJECT,
    textBody,
    htmlBody: buildHtmlEmail(textBody),
  }
}

function buildClubWelcomeEmail(email: string, displayName?: string | null) {
  const greeting = displayName?.trim() ? `Olá, ${displayName.trim()}!` : 'Olá!'

  const textBody = [
    greeting,
    '',
    'Seu acesso ao LegalOps Club está ativo. Este é o espaço da LegalOps para quem opera o jurídico: trocas por tema, eventos, resumos semanais e vagas combinadas com o seu perfil.',
    '',
    'Com o seu acesso você pode:',
    '- Apresentar-se e participar dos espaços por tema (IA & automação, contratos & CLM, dados & métricas, processos & projetos, estratégia & maturidade e mais);',
    '- Ler os resumos semanais das discussões;',
    '- Acompanhar eventos e o calendário do Club;',
    '- Receber alertas de vagas compatíveis com o seu perfil;',
    '- Aparecer no diretório de membros.',
    '',
    'Primeiros passos:',
    '1. Complete seu perfil público: https://legalops.club/community/profile',
    '2. Apresente-se no espaço Apresentações: https://legalops.club/community',
    '3. Ative os alertas de vagas no seu perfil.',
    '',
    'Comunidade: https://legalops.club',
    'Oportunidades: https://legalops.work',
    'Builds: https://legalops.dev',
    '',
    `Este email foi enviado para ${email}.`,
    'Se você não esperava este acesso, responda a esta mensagem.',
  ].join('\n')

  return {
    subject: CLUB_WELCOME_SUBJECT,
    textBody,
    htmlBody: buildHtmlEmail(textBody),
  }
}

export async function sendWelcomeEmailIfNeeded(user: { id: string; email?: string | null }) {
  const email = user.email?.trim().toLowerCase()
  if (!email) return false

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('account_profiles')
    .select('welcome_email_sent_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile || profile.welcome_email_sent_at) return false

  const message = buildAccountWelcomeEmail(email)
  const result = await sendCloudflareTransactionalEmail({
    to: [email],
    subject: message.subject,
    textBody: message.textBody,
    htmlBody: message.htmlBody,
  })

  const { data: marked, error: markError } = await admin
    .from('account_profiles')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('welcome_email_sent_at', null)
    .select('user_id')

  if (markError) throw markError

  return Boolean(marked?.length) && Boolean(result)
}

export async function sendClubWelcomeEmailIfNeeded(user: { id: string; email?: string | null }) {
  const email = user.email?.trim().toLowerCase()
  if (!email) return false

  const admin = createAdminClient()
  const { data: member, error: memberError } = await admin
    .from('community_members')
    .select('display_name, club_access_status, club_access_expires_at, club_welcome_email_sent_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberError) throw memberError
  if (!member) return false
  if (member.club_welcome_email_sent_at) return false
  if (!hasActiveClubAccess(member)) return false

  const message = buildClubWelcomeEmail(email, member.display_name)
  const result = await sendCloudflareTransactionalEmail({
    to: [email],
    subject: message.subject,
    textBody: message.textBody,
    htmlBody: message.htmlBody,
  })

  const { data: marked, error: markError } = await admin
    .from('community_members')
    .update({ club_welcome_email_sent_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('club_welcome_email_sent_at', null)
    .select('user_id')

  if (markError) throw markError

  return Boolean(marked?.length) && Boolean(result)
}
