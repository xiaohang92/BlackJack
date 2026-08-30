import { handTotal, isPair, isTenValue } from './hand'
import type { Card, PlayerAction, PlayerHand, RulesConfig } from './types'

export function canHit(hand: PlayerHand): boolean {
  if (hand.done || hand.stood || hand.surrendered || hand.doubled) return false
  if (hand.fromSplitAces) return false
  return !handTotal(hand.cards).busted && handTotal(hand.cards).total < 21
}

export function canStand(hand: PlayerHand): boolean {
  if (hand.done || hand.stood || hand.surrendered || hand.doubled) return false
  return !handTotal(hand.cards).busted
}

export function canDouble(
  hand: PlayerHand,
  rules: RulesConfig,
  bankroll: number,
): boolean {
  if (!canHit(hand)) return false
  if (hand.cards.length !== 2) return false
  if (hand.fromSplit && !rules.doubleAfterSplit) return false
  if (hand.fromSplitAces) return false
  return bankroll >= hand.bet
}

export function canSplit(
  hand: PlayerHand,
  rules: RulesConfig,
  handCount: number,
  bankroll: number,
): boolean {
  if (hand.done || hand.stood || hand.surrendered || hand.doubled) return false
  if (hand.cards.length !== 2) return false
  if (!isPair(hand.cards)) return false
  if (handCount >= rules.maxSplitHands) return false
  if (hand.fromSplitAces && !rules.resplitAces) return false
  const bothAces =
    hand.cards[0]!.rank === 'A' && hand.cards[1]!.rank === 'A'
  if (hand.fromSplit && bothAces && !rules.resplitAces) return false
  return bankroll >= hand.bet
}

export function canSurrender(
  hand: PlayerHand,
  rules: RulesConfig,
  firstAction: boolean,
): boolean {
  if (!rules.lateSurrender) return false
  if (!firstAction) return false
  if (hand.fromSplit) return false
  if (hand.cards.length !== 2) return false
  if (hand.done || hand.stood || hand.surrendered || hand.doubled) return false
  return true
}

export function legalActions(args: {
  hand: PlayerHand
  rules: RulesConfig
  handCount: number
  bankroll: number
  firstAction: boolean
}): PlayerAction[] {
  const { hand, rules, handCount, bankroll, firstAction } = args
  const actions: PlayerAction[] = []
  if (canHit(hand)) actions.push('hit')
  if (canStand(hand)) actions.push('stand')
  if (canDouble(hand, rules, bankroll)) actions.push('double')
  if (canSplit(hand, rules, handCount, bankroll)) actions.push('split')
  if (canSurrender(hand, rules, firstAction)) actions.push('surrender')
  return actions
}

export function dealerShouldHit(cards: Card[], hitSoft17: boolean): boolean {
  const total = handTotal(cards)
  if (total.busted) return false
  if (total.total < 17) return true
  if (total.total === 17 && total.soft && hitSoft17) return true
  return false
}

export function blackjackMultiplier(payout: RulesConfig['blackjackPayout']): number {
  return payout === '3:2' ? 1.5 : 1.2
}

export { isTenValue }
