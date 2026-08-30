import type { Card, PlayerHand, Rank } from './types'

export function rankValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return 10
  return Number(rank)
}

export function isTenValue(rank: Rank): boolean {
  return rankValue(rank) === 10
}

export type HandTotal = {
  total: number
  soft: boolean
  busted: boolean
}

export function handTotal(cards: Card[]): HandTotal {
  let total = 0
  let aces = 0
  for (const c of cards) {
    total += rankValue(c.rank)
    if (c.rank === 'A') aces++
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  const soft = aces > 0 && total <= 21
  return { total, soft, busted: total > 21 }
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards).total === 21
}

export function isPair(cards: Card[]): boolean {
  if (cards.length !== 2) return false
  return rankValue(cards[0]!.rank) === rankValue(cards[1]!.rank)
}

export function createPlayerHand(bet: number, cards: Card[] = []): PlayerHand {
  return {
    cards,
    bet,
    fromSplit: false,
    fromSplitAces: false,
    doubled: false,
    stood: false,
    surrendered: false,
    done: false,
  }
}

export function dealerUpcardValue(upcard: Card): number {
  return rankValue(upcard.rank)
}

/** Dealer upcard key for strategy charts: 2-10 or A */
export function dealerChartKey(upcard: Card): string {
  if (upcard.rank === 'A') return 'A'
  const v = rankValue(upcard.rank)
  return String(v)
}
