import type { EmailAliasSource, UserEmailAlias, UserTier } from '@/lib/types'

export interface EmailTierPolicy {
  tier: UserTier
  maxActiveAliases: number
  allowsRandomAliases: boolean
  allowsCustomAliases: boolean
}

export const EMAIL_TIER_POLICIES: Record<UserTier, EmailTierPolicy> = {
  free: {
    tier: 'free',
    maxActiveAliases: 1,
    allowsRandomAliases: true,
    allowsCustomAliases: false,
  },
  paid: {
    tier: 'paid',
    maxActiveAliases: 10,
    allowsRandomAliases: true,
    allowsCustomAliases: true,
  },
}

const LOCAL_PART_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/
const RESERVED_LOCAL_PARTS = new Set([
  'admin',
  'billing',
  'help',
  'info',
  'legalops',
  'mail',
  'no-reply',
  'noreply',
  'postmaster',
  'root',
  'security',
  'support',
])
const RANDOM_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

export function isUserTier(value: unknown): value is UserTier {
  return value === 'free' || value === 'paid'
}

export function isEmailAliasSource(value: unknown): value is EmailAliasSource {
  return value === 'random' || value === 'custom'
}

export function getEmailTierPolicy(tier: UserTier): EmailTierPolicy {
  return EMAIL_TIER_POLICIES[tier]
}

export function getRemainingAliasSlots(tier: UserTier, activeAliasCount: number): number {
  return Math.max(0, getEmailTierPolicy(tier).maxActiveAliases - activeAliasCount)
}

export function getAliasCreationError(args: {
  tier: UserTier
  source: EmailAliasSource
  activeAliasCount: number
}): string | null {
  const policy = getEmailTierPolicy(args.tier)

  if (args.activeAliasCount >= policy.maxActiveAliases) {
    return `Your ${args.tier} tier supports up to ${policy.maxActiveAliases} active email alias${policy.maxActiveAliases === 1 ? '' : 'es'}.`
  }

  if (args.source === 'custom' && !policy.allowsCustomAliases) {
    return 'Custom email aliases are available on paid tiers only.'
  }

  if (args.source === 'random' && !policy.allowsRandomAliases) {
    return 'Random email aliases are not available for this tier.'
  }

  return null
}

export function normalizeEmailLocalPart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/[._-]{2,}/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
}

export function validateCustomEmailLocalPart(value: string): string | null {
  const normalized = normalizeEmailLocalPart(value)

  if (!normalized) {
    return 'Custom email alias is required.'
  }

  if (normalized.length < 3) {
    return 'Custom email alias must have at least 3 characters.'
  }

  if (normalized.length > 32) {
    return 'Custom email alias must have at most 32 characters.'
  }

  if (!LOCAL_PART_REGEX.test(normalized)) {
    return 'Custom email alias can only include letters, numbers, dots, hyphens, and underscores.'
  }

  if (RESERVED_LOCAL_PARTS.has(normalized)) {
    return 'This email alias is reserved.'
  }

  return null
}

function randomIndex(max: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    return values[0] % max
  }

  return Math.floor(Math.random() * max)
}

export function generateRandomEmailLocalPart(args: {
  length?: number
  prefix?: string
  randomIndexes?: number[]
} = {}): string {
  const length = Math.max(6, Math.min(24, args.length ?? 10))
  const prefix = normalizeEmailLocalPart(args.prefix ?? 'lo')
  let suffix = ''

  for (let index = 0; index < length; index += 1) {
    const forcedValue = args.randomIndexes?.[index]
    const alphabetIndex =
      typeof forcedValue === 'number'
        ? Math.abs(forcedValue) % RANDOM_ALPHABET.length
        : randomIndex(RANDOM_ALPHABET.length)

    suffix += RANDOM_ALPHABET[alphabetIndex]
  }

  return `${prefix}-${suffix}`
}

export function sortEmailAliases<T extends Pick<UserEmailAlias, 'status' | 'is_primary' | 'created_at'>>(
  aliases: T[]
): T[] {
  return [...aliases].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1
    }

    if (left.is_primary !== right.is_primary) {
      return left.is_primary ? -1 : 1
    }

    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  })
}
