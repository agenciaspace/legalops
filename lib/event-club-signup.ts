import { normalizeClubLocale } from '@/lib/club-locale'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEventClubSignupEmail } from '@/lib/welcome-email'

type EventClubSignupInput = {
  email: string
  name: string
  role: string
  organization: string
  eventSlug: string
  eventTitle: string
  locale?: string | null
}

export type EventClubSignupResult = {
  status: 'confirmation_sent' | 'existing_account' | 'error'
  userId?: string
  error?: string
}

function existingAccountError(error: { code?: string; message?: string; status?: number }) {
  return error.status === 422
    || ['email_exists', 'user_already_exists'].includes(error.code ?? '')
    || /already (?:been )?registered|already exists/i.test(error.message ?? '')
}

export async function requestEventClubSignup(input: EventClubSignupInput): Promise<EventClubSignupResult> {
  const admin = createAdminClient()
  const eventPath = `/community/events/${input.eventSlug}`
  const joinPath = `/club/entrar?next=${encodeURIComponent(eventPath)}`
  const passwordPath = `/set-password?next=${encodeURIComponent(joinPath)}`
  const redirectTo = `https://legalops.club/auth/confirm?next=${encodeURIComponent(passwordPath)}`
  const password = `${crypto.randomUUID()}-${crypto.randomUUID()}`
  const locale = normalizeClubLocale(input.locale)
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email: input.email,
    password,
    options: {
      redirectTo,
      data: { locale, signup_source: 'event', event_slug: input.eventSlug },
    },
  })

  if (error) {
    if (existingAccountError(error)) return { status: 'existing_account' }
    console.error('[event club signup] Could not create confirmation link:', error.code ?? error.message)
    return { status: 'error', error: error.code ?? 'signup_link_failed' }
  }
  if (!data.user || !data.properties?.action_link) return { status: 'error', error: 'missing_signup_link' }

  const { error: profileError } = await admin
    .from('account_profiles')
    .update({
      full_name: input.name,
      current_role: input.role,
      organization_name: input.organization,
      preferred_locale: locale,
    })
    .eq('user_id', data.user.id)
  if (profileError) console.error('[event club signup] Could not prefill profile:', profileError.code ?? profileError.message)

  try {
    await sendEventClubSignupEmail({
      email: input.email,
      actionLink: data.properties.action_link,
      eventTitle: input.eventTitle,
      userId: data.user.id,
    })
  } catch (deliveryError) {
    console.error('[event club signup] Could not deliver confirmation:', deliveryError)
    const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id)
    if (cleanupError) console.error('[event club signup] Could not remove undelivered account:', cleanupError.code)
    return { status: 'error', error: 'email_delivery_failed' }
  }

  return { status: 'confirmation_sent', userId: data.user.id }
}
