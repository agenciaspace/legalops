import decisions from '@/bend/decisions.generated.json'

/** Exhaustive table evaluated by Bend after proving LAWS.bend. */
export function allowsEntitlement(statusEnabled: boolean, expiryValid: boolean): boolean {
  return decisions.tables.access.values[Number(statusEnabled) * 2 + Number(expiryValid)] === 1
}
