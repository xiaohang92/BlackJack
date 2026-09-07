import { describe, expect, it } from 'vitest'
import { applyStreak } from './statsStore'

describe('applyStreak', () => {
  it('builds a win streak', () => {
    const a = applyStreak(0, 0, ['win'])
    const b = applyStreak(a.winStreak, a.coldStreak, ['blackjack'])
    expect(b).toEqual({ winStreak: 2, coldStreak: 0 })
  })

  it('does not break a win streak on push', () => {
    const afterWin = applyStreak(2, 0, ['push'])
    expect(afterWin).toEqual({ winStreak: 2, coldStreak: 0 })
  })

  it('resets the win streak on a loss', () => {
    expect(applyStreak(3, 0, ['loss'])).toEqual({ winStreak: 0, coldStreak: 1 })
  })

  it('builds a cold streak on losses', () => {
    const a = applyStreak(0, 1, ['surrender'])
    expect(a).toEqual({ winStreak: 0, coldStreak: 2 })
  })

  it('clears cold on a win', () => {
    expect(applyStreak(0, 2, ['win'])).toEqual({ winStreak: 1, coldStreak: 0 })
  })
})
