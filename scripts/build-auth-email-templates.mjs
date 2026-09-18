// Keep Supabase SMTP templates on the same email shell as application messages.
import fs from 'node:fs'
import ts from 'typescript'
import vm from 'node:vm'
const output = ts.transpileModule(fs.readFileSync('lib/club-email.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const context = { exports: {} }
vm.runInNewContext(output, context)
const templates = [
  ['confirmation','email','/club/entrar',
    ['confirme seu email','Confirme seu email para continuar o cadastro no legalops.club.','Confirmar meu email'],
    ['confirm your email','Confirm your email to continue signing up for legalops.club.','Confirm my email'],
    ['confirma tu email','Confirma tu email para continuar el registro en legalops.club.','Confirmar mi email']],
  ['recovery','recovery','/set-password?next=/community',
    ['uma nova senha','Recebemos um pedido para redefinir sua senha. Use o botão abaixo para escolher uma nova senha.','Redefinir minha senha'],
    ['a new password','We received a request to reset your password. Use the button below to choose a new password.','Reset my password'],
    ['una nueva contraseña','Recibimos una solicitud para restablecer tu contraseña. Usa el botón para elegir una nueva.','Restablecer mi contraseña']],
  ['invite','invite','/set-password?next=/club/entrar',
    ['seu convite chegou','Seu acesso ao legalops.club foi liberado. Ative sua conta, crie uma senha e complete seu perfil.','Ativar meu acesso'],
    ['your invitation is here','Your access to legalops.club has been approved. Activate your account, create a password and complete your profile.','Activate my access'],
    ['tu invitación ha llegado','Tu acceso a legalops.club ha sido aprobado. Activa tu cuenta, crea una contraseña y completa tu perfil.','Activar mi acceso']],
  ['magic_link','magiclink','/community',
    ['entre na comunidade','Use este link para acessar sua conta no legalops.club.','Acessar minha conta'],
    ['enter the community','Use this link to access your legalops.club account.','Access my account'],
    ['entra en la comunidad','Usa este enlace para acceder a tu cuenta de legalops.club.','Acceder a mi cuenta']],
  ['email_change','email_change','/community/profile',
    ['confirme seu novo email','Confirme este endereço para atualizar o email da sua conta.','Confirmar novo email'],
    ['confirm your new email','Confirm this address to update the email on your account.','Confirm new email'],
    ['confirma tu nuevo email','Confirma esta dirección para actualizar el email de tu cuenta.','Confirmar nuevo email']],
]
fs.mkdirSync('supabase/templates', { recursive: true })
for (const [name, type, next, pt, en, es] of templates) {
  const render = (locale, [title, description, actionLabel]) => context.exports.buildClubEmail({
    locale, title, preview: description, contentHtml: `<p>${description}</p>`, actionLabel,
    actionUrl: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${encodeURIComponent(next)}`,
  })
  const html = `{{ if eq .Data.locale "en" }}${render('en', en)}{{ else if eq .Data.locale "es" }}${render('es', es)}{{ else }}${render('pt-BR', pt)}{{ end }}`
  fs.writeFileSync(`supabase/templates/${name}.html`, html + '\n')
}
