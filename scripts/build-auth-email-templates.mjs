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
  ['confirmation', 'confirme seu email', 'Confirme seu email para continuar o cadastro no legalops.club.', 'Confirmar meu email', 'email', '/club/entrar'],
  ['recovery', 'uma nova senha', 'Recebemos um pedido para redefinir sua senha. Use o botão abaixo para escolher uma nova senha.', 'Redefinir minha senha', 'recovery', '/set-password?next=/community'],
  ['invite', 'seu convite chegou', 'Seu acesso ao legalops.club foi liberado. Ative sua conta, crie uma senha e complete seu perfil.', 'Ativar meu acesso', 'invite', '/set-password?next=/club/entrar'],
  ['magic_link', 'entre na comunidade', 'Use este link para acessar sua conta no legalops.club.', 'Acessar minha conta', 'magiclink', '/community'],
  ['email_change', 'confirme seu novo email', 'Confirme este endereço para atualizar o email da sua conta.', 'Confirmar novo email', 'email_change', '/community/profile'],
]
fs.mkdirSync('supabase/templates', { recursive: true })
for (const [name, title, description, actionLabel, type, next] of templates) {
  const html = context.exports.buildClubEmail({
    title, preview: description, contentHtml: `<p>${description}</p><p>Se você não fez esta solicitação, ignore esta mensagem.</p>`,
    actionLabel, actionUrl: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${encodeURIComponent(next)}`,
  })
  fs.writeFileSync(`supabase/templates/${name}.html`, html + '\n')
}
