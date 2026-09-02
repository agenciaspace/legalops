export const CLUB_PIX_KEY = 'leonhatori@gmail.com'
export const CLUB_PIX_KEY_TYPE = 'email'
export const CLUB_PROOF_EMAIL = 'leonhatori@gmail.com'

export function buildClubProofMailto(amount: number) {
  const subject = 'Comprovante PIX — legalops.club'
  const body = [
    'Olá, Leon.',
    '',
    `Fiz o PIX de R$ ${amount.toLocaleString('pt-BR')} para entrar no legalops.club.`,
    '',
    'Nome:',
    'Email para acesso:',
    '',
    'Vou anexar o comprovante a esta mensagem.',
  ].join('\n')

  return `mailto:${CLUB_PROOF_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
