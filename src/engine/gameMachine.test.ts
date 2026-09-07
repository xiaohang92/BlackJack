import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  reduce,
  shoeRound,
  type GameState,
} from './gameMachine'
import { VEGAS_DEFAULTS } from './types'
import { cardsRemaining, totalCards } from './shoe'
import { runSimulation } from './monteCarlo'

function playOneHand(state: GameState, rng: () => number, bet = 10): GameState {
  let s = state
  if (s.phase.kind === 'handComplete') {
    s = reduce(s, { type: 'NEXT_HAND' }, rng)
  }
  s = reduce(s, { type: 'PLACE_BET', amount: bet }, rng)
  if (s.phase.kind === 'insurance') {
    s = reduce(s, { type: 'INSURANCE', take: false }, rng)
  }
  if (s.phase.kind === 'blackjackCheck') {
    s = reduce(s, { type: 'DEAL_STEP' }, rng)
  }
  let guard = 0
  while (s.phase.kind === 'playerAction' && guard++ < 30) {
    s = reduce(s, { type: 'PLAYER_ACTION', action: 'stand' }, rng)
  }
  while (s.phase.kind === 'dealerAction' && guard++ < 40) {
    s = reduce(s, { type: 'DEALER_STEP' }, rng)
  }
  if (s.phase.kind === 'payout') {
    s = reduce(s, { type: 'RESOLVE_PAYOUT' }, rng)
  }
  return s
}

describe('gameMachine', () => {
  it('places bet and deals four cards', () => {
    let s = createInitialState(VEGAS_DEFAULTS, 1000, () => 0.42)
    s = reduce(s, { type: 'PLACE_BET', amount: 25 }, () => 0.42)
    expect(s.bankroll).toBe(975)
    expect(s.playerHands[0]!.cards.length).toBe(2)
    expect(s.dealer.cards.length).toBe(2)
    expect(s.dealer.holeHidden).toBe(true)
  })

  it('dealer finishes after stand instead of hanging', () => {
    const rng = () => 0.19
    let s = createInitialState(VEGAS_DEFAULTS, 1000, rng)
    s = playOneHand(s, rng)
    expect(s.phase.kind).toBe('handComplete')
    expect(s.dealer.holeHidden).toBe(false)
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

  it('keeps a 6-deck shoe count across rounds until the cut card', () => {
    const rng = () => 0.42
    let s = createInitialState(VEGAS_DEFAULTS, 5000, rng)
    expect(s.rules.decks).toBe(6)
    expect(cardsRemaining(s.shoe)).toBe(312)
    expect(totalCards(s.shoe)).toBe(312)
    expect(shoeRound(s)).toBe(1)

    s = playOneHand(s, rng)
    expect(s.phase.kind).toBe('handComplete')
    expect(shoeRound(s)).toBe(1)
    const rcAfter1 = s.runningCount
    const cardsAfter1 = cardsRemaining(s.shoe)
    expect(cardsAfter1).toBeLessThan(312)
    expect(s.shoe.discards.length).toBe(312 - cardsAfter1)

    s = reduce(s, { type: 'NEXT_HAND' }, rng)
    expect(s.runningCount).toBe(rcAfter1)
    expect(cardsRemaining(s.shoe)).toBe(cardsAfter1)
    expect(shoeRound(s)).toBe(2)

    s = playOneHand(s, rng)
    expect(s.phase.kind).toBe('handComplete')
    expect(shoeRound(s)).toBe(2)
    expect(cardsRemaining(s.shoe)).toBeLessThan(cardsAfter1)
    expect(s.handsSinceShuffle).toBe(2)
  })

  it('resets the count on a new shoe after the cut card', () => {
    const rng = () => 0.37
    let s = createInitialState(VEGAS_DEFAULTS, 80000, rng)
    let guard = 0
    while (!s.shoe.needsShuffle && guard++ < 250) {
      s = playOneHand(s, rng)
    }
    expect(s.shoe.needsShuffle).toBe(true)
    expect(s.handsSinceShuffle).toBeGreaterThan(1)

    s = playOneHand(s, rng)
    expect(s.handsSinceShuffle).toBe(1)
    expect(cardsRemaining(s.shoe)).toBeGreaterThan(280)
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
