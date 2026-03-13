import {
  generateRandomEmailLocalPart,
  getAliasCreationError,
  sortEmailAliases,
} from '@/lib/email-aliases'
import {
  getActiveEmailDomainForSource,
  getUserTier,
  listUserEmailAliases,
} from '@/lib/email-alias-store'
import type { PipelineStatus, UserEmailAlias } from '@/lib/types'

const RANDOM_ALIAS_ATTEMPTS = 5

type SupabaseLikeClient = {
  from: (table: string) => any
}

export function pipelineStatusUsesApplicationAlias(status: PipelineStatus): boolean {
  return status === 'applied' || status === 'interview' || status === 'offer'
}

export function pickPreferredApplicationAlias(aliases: UserEmailAlias[]): UserEmailAlias | null {
  const activeAliases = sortEmailAliases(aliases).filter(alias => alias.status === 'active')
  return activeAliases[0] ?? null
}

export async function ensureUserApplicationAlias(
  supabase: SupabaseLikeClient,
  userId: string
): Promise<UserEmailAlias> {
  const existingAlias = pickPreferredApplicationAlias(
    await listUserEmailAliases(supabase as never, userId)
  )

  if (existingAlias) {
    return existingAlias
  }

  const [tier, domain] = await Promise.all([
    getUserTier(supabase as never, userId),
    getActiveEmailDomainForSource(supabase as never, 'random'),
  ])

  const creationError = getAliasCreationError({
    tier,
    source: 'random',
    activeAliasCount: 0,
  })

  if (creationError) {
    throw new Error(creationError)
  }

  if (!domain) {
    throw new Error('No active email alias domain is configured.')
  }

  for (let attempt = 0; attempt < RANDOM_ALIAS_ATTEMPTS; attempt += 1) {
    const { data: alias, error } = await supabase
      .from('user_email_aliases')
      .insert({
        user_id: userId,
        domain_id: domain.id,
        local_part: generateRandomEmailLocalPart(),
        source: 'random',
        status: 'active',
        is_primary: true,
        provider: 'brevo',
        metadata: {
          provisioning: 'application-auto',
        },
      })
      .select('*')
      .single()

    if (!error && alias) {
      return alias as UserEmailAlias
    }

    if (error?.code === '23505') {
      continue
    }

    throw new Error(error?.message ?? 'Failed to provision application email alias.')
  }

  throw new Error('Failed to provision a unique application email alias.')
}
