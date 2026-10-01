export function authNextPath(value: string | null, fallback = '/community') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return fallback
  return value
}

export function authEmailError(error: { code?: string; status?: number }) {
  if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
    return 'Muitas tentativas. Aguarde alguns minutos antes de pedir outro link.'
  }
  if (error.code === 'email_address_invalid') return 'Confira se o email está correto.'
  if (error.code === 'otp_disabled' || error.code === 'user_not_found') return 'Não foi possível enviar o link. Confira o email do cadastro ou crie sua conta.'
  return 'Não conseguimos enviar o link agora. Tente novamente em alguns instantes.'
}
