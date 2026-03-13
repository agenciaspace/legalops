import { isUserTier } from '@/lib/email-aliases'
import type { EmailAliasSource, EmailDomain, UserEmailAlias, UserTier } from '@/lib/types'

type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns?: string) => any
    update?: (values: Record<string, unknown>) => any
    insert?: (values: Record<string, unknown> | Record<string, unknown>[]) => any
  }
}

export async function getUserTier(
  supabase: SupabaseLikeClient,
  userId: string
): Promise<UserTier> {
  const { data } = await supabase
    .from('account_profiles')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle()

  return isUserTier(data?.tier) ? data.tier : 'free'
}

export async function listUserEmailAliases(
  supabase: SupabaseLikeClient,
  userId: string
): Promise<UserEmailAlias[]> {
  const { data } = await supabase
    .from('user_email_aliases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  return (data ?? []) as UserEmailAlias[]
}

export async function getUserEmailAlias(
  supabase: SupabaseLikeClient,
  userId: string,
  aliasId: string
): Promise<UserEmailAlias | null> {
  const { data } = await supabase
    .from('user_email_aliases')
    .select('*')
    .eq('id', aliasId)
    .eq('user_id', userId)
    .maybeSingle()

  return (data as UserEmailAlias | null) ?? null
}

export async function getActiveEmailDomainForSource(
  supabase: SupabaseLikeClient,
  source: EmailAliasSource
): Promise<EmailDomain | null> {
  let query = supabase
    .from('email_domains')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)

  query = source === 'custom'
    ? query.eq('allow_custom', true)
    : query.eq('allow_random', true)

  const { data } = await query.maybeSingle()
  return (data as EmailDomain | null) ?? null
}
