import type { ClubLocale } from './club-locale'
/** Shared, table-based email shell. Content is assembled by trusted templates only. */
export function escapeEmailHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function buildClubEmail({ title, preview, contentHtml, actionLabel, actionUrl, locale = 'pt-BR' }: {
  title: string; preview: string; contentHtml: string; actionLabel: string; actionUrl: string; locale?: ClubLocale
}) {
  const escape = escapeEmailHtml
  const labels = locale === 'en'
    ? ['community · people · conversations', 'community', 'jobs', 'legalops.club — connect with people facing the same challenges in legal work.', 'If you did not request this email, you can ignore it.']
    : locale === 'es'
      ? ['comunidad · personas · conversaciones', 'comunidad', 'empleos', 'legalops.club — conecta con quienes viven los mismos desafíos del trabajo jurídico.', 'Si no solicitaste este email, puedes ignorarlo.']
      : ['comunidade · pessoas · conversas', 'comunidade', 'vagas', 'legalops.club — troque com quem vive os mesmos problemas do jurídico.', 'Se você não solicitou este email, pode ignorá-lo.']
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(title)}</title>
<style>@media only screen and (max-width:480px){.email-padding{padding:24px 20px!important}.email-heading{font-size:28px!important}.email-wrap{padding:12px 8px!important}}</style></head>
<body style="margin:0;padding:0;background-color:#F5F1E8;color:#111111;font-family:Inter,Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;color:#F5F1E8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escape(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F1E8"><tr><td class="email-wrap" align="center" style="padding:32px 16px">
<!--[if mso]><table role="presentation" width="600"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
<tr><td class="email-padding" style="padding:24px 32px 28px;border-bottom:1px solid #CEC8BD">
<a href="https://legalops.club" style="text-decoration:none"><img src="https://legalops.club/brand/legalops-club-email.png" width="220" alt="legalops.club" border="0" style="display:block;width:220px;max-width:100%;height:auto;color:#111111;font-size:28px;font-weight:bold"></a>
<p style="margin:12px 0 0;color:#69635E;font-size:11px;line-height:18px;letter-spacing:2px;text-transform:uppercase">${labels[0]}</p></td></tr>
<tr><td class="email-padding" bgcolor="#FAF7F1" style="padding:36px 32px;background-color:#FAF7F1">
<h1 class="email-heading" style="margin:0 0 24px;font-family:Quicksand,Arial,Helvetica,sans-serif;font-size:34px;line-height:1.2;letter-spacing:-1px;font-weight:600;color:#111111">${escape(title)}<span style="color:#E88A6A">.</span></h1>
<div style="font-size:16px;line-height:26px;color:#69635E;overflow-wrap:anywhere">${contentHtml}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px"><tr><td bgcolor="#111111" style="background-color:#111111;border-radius:8px;mso-padding-alt:16px 24px"><a href="${escape(actionUrl)}" style="display:inline-block;padding:16px 24px;font-size:15px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;border:1px solid #111111;border-radius:8px">${escape(actionLabel)}</a></td></tr></table>
</td></tr>
<tr><td class="email-padding" style="padding:28px 32px;border-top:1px solid #CEC8BD">
<p style="margin:0 0 12px;font-size:13px;line-height:24px"><a href="https://legalops.club/community" style="color:#111111;text-decoration:underline">${labels[1]}</a> &nbsp;·&nbsp; <a href="https://legalops.work" style="color:#111111;text-decoration:underline">${labels[2]}</a> &nbsp;·&nbsp; <a href="https://legalops.dev" style="color:#111111;text-decoration:underline">open source</a></p>
<p style="margin:0;font-size:12px;line-height:20px;color:#817A73">${labels[3]}</p>
<p style="margin:12px 0 0;font-size:12px;line-height:20px;color:#817A73">${labels[4]}</p>
</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`
}
