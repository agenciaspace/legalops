export type ClubLaunchTier = {
  id: 'founder_199' | 'founder_299' | 'pioneer_499' | 'launch_699'
  name: string
  memberFrom: number
  memberTo: number
  annualPrice: number
  highlight?: boolean
}

export const CLUB_LAUNCH_TIERS: ClubLaunchTier[] = [
  { id: 'founder_199', name: 'Fundadores', memberFrom: 1, memberTo: 50, annualPrice: 199, highlight: true },
  { id: 'founder_299', name: 'Early members', memberFrom: 51, memberTo: 100, annualPrice: 299 },
  { id: 'pioneer_499', name: 'Pioneiros', memberFrom: 101, memberTo: 200, annualPrice: 499 },
  { id: 'launch_699', name: 'Lançamento', memberFrom: 201, memberTo: 380, annualPrice: 699 },
]

export function getTierCapacity(tier: ClubLaunchTier) {
  return tier.memberTo - tier.memberFrom + 1
}

export function getTierRevenue(tier: ClubLaunchTier) {
  return getTierCapacity(tier) * tier.annualPrice
}

export const CLUB_LAUNCH_REVENUE = CLUB_LAUNCH_TIERS.reduce(
  (total, tier) => total + getTierRevenue(tier),
  0,
)

export const CLUB_LAUNCH_MEMBER_GOAL = CLUB_LAUNCH_TIERS.at(-1)?.memberTo ?? 0

export function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}
