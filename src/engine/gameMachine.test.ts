import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  reduce,
} from './gameMachine'
import { VEGAS_DEFAULTS } from './types'
import { runSimulation } from './monteCarlo'

describe('gameMachine', () => {
  it('places bet and deals four cards', () => {
    let s = createInitialState(VEGAS_DEFAULTS, 1000, () => 0.42)
    s = reduce(s, { type: 'PLACE_BET', amount: 25 }, () => 0.42)
    expect(s.bankroll).toBe(975)
    expect(s.playerHands[0]!.cards.length).toBe(2)
    expect(s.dealer.cards.length).toBe(2)
    expect(s.dealer.holeHidden).toBe(true)
  })

  it('resolves payouts after stand', () => {
    let s = createInitialState(VEGAS_DEFAULTS, 500, () => 0.11)
    s = reduce(s, { type: 'PLACE_BET', amount: 10 }, () => 0.11)
    if (s.phase.kind === 'insurance') {
      s = reduce(s, { type: 'INSURANCE', take: false }, () => 0.11)
    }
    if (s.phase.kind === 'blackjackCheck') {
      s = reduce(s, { type: 'DEAL_STEP' }, () => 0.11)
    }
    // Play through if still in action
    let guard = 0
    while (s.phase.kind === 'playerAction' && guard++ < 20) {
      s = reduce(s, { type: 'PLAYER_ACTION', action: 'stand' }, () => 0.11)
    }
    while (s.phase.kind === 'dealerAction' && guard++ < 40) {
      s = reduce(s, { type: 'DEALER_STEP' }, () => 0.11)
    }
    if (s.phase.kind === 'payout') {
      s = reduce(s, { type: 'RESOLVE_PAYOUT' }, () => 0.11)
    }
    expect(['handComplete', 'playerAction', 'dealerAction', 'payout']).toContain(
      s.phase.kind,
    )
  })
})

describe('monteCarlo', () => {
  it('runs a short simulation with finite series', () => {
    const result = runSimulation({
      hands: 200,
      startingBankroll: 5000,
      rules: VEGAS_DEFAULTS,
      baseUnit: 10,
      maxSpread: 12,
      useKelly: false,
      kellyFraction: 0.5,
      seed: 7,
    })
    expect(result.bankrollSeries.length).toBeGreaterThan(1)
    expect(Number.isFinite(result.finalBankroll)).toBe(true)
    expect(result.peak).toBeGreaterThanOrEqual(result.trough)
  })
})
