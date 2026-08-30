import { describe, expect, it } from 'vitest'
import { handTotal, isBlackjack, isPair, rankValue } from './hand'
import type { Card } from './types'

const c = (rank: Card['rank'], suit: Card['suit'] = 'spades'): Card => ({
  rank,
  suit,
  id: `${rank}${suit}`,
})

describe('hand', () => {
  it('soft ace totals', () => {
    expect(handTotal([c('A'), c('6')])).toEqual({
      total: 17,
      soft: true,
      busted: false,
    })
  })

  it('hardens ace when needed', () => {
    expect(handTotal([c('A'), c('9'), c('5')])).toEqual({
      total: 15,
      soft: false,
      busted: false,
    })
  })

  it('detects blackjack and pairs', () => {
    expect(isBlackjack([c('A'), c('K')])).toBe(true)
    expect(isPair([c('8'), c('8')])).toBe(true)
    expect(isPair([c('10'), c('K')])).toBe(true)
    expect(rankValue('J')).toBe(10)
  })
})
