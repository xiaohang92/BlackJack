import { dealerChartKey, handTotal, isPair, rankValue } from './hand'
import type { Card, PlayerAction, PlayerHand, RulesConfig } from './types'

export type StrategyAction = PlayerAction

const HARD: Record<number, Record<string, StrategyAction>> = {
  21: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  20: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  19: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  18: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  17: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  16: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  15: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  14: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  13: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  12: { '2': 'hit', '3': 'hit', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  11: { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'double', A: 'double' },
  10: { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'hit', A: 'hit' },
  9: { '2': 'hit', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  8: { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  7: { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  6: { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  5: { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
}

const SOFT: Record<number, Record<string, StrategyAction>> = {
  21: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  20: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  19: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'double', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  18: { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'stand', '8': 'stand', '9': 'hit', '10': 'hit', A: 'hit' },
  17: { '2': 'hit', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  16: { '2': 'hit', '3': 'hit', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  15: { '2': 'hit', '3': 'hit', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  14: { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  13: { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
}

/** Pair chart keyed by pair rank value (11 for Aces, 10 for tens). */
const PAIRS: Record<number, Record<string, StrategyAction>> = {
  11: { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'split', '9': 'split', '10': 'split', A: 'split' },
  10: { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
  9: { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'stand', '8': 'split', '9': 'split', '10': 'stand', A: 'stand' },
  8: { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'split', '9': 'split', '10': 'split', A: 'split' },
  7: { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  6: { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  5: { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'hit', A: 'hit' },
  4: { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'split', '6': 'split', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  3: { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  2: { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
}

/** Late surrender chart (basic strategy) — surrender preferred when listed. */
const SURRENDER: Record<string, Set<string>> = {
  '16': new Set(['9', '10', 'A']),
  '15': new Set(['10']),
}

function fallbackIfIllegal(
  preferred: StrategyAction,
  legal: PlayerAction[],
): StrategyAction {
  if (legal.includes(preferred)) return preferred
  if (preferred === 'double') {
    if (legal.includes('hit')) return 'hit'
    if (legal.includes('stand')) return 'stand'
  }
  if (preferred === 'split' && legal.includes('hit')) return 'hit'
  if (preferred === 'surrender') {
    if (legal.includes('hit')) return 'hit'
    if (legal.includes('stand')) return 'stand'
  }
  return legal[0] ?? 'stand'
}

export function basicStrategyAction(args: {
  hand: PlayerHand
  dealerUp: Card
  rules: RulesConfig
  legal: PlayerAction[]
  canOfferSurrender: boolean
}): StrategyAction {
  const { hand, dealerUp, rules, legal, canOfferSurrender } = args
  const dKey = dealerChartKey(dealerUp)
  const { total, soft } = handTotal(hand.cards)

  if (
    canOfferSurrender &&
    rules.lateSurrender &&
    legal.includes('surrender')
  ) {
    const surr = SURRENDER[String(total)]
    if (surr?.has(dKey)) {
      return 'surrender'
    }
  }

  if (isPair(hand.cards) && legal.includes('split')) {
    const pv = rankValue(hand.cards[0]!.rank)
    const row = PAIRS[pv]
    if (row) {
      return fallbackIfIllegal(row[dKey] ?? 'hit', legal)
    }
  }

  if (soft && total >= 13 && total <= 21) {
    const row = SOFT[total]
    if (row) {
      return fallbackIfIllegal(row[dKey] ?? 'hit', legal)
    }
  }

  const hardTotal = Math.min(21, Math.max(5, total))
  const row = HARD[hardTotal]
  if (row) {
    return fallbackIfIllegal(row[dKey] ?? 'hit', legal)
  }
  return fallbackIfIllegal('hit', legal)
}

/** Insurance is never taken under basic strategy. */
export function basicInsurance(): boolean {
  return false
}
