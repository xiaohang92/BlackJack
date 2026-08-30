import type { Card, Rank } from './types'

/** Hi-Lo tag value for a rank. */
export function hiLoValue(rank: Rank): number {
  if (
    rank === '2' ||
    rank === '3' ||
    rank === '4' ||
    rank === '5' ||
    rank === '6'
  ) {
    return 1
  }
  if (rank === '7' || rank === '8' || rank === '9') return 0
  return -1
}

export function runningCountDelta(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + hiLoValue(c.rank), 0)
}

/**
 * Remaining decks rounded to nearest half-deck.
 * e.g. 4.3 → 4.5, 4.1 → 4.0, minimum 0.5 to avoid divide-by-zero.
 */
export function remainingDecksRounded(cardsLeft: number): number {
  const decks = cardsLeft / 52
  const halfDecks = Math.round(decks * 2) / 2
  return Math.max(0.5, halfDecks)
}

export function trueCount(runningCount: number, cardsLeft: number): number {
  const decks = remainingDecksRounded(cardsLeft)
  return runningCount / decks
}

/** Truncate toward zero for display / index thresholds (common casino convention). */
export function trueCountFloor(runningCount: number, cardsLeft: number): number {
  const tc = trueCount(runningCount, cardsLeft)
  return tc >= 0 ? Math.floor(tc) : Math.ceil(tc)
}
