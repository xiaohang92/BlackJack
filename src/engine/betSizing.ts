import { playerEdge } from './ev'

/**
 * Standard ramp: TC≤1 → 1u; +2→2; +3→4; +4→8; ≥5→12 (capped by maxSpread).
 */
export function spreadUnits(trueCountTrunc: number, maxSpread: number): number {
  let units: number
  if (trueCountTrunc <= 1) units = 1
  else if (trueCountTrunc === 2) units = 2
  else if (trueCountTrunc === 3) units = 4
  else if (trueCountTrunc === 4) units = 8
  else units = 12
  return Math.min(units, maxSpread)
}

export function spreadBet(
  trueCountTrunc: number,
  baseUnit: number,
  maxSpread: number,
): number {
  return spreadUnits(trueCountTrunc, maxSpread) * baseUnit
}

export function kellyBet(args: {
  bankroll: number
  trueCount: number
  fraction: number
}): number {
  const edge = playerEdge(args.trueCount)
  if (edge <= 0) return 0
  return Math.max(0, args.bankroll * edge * args.fraction)
}

export function recommendedBet(args: {
  bankroll: number
  trueCount: number
  trueCountTrunc: number
  baseUnit: number
  maxSpread: number
  useKelly: boolean
  kellyFraction: number
}): { amount: number; units: number; mode: 'spread' | 'kelly' } {
  if (args.useKelly) {
    const amount = kellyBet({
      bankroll: args.bankroll,
      trueCount: args.trueCount,
      fraction: args.kellyFraction,
    })
    // Round to nearest unit for table play
    const units =
      args.baseUnit > 0 ? Math.round(amount / args.baseUnit) : 0
    const capped = Math.min(
      Math.max(units, 0),
      args.maxSpread,
    )
    return {
      amount: capped * args.baseUnit,
      units: capped,
      mode: 'kelly',
    }
  }
  const units = spreadUnits(args.trueCountTrunc, args.maxSpread)
  return {
    amount: units * args.baseUnit,
    units,
    mode: 'spread',
  }
}
