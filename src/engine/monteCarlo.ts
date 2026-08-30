import { recommendedBet } from './betSizing'
import {
  createInitialState,
  getTrueCountTrunc,
  reduce,
  type GameState,
} from './gameMachine'
import { trueCount } from './hiLo'
import { cardsRemaining } from './shoe'
import { indexAdvice } from './illustrious18'
import { legalActions } from './rules'
import type { PlayerAction, RulesConfig } from './types'
import { VEGAS_DEFAULTS } from './types'

export type SimConfig = {
  hands: number
  startingBankroll: number
  rules: RulesConfig
  baseUnit: number
  maxSpread: number
  useKelly: boolean
  kellyFraction: number
  seed?: number
}

export type SimResult = {
  bankrollSeries: number[]
  peak: number
  trough: number
  finalBankroll: number
  handsPlayed: number
  riskOfRuin: number
  ruined: boolean
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function autoPlayHand(state: GameState, rng: () => number, cfg: SimConfig): GameState {
  let s = state
  const tcExact = trueCount(s.runningCount, cardsRemaining(s.shoe))
  const tcTrunc = getTrueCountTrunc(s)
  const rec = recommendedBet({
    bankroll: s.bankroll,
    trueCount: tcExact,
    trueCountTrunc: tcTrunc,
    baseUnit: cfg.baseUnit,
    maxSpread: cfg.maxSpread,
    useKelly: cfg.useKelly,
    kellyFraction: cfg.kellyFraction,
  })
  let bet = Math.max(cfg.baseUnit, rec.amount)
  bet = Math.min(bet, s.bankroll)
  if (bet < cfg.baseUnit || s.bankroll < cfg.baseUnit) {
    return { ...s, bankroll: 0, phase: { kind: 'handComplete' } }
  }

  s = reduce(s, { type: 'PLACE_BET', amount: bet }, rng)

  if (s.phase.kind === 'insurance') {
    const advice = indexAdvice({
      hand: s.playerHands[0]!,
      dealerUp: s.dealer.cards[0]!,
      rules: s.rules,
      legal: [],
      trueCountTrunc: getTrueCountTrunc(s),
      canOfferSurrender: false,
      forInsurance: true,
    })
    s = reduce(s, { type: 'INSURANCE', take: advice.action === 'insurance' }, rng)
  }

  if (s.phase.kind === 'blackjackCheck') {
    s = reduce(s, { type: 'DEAL_STEP' }, rng)
  }

  let guard = 0
  while (s.phase.kind === 'playerAction' && guard++ < 50) {
    const hand = s.playerHands[s.activeHandIndex]!
    const legal = legalActions({
      hand,
      rules: s.rules,
      handCount: s.playerHands.length,
      bankroll: s.bankroll,
      firstAction: s.firstActionOnHand,
    })
    if (legal.length === 0) {
      s = { ...s, phase: { kind: 'dealerAction' } }
      break
    }
    const advice = indexAdvice({
      hand,
      dealerUp: s.dealer.cards[0]!,
      rules: s.rules,
      legal,
      trueCountTrunc: getTrueCountTrunc(s),
      canOfferSurrender: s.firstActionOnHand,
    })
    const preferred = advice.action as PlayerAction
    const action = legal.includes(preferred) ? preferred : legal[0]!
    s = reduce(s, { type: 'PLAYER_ACTION', action }, rng)
  }

  guard = 0
  while (s.phase.kind === 'dealerAction' && guard++ < 30) {
    s = reduce(s, { type: 'DEALER_STEP' }, rng)
  }

  if (s.phase.kind === 'payout') {
    s = reduce(s, { type: 'RESOLVE_PAYOUT' }, rng)
  }

  if (s.phase.kind === 'handComplete') {
    s = reduce(s, { type: 'NEXT_HAND' }, rng)
  }

  if (s.phase.kind !== 'betting' && s.phase.kind !== 'handComplete') {
    s = {
      ...s,
      phase: { kind: 'betting' },
      playerHands: [],
      dealer: { cards: [], holeHidden: true },
    }
  }

  return s
}

export function runSimulation(cfg: SimConfig): SimResult {
  const rng = mulberry32(cfg.seed ?? Date.now())
  let state = createInitialState(cfg.rules, cfg.startingBankroll, rng)
  const series: number[] = [cfg.startingBankroll]
  let peak = cfg.startingBankroll
  let trough = cfg.startingBankroll
  let ruined = false
  let handsPlayed = 0

  for (let i = 0; i < cfg.hands; i++) {
    if (state.bankroll < cfg.baseUnit) {
      ruined = true
      break
    }
    state = autoPlayHand(state, rng, cfg)
    handsPlayed++
    series.push(state.bankroll)
    peak = Math.max(peak, state.bankroll)
    trough = Math.min(trough, state.bankroll)
    if (state.bankroll <= 0) {
      ruined = true
      break
    }
  }

  const ruinThreshold = cfg.startingBankroll * 0.2
  const nearRuin = series.filter((b) => b < ruinThreshold).length
  const riskOfRuin = ruined
    ? 1
    : Math.min(1, nearRuin / Math.max(1, series.length))

  return {
    bankrollSeries: series,
    peak,
    trough,
    finalBankroll: state.bankroll,
    handsPlayed,
    riskOfRuin,
    ruined,
  }
}

/** Multi-trial RoR estimate. */
export function estimateRiskOfRuin(cfg: SimConfig, trials: number): number {
  let ruins = 0
  for (let t = 0; t < trials; t++) {
    const result = runSimulation({
      ...cfg,
      seed: (cfg.seed ?? 1) + t * 9973,
    })
    if (result.ruined || result.finalBankroll < cfg.baseUnit) ruins++
  }
  return ruins / trials
}

export { VEGAS_DEFAULTS }
