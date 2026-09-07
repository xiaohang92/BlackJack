import { dealerChartKey, handTotal } from './hand'
import type { AdviceResult } from './illustrious18'
import type { GamePhase, PlayerAction } from './types'
import type { GameState } from './gameMachine'

const PLAY: Record<PlayerAction, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double down',
  split: 'Split',
  surrender: 'Surrender',
}

export type NextStep = {
  next: string
  best: string | null
}

export function describeNextStep(args: {
  phase: GamePhase['kind']
  advice: AdviceResult | null
  recBet: number
  game: GameState
}): NextStep {
  const { phase, advice, recBet, game } = args

  switch (phase) {
    case 'betting':
      return {
        next: 'Set a bet and press Deal to start the round.',
        best: `Suggested bet $${recBet} from the true count.`,
      }
    case 'dealing':
      return { next: 'Cards are coming out. Wait.', best: null }
    case 'insurance':
      return {
        next: 'Dealer shows an Ace. Take insurance or skip.',
        best:
          advice?.action === 'insurance'
            ? 'Take insurance. True count is +3 or higher.'
            : 'Skip insurance. True count is under +3.',
      }
    case 'blackjackCheck':
      return { next: 'Checking for blackjack. Wait.', best: null }
    case 'playerAction': {
      const hand = game.playerHands[game.activeHandIndex]
      const up = game.dealer.cards[0]
      const vs = up ? ` vs dealer ${dealerChartKey(up)}` : ''
      const total = hand ? handTotal(hand.cards) : null
      const you = total
        ? `${total.soft ? 'soft ' : ''}${total.total}${vs}`
        : 'this hand'
      if (!advice || advice.action === 'insurance' || advice.action === 'noInsurance') {
        return { next: `Your turn on ${you}.`, best: null }
      }
      const why = advice.isIndex
        ? advice.indexName ?? 'count deviation'
        : 'basic strategy'
      return {
        next: `Your turn on ${you}.`,
        best: `${PLAY[advice.action]}. ${why}.`,
      }
    }
    case 'dealerAction':
      return {
        next: 'Dealer is finishing. Wait, or press Continue.',
        best: null,
      }
    case 'payout':
      return { next: 'Paying the hand. Wait, or press Continue.', best: null }
    case 'handComplete':
      return {
        next: 'Press Next Hand to play the next round of this shoe.',
        best: null,
      }
    case 'shuffling':
      return { next: 'Shuffling a new shoe. Count goes back to 0.', best: null }
    default: {
      const _exhaustive: never = phase
      return _exhaustive
    }
  }
}
