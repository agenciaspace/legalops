import { createAdminClient } from '@/lib/supabase-admin'
import { buildClubEmail, escapeEmailHtml } from '@/lib/club-email'
import { sendClubTransactionalEmail } from '@/lib/club-email-delivery'
import { PRO_SUPPORT_EMAIL } from '@/lib/club-pro'
import { normalizeClubLocale, type ClubLocale } from '@/lib/club-locale'
import { hasActiveClubAccess } from '@/lib/community'
import { hasClubProAccess } from '@/lib/club-membership'

export function buildProNotice(kind: 'activation'|'renewal', expiresAt: string, trial: boolean, locale: ClubLocale = 'pt-BR') {
  const date = new Intl.DateTimeFormat(locale, {timeZone:'America/Sao_Paulo',dateStyle:'long',timeStyle:'short'}).format(new Date(expiresAt))
  const copy = locale === 'en' ? {
    title: kind === 'renewal' ? 'Your next Pro charge' : trial ? 'Your Pro trial is ready' : 'Your Pro period is confirmed',
    body: kind === 'renewal' ? `Your next Mercado Pago charge is scheduled for ${date}. Manage or cancel the subscription in your Mercado Pago account.` : `You can use Pro until ${date}. Update your profile, choose a job and discuss your next steps with your agent.`,
    billing:'Mercado Pago handles recurring charges after the seven-day trial. Our team verifies your subscription and each payment to update access.',
    help:`Request up to 20 minutes of help with your first task at ${PRO_SUPPORT_EMAIL}. We reply within one business day.`,
    action:kind === 'renewal' ? 'Manage my Pro' : 'Start my first task',
  } : locale === 'es' ? {
    title:kind === 'renewal' ? 'Tu próximo cobro de Pro' : trial ? 'Tu prueba de Pro está lista' : 'Tu período de Pro está confirmado',
    body:kind === 'renewal' ? `Mercado Pago prevé tu próximo cobro para ${date}. Gestiona o cancela la suscripción en tu cuenta de Mercado Pago.` : `Puedes usar Pro hasta ${date}. Actualiza tu perfil, elige una vacante y conversa con tu agente sobre tus próximos pasos.`,
    billing:'Mercado Pago realiza los cobros recurrentes después de los siete días de prueba. Nuestro equipo verifica la suscripción y cada pago para actualizar el acceso.',
    help:`Pide hasta 20 minutos de ayuda para tu primera tarea en ${PRO_SUPPORT_EMAIL}. Respondemos en un día hábil.`,
    action:kind === 'renewal' ? 'Gestionar mi Pro' : 'Empezar mi primera tarea',
  } : {
    title:kind === 'renewal' ? 'Sua próxima cobrança do Pro' : trial ? 'Seu teste do Pro está pronto' : 'Seu período do Pro está confirmado',
    body:kind === 'renewal' ? `O Mercado Pago prevê sua próxima cobrança para ${date}. Gerencie ou cancele a assinatura na sua conta do Mercado Pago.` : `Você pode usar o Pro até ${date}. Revise seu perfil, escolha uma oportunidade e converse com seu agente sobre os próximos passos.`,
    billing:'O Mercado Pago faz as cobranças recorrentes após os sete dias de teste. Nossa equipe confere a assinatura e cada pagamento para atualizar seu acesso.',
    help:`Peça ajuda de até 20 minutos para sua primeira tarefa em ${PRO_SUPPORT_EMAIL}. Respondemos em até um dia útil.`,
    action:kind === 'renewal' ? 'Gerenciar meu Pro' : 'Começar minha primeira tarefa',
  }
  const actionUrl = kind === 'renewal' ? 'https://legalops.club/club/checkout' : 'https://legalops.club/community/pro'
  return {subject:`${copy.title} | legalops.club`,textBody:`${copy.body}\n\n${copy.billing}\n\n${copy.help}\n\n${actionUrl}`,
    htmlBody:buildClubEmail({locale,title:copy.title,preview:copy.body,contentHtml:[copy.body,copy.billing,copy.help].map(text=>`<p>${escapeEmailHtml(text)}</p>`).join(''),actionLabel:copy.action,actionUrl})}
}

export async function deliverProNotices() {
  const admin = createAdminClient()
  const {data:notices,error} = await admin.rpc('claim_club_pro_notices',{batch_size:3})
  if(error) throw new Error('Pro notice queue unavailable')
  const results = []
  for(const notice of notices ?? []) {
    try {
      const [{data:subscription,error:subscriptionError},{data:account,error:accountError},{data:profile,error:profileError},{data:member,error:memberError}] = await Promise.all([
        admin.from('club_pro_subscriptions').select('state,next_charge_at').eq('user_id',notice.user_id).maybeSingle(),
        admin.auth.admin.getUserById(notice.user_id),
        admin.from('account_profiles').select('preferred_locale').eq('user_id',notice.user_id).maybeSingle(),
        admin.from('community_members').select('club_access_status,club_access_expires_at,club_pro_status,club_pro_expires_at').eq('user_id',notice.user_id).maybeSingle(),
      ])
      if(subscriptionError || accountError || profileError || memberError) throw new Error('Pro notice recipient unavailable')
      if(!hasActiveClubAccess(member) || !hasClubProAccess(member) || !subscription || subscription.state==='canceled' || new Date(subscription.next_charge_at).getTime()!==new Date(notice.access_expires_at).getTime() || new Date(notice.access_expires_at).getTime()<=Date.now() || !account.user?.email) {
        const {error:skipError}=await admin.from('club_pro_notices').update({status:'skipped'}).eq('id',notice.id).eq('status','sending')
        if(skipError)throw new Error('Pro notice save failed')
        results.push('skipped');continue
      }
      const message = buildProNotice(notice.kind,notice.access_expires_at,subscription.state==='trial',normalizeClubLocale(profile?.preferred_locale))
      const sent = await sendClubTransactionalEmail({...message,to:[account.user.email],replyTo:PRO_SUPPORT_EMAIL,idempotencyKey:`club-pro/${notice.id}`})
      const {error:markError} = await admin.from('club_pro_notices').update({status:'sent',sent_at:new Date().toISOString(),message_id:sent.messageId}).eq('id',notice.id).eq('status','sending')
      if(markError)throw new Error('Pro notice save failed')
      results.push('sent')
    } catch {
      // Operators check the mailbox before retrying an ambiguous delivery.
      await admin.from('club_pro_notices').update({status:'failed'}).eq('id',notice.id).eq('status','sending')
      results.push('failed')
    }
  }
  return {processed:results.length,sent:results.filter(x=>x==='sent').length,failed:results.filter(x=>x==='failed').length}
}
