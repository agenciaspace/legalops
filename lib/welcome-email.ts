import { createAdminClient } from '@/lib/supabase-admin'
import { buildClubEmail, escapeEmailHtml } from '@/lib/club-email'
import { sendClubTransactionalEmail } from '@/lib/club-email-delivery'
import { sendCloudflareTransactionalEmail } from '@/lib/cloudflare-email'
import { hasActiveClubAccess } from '@/lib/community'

const ACCOUNT_WELCOME_SUBJECT = 'Sua conta LegalOps está pronta'
const CLUB_WELCOME_SUBJECT = 'Bem-vindo ao LegalOps Club'
const CLUB_INVITATION_SUBJECT = 'Seu convite para o LegalOps Club'
const SIGNUP_CONFIRMATION_SUBJECT = 'Confirme seu email no LegalOps Club'

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
  const htmlBody = buildClubEmail({
    title: 'seu convite chegou', preview: 'Ative sua conta e entre na comunidade legalops.club.',
    contentHtml: '<p>Olá!</p><p>Seu acesso ao legalops.club foi liberado. Ative sua conta, crie uma senha e complete seu perfil para participar das conversas.</p>',
    actionLabel: 'Ativar meu acesso', actionUrl: actionLink,
  })
  return sendClubTransactionalEmail({
    to: [email],
    subject: CLUB_INVITATION_SUBJECT,
    textBody,
    htmlBody,
  })
}

export async function sendSignupConfirmationEmail({ email, confirmationLink }: { email: string; confirmationLink: string }) {
  const textBody = [
    'Confirme seu email para concluir seu cadastro no LegalOps Club.',
    '',
    confirmationLink,
    '',
    'Se você não criou esta conta, ignore esta mensagem.',
  ].join('\n')
  const htmlBody = buildClubEmail({
    title: 'confirme seu email', preview: 'Falta só confirmar seu email para continuar o cadastro.',
    contentHtml: '<p>Confirme seu email para continuar o cadastro no legalops.club.</p><p>Depois, complete seu perfil para conhecer outros profissionais e participar das conversas.</p>',
    actionLabel: 'Confirmar meu email', actionUrl: confirmationLink,
  })

  return sendCloudflareTransactionalEmail({
    to: [email],
    subject: SIGNUP_CONFIRMATION_SUBJECT,
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
    'Complete seu perfil para entrar na comunidade gratuita: https://legalops.club/club/entrar',
    'Comunidade: https://legalops.club',
    'Builds: https://legalops.dev',
    '',
    `Este email foi enviado para ${email}.`,
    'Se você não criou esta conta, responda a esta mensagem.',
  ].join('\n')

  return {
    subject: ACCOUNT_WELCOME_SUBJECT,
    textBody,
    htmlBody: buildClubEmail({
      title: 'sua conta está pronta', preview: 'Complete seu perfil e encontre sua comunidade.',
      contentHtml: `<p>Olá!</p><p>Você já tem uma conta no ecossistema legalops. Agora, complete seu perfil para entrar na comunidade gratuita.</p><p>Encontre pessoas, conversas e referências para os desafios do trabalho jurídico.</p><p style="font-size:13px">Conta: ${escapeEmailHtml(email)}</p>`,
      actionLabel: 'Completar meu perfil', actionUrl: 'https://legalops.club/club/entrar',
    }),
  }
}

function buildClubWelcomeEmail(email: string, displayName?: string | null, whatsappInviteUrl?: string | null) {
  const greeting = displayName?.trim() ? `Olá, ${displayName.trim()}!` : 'Olá!'

  const textBody = [
    greeting,
    '',
    'Seu acesso à comunidade legalops.club está ativo. Participe das conversas, encontre outros profissionais e acompanhe os encontros.',
    '',
    'Com o seu acesso você pode:',
    '- Apresentar-se e participar dos espaços por tema (IA & automação, contratos & CLM, dados & métricas, processos & projetos, estratégia & maturidade e mais);',
    '- Acompanhar eventos e o calendário do Club;',
    '- Aparecer no diretório de membros.',
    '',
    'Primeiros passos:',
    '1. Complete seu perfil público: https://legalops.club/community/profile',
    '2. Apresente-se no espaço Apresentações: https://legalops.club/community',
    whatsappInviteUrl ? `3. Entre na comunidade do WhatsApp: ${whatsappInviteUrl}` : '3. Encontre o link do WhatsApp na página inicial da comunidade.',
    '',
    'Quer ajuda para acompanhar os assuntos, oportunidades e projetos do seu interesse? Conheça o agente pessoal do Club Pro: https://legalops.club/club/checkout',
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
    htmlBody: buildClubEmail({
      title: 'bem-vindo à comunidade', preview: 'Seu acesso está ativo. Apresente-se e entre nas conversas.',
      contentHtml: `<p>${escapeEmailHtml(greeting)}</p><p>Seu acesso ao legalops.club está ativo. Troque experiências com quem vive os mesmos desafios do jurídico.</p><p>Para começar:</p><ol style="padding-left:20px"><li><a href="https://legalops.club/community/profile" style="color:#111111">Complete seu perfil</a> para que as pessoas conheçam você.</li><li>Apresente-se e participe das conversas por tema.</li><li>Acompanhe os próximos encontros no calendário.</li></ol>${whatsappInviteUrl ? `<p><a href="${escapeHtmlAttribute(whatsappInviteUrl)}" style="color:#111111">Entrar na comunidade do WhatsApp</a></p>` : ''}<p style="font-size:13px">Conta: ${escapeEmailHtml(email)}</p>`,
      actionLabel: 'Entrar na comunidade', actionUrl: 'https://legalops.club/community',
    }),
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
  const result = await sendClubTransactionalEmail({
    idempotencyKey: `account-welcome/${user.id}`,
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

  const { data: config, error: configError } = await admin
    .from('club_launch_config').select('whatsapp_invite_url').eq('id', true).maybeSingle()
  if (configError) throw configError
  const invite = config?.whatsapp_invite_url
  const whatsappInviteUrl = typeof invite === 'string' && /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(invite) ? invite : null
  const message = buildClubWelcomeEmail(email, member.display_name, whatsappInviteUrl)
  const result = await sendClubTransactionalEmail({
    idempotencyKey: `club-welcome/${user.id}`,
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
