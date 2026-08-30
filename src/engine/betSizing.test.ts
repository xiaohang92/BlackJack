import { describe, expect, it } from 'vitest'
import { kellyBet, recommendedBet, spreadUnits } from './betSizing'
import { playerEdge } from './ev'

describe('betSizing', () => {
  it('spread ramp', () => {
    expect(spreadUnits(0, 12)).toBe(1)
    expect(spreadUnits(2, 12)).toBe(2)
    expect(spreadUnits(3, 12)).toBe(4)
    expect(spreadUnits(4, 12)).toBe(8)
    expect(spreadUnits(5, 12)).toBe(12)
    expect(spreadUnits(5, 8)).toBe(8)
  })

  it('kelly zero when edge negative', () => {
    expect(playerEdge(0)).toBeCloseTo(-0.005)
    expect(kellyBet({ bankroll: 10000, trueCount: 0, fraction: 1 })).toBe(0)
    expect(kellyBet({ bankroll: 10000, trueCount: 2, fraction: 0.5 })).toBe(
      10000 * 0.005 * 0.5,
    )
  })

  it('recommended kelly rounds to units', () => {
    const r = recommendedBet({
      bankroll: 10000,
      trueCount: 3,
      trueCountTrunc: 3,
      baseUnit: 10,
      maxSpread: 12,
      useKelly: true,
      kellyFraction: 1,
    })
    expect(r.mode).toBe('kelly')
    expect(r.amount % 10).toBe(0)
  })
})
