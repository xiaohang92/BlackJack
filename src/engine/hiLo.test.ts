import { describe, expect, it } from 'vitest'
import {
  hiLoValue,
  remainingDecksRounded,
  runningCountDelta,
  trueCount,
  trueCountFloor,
} from './hiLo'
import type { Card } from './types'

const c = (rank: Card['rank']): Card => ({
  rank,
  suit: 'hearts',
  id: rank,
})

describe('hiLo', () => {
  it('tags ranks correctly', () => {
    expect(hiLoValue('2')).toBe(1)
    expect(hiLoValue('7')).toBe(0)
    expect(hiLoValue('K')).toBe(-1)
    expect(hiLoValue('A')).toBe(-1)
  })

  it('updates running count', () => {
    expect(runningCountDelta([c('5'), c('K'), c('A')])).toBe(-1)
  })

  it('rounds remaining decks to half decks', () => {
    expect(remainingDecksRounded(52 * 4.3)).toBe(4.5)
    expect(remainingDecksRounded(52 * 4.1)).toBe(4)
    expect(remainingDecksRounded(10)).toBe(0.5)
  })

  it('computes true count', () => {
    expect(trueCount(6, 52 * 2)).toBe(3)
    expect(trueCountFloor(6.9, 52)).toBe(6)
    expect(trueCountFloor(-3.2, 52)).toBe(-3)
  })
})
