import { describe, expect, it } from 'vitest'
import { basicStrategyAction } from './basicStrategy'
import { indexAdvice, gradePlayerAction } from './illustrious18'
import { createPlayerHand } from './hand'
import { VEGAS_DEFAULTS } from './types'
import type { Card, PlayerAction } from './types'

const card = (rank: Card['rank']): Card => ({
  rank,
  suit: 'clubs',
  id: rank + Math.random(),
})

describe('basicStrategy', () => {
  it('stands hard 17+', () => {
    const hand = createPlayerHand(10, [card('10'), card('7')])
    const a = basicStrategyAction({
      hand,
      dealerUp: card('A'),
      rules: VEGAS_DEFAULTS,
      legal: ['hit', 'stand'],
      canOfferSurrender: false,
    })
    expect(a).toBe('stand')
  })

  it('doubles 11', () => {
    const hand = createPlayerHand(10, [card('5'), card('6')])
    const a = basicStrategyAction({
      hand,
      dealerUp: card('10'),
      rules: VEGAS_DEFAULTS,
      legal: ['hit', 'stand', 'double'],
      canOfferSurrender: true,
    })
    expect(a).toBe('double')
  })

  it('hits 12 vs 2', () => {
    const hand = createPlayerHand(10, [card('5'), card('7')])
    expect(
      basicStrategyAction({
        hand,
        dealerUp: card('2'),
        rules: VEGAS_DEFAULTS,
        legal: ['hit', 'stand'],
        canOfferSurrender: false,
      }),
    ).toBe('hit')
  })
})

describe('illustrious18 / Fab4', () => {
  const legal: PlayerAction[] = [
    'hit',
    'stand',
    'double',
    'split',
    'surrender',
  ]

  it('takes insurance at TC >= +3', () => {
    const a = indexAdvice({
      hand: createPlayerHand(10, [card('9'), card('8')]),
      dealerUp: card('A'),
      rules: VEGAS_DEFAULTS,
      legal: [],
      trueCountTrunc: 3,
      canOfferSurrender: false,
      forInsurance: true,
    })
    expect(a.action).toBe('insurance')
    expect(a.isIndex).toBe(true)
  })

  it('stands 16 vs 10 at TC >= +1', () => {
    const a = indexAdvice({
      hand: createPlayerHand(10, [card('10'), card('6')]),
      dealerUp: card('10'),
      rules: VEGAS_DEFAULTS,
      legal,
      trueCountTrunc: 1,
      canOfferSurrender: false,
    })
    expect(a.action).toBe('stand')
    expect(a.isIndex).toBe(true)
  })

  it('Fab4 surrender 15 vs 10 at TC >= 0', () => {
    const a = indexAdvice({
      hand: createPlayerHand(10, [card('10'), card('5')]),
      dealerUp: card('K'),
      rules: VEGAS_DEFAULTS,
      legal,
      trueCountTrunc: 0,
      canOfferSurrender: true,
    })
    expect(a.action).toBe('surrender')
    expect(a.isIndex).toBe(true)
  })

  it('grades missed index as index error', () => {
    const hand = createPlayerHand(10, [card('10'), card('6')])
    const g = gradePlayerAction({
      chosen: 'hit',
      hand,
      dealerUp: card('10'),
      rules: VEGAS_DEFAULTS,
      legal,
      trueCountTrunc: 1,
      canOfferSurrender: false,
    })
    expect(g.errorKind).toBe('index')
    expect(g.optimal).toBe('stand')
  })
})
