import { basicInsurance, basicStrategyAction } from './basicStrategy'
import { dealerChartKey, handTotal, isPair } from './hand'
import type {
  Card,
  DecisionErrorKind,
  PlayerAction,
  PlayerHand,
  RulesConfig,
} from './types'

export type AdviceResult = {
  action: PlayerAction | 'insurance' | 'noInsurance'
  isIndex: boolean
  indexName?: string
}

/**
 * Illustrious 18 + Fab 4 deviations vs true count (truncated toward zero).
 * Insurance: TC >= +3
 * 16 vs 10 stand: TC >= +1
 * 15 vs 10 stand: TC >= +4 (overridden by Fab 4 surrender at TC >= 0)
 * Fab 4 surrenders as specified in the plan.
 */
export function indexAdvice(args: {
  hand: PlayerHand
  dealerUp: Card
  rules: RulesConfig
  legal: PlayerAction[]
  trueCountTrunc: number
  canOfferSurrender: boolean
  forInsurance?: boolean
}): AdviceResult {
  const {
    hand,
    dealerUp,
    rules,
    legal,
    trueCountTrunc: tc,
    canOfferSurrender,
    forInsurance,
  } = args

  if (forInsurance) {
    if (tc >= 3) {
      return { action: 'insurance', isIndex: true, indexName: 'Insurance TC≥+3' }
    }
    return { action: 'noInsurance', isIndex: false }
  }

  const dKey = dealerChartKey(dealerUp)
  const { total, soft } = handTotal(hand.cards)
  const pair = isPair(hand.cards)

  // Fab 4 — take priority when surrender is legal
  if (canOfferSurrender && legal.includes('surrender') && !soft && !pair) {
    if (total === 14 && dKey === '10' && tc >= 3) {
      return {
        action: 'surrender',
        isIndex: true,
        indexName: 'Fab4 14v10 TC≥+3',
      }
    }
    if (total === 15 && dKey === '9' && tc >= 2) {
      return {
        action: 'surrender',
        isIndex: true,
        indexName: 'Fab4 15v9 TC≥+2',
      }
    }
    if (total === 15 && dKey === '10' && tc >= 0) {
      return {
        action: 'surrender',
        isIndex: true,
        indexName: 'Fab4 15v10 TC≥+0',
      }
    }
    if (total === 15 && dKey === 'A') {
      const thresh = rules.hitSoft17 ? 1 : 2
      if (tc >= thresh) {
        return {
          action: 'surrender',
          isIndex: true,
          indexName: `Fab4 15vA TC≥+${thresh}`,
        }
      }
    }
  }

  // Illustrious 18 standing deviations (when not surrendering)
  if (!soft && !pair && legal.includes('stand')) {
    if (total === 16 && dKey === '10' && tc >= 1) {
      return { action: 'stand', isIndex: true, indexName: 'I18 16v10 TC≥+1' }
    }
    if (total === 15 && dKey === '10' && tc >= 4 && !legal.includes('surrender')) {
      return { action: 'stand', isIndex: true, indexName: 'I18 15v10 TC≥+4' }
    }
    if (
      total === 15 &&
      dKey === '10' &&
      tc >= 4 &&
      legal.includes('surrender') &&
      tc < 0
    ) {
      // unreachable with Fab4 at 0; keep for completeness when surrender off
      return { action: 'stand', isIndex: true, indexName: 'I18 15v10 TC≥+4' }
    }
  }

  const basic = basicStrategyAction({
    hand,
    dealerUp,
    rules,
    legal,
    canOfferSurrender,
  })
  return { action: basic, isIndex: false }
}

export function gradePlayerAction(args: {
  chosen: PlayerAction
  hand: PlayerHand
  dealerUp: Card
  rules: RulesConfig
  legal: PlayerAction[]
  trueCountTrunc: number
  canOfferSurrender: boolean
}): { optimal: PlayerAction; errorKind: DecisionErrorKind; isIndex: boolean } {
  const advice = indexAdvice({ ...args, forInsurance: false })
  const optimal = advice.action as PlayerAction
  const basic = basicStrategyAction(args)

  if (args.chosen === optimal) {
    return { optimal, errorKind: null, isIndex: advice.isIndex }
  }

  // Index play was optimal but user followed basic (or other wrong move)
  if (advice.isIndex && args.chosen === basic) {
    return { optimal, errorKind: 'index', isIndex: true }
  }
  if (advice.isIndex && args.chosen !== optimal) {
    return { optimal, errorKind: 'index', isIndex: true }
  }
  return { optimal, errorKind: 'basic', isIndex: false }
}

export function gradeInsurance(args: {
  tookInsurance: boolean
  trueCountTrunc: number
}): { optimal: boolean; errorKind: DecisionErrorKind; isIndex: boolean } {
  const advice = indexAdvice({
    hand: {
      cards: [],
      bet: 0,
      fromSplit: false,
      fromSplitAces: false,
      doubled: false,
      stood: false,
      surrendered: false,
      done: false,
    },
    dealerUp: { suit: 'spades', rank: 'A', id: 'x' },
    rules: {
      decks: 6,
      penetration: 0.75,
      hitSoft17: false,
      blackjackPayout: '3:2',
      doubleAfterSplit: true,
      lateSurrender: true,
      maxSplitHands: 4,
      resplitAces: false,
    },
    legal: [],
    trueCountTrunc: args.trueCountTrunc,
    canOfferSurrender: false,
    forInsurance: true,
  })
  const shouldTake = advice.action === 'insurance'
  if (args.tookInsurance === shouldTake) {
    return { optimal: shouldTake, errorKind: null, isIndex: advice.isIndex }
  }
  if (advice.isIndex) {
    return { optimal: shouldTake, errorKind: 'index', isIndex: true }
  }
  // Taking insurance when BS says no
  if (args.tookInsurance && !shouldTake) {
    return {
      optimal: false,
      errorKind: basicInsurance() === args.tookInsurance ? null : 'basic',
      isIndex: false,
    }
  }
  return { optimal: shouldTake, errorKind: 'basic', isIndex: false }
}
