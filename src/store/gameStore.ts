import { create } from 'zustand'
import {
  createInitialState,
  getAdvice,
  getBasicAdvice,
  getTrueCountTrunc,
  reduce,
  type GameEvent,
  type GameState,
} from '../engine/gameMachine'
import { trueCount, remainingDecksRounded } from '../engine/hiLo'
import { cardsRemaining, cardsDealt, totalCards } from '../engine/shoe'
import { gradeInsurance, gradePlayerAction } from '../engine/illustrious18'
import { legalActions } from '../engine/rules'
import type { PlayerAction, RulesConfig } from '../engine/types'
import { useStatsStore } from './statsStore'

type GameStore = {
  game: GameState
  betInput: number
  lastBet: number
  chipAdds: number[]
  countModalOpen: boolean
  distraction: string | null
  init: (rules: RulesConfig, bankroll?: number) => void
  setBetInput: (n: number) => void
  addChip: (value: number) => void
  undoChip: () => void
  clearBet: () => void
  rebet: () => void
  dispatch: (event: GameEvent) => void
  placeBet: () => void
  playerAction: (action: PlayerAction) => void
  insurance: (take: boolean) => void
  tickDealer: () => void
  tickResolve: () => void
  nextHand: () => void
  openCountModal: () => void
  closeCountModal: () => void
  submitCountGuess: (rc: number, tc: number) => { rcOk: boolean; tcOk: boolean }
  setDistraction: (msg: string | null) => void
  advice: () => ReturnType<typeof getAdvice>
  basicAdvice: () => ReturnType<typeof getBasicAdvice>
  legal: () => PlayerAction[]
  metrics: () => {
    runningCount: number
    trueCount: number
    trueCountTrunc: number
    decksRemaining: number
    cardsLeft: number
    discardRatio: number
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: createInitialState(),
  betInput: 10,
  lastBet: 10,
  chipAdds: [10],
  countModalOpen: false,
  distraction: null,

  init: (rules, bankroll = 1000) => {
    set({
      game: createInitialState(rules, bankroll),
      betInput: 10,
      lastBet: 10,
      chipAdds: [10],
    })
  },

  setBetInput: (n) => set({ betInput: Math.max(0, n), chipAdds: [] }),

  addChip: (value) => {
    const { game, betInput } = get()
    const next = Math.min(game.bankroll, betInput + value)
    if (next === betInput) return
    set({ betInput: next, chipAdds: [...get().chipAdds, next - betInput] })
  },

  undoChip: () => {
    const { chipAdds, betInput } = get()
    const last = chipAdds[chipAdds.length - 1]
    if (last == null) {
      set({ betInput: 0 })
      return
    }
    set({
      betInput: Math.max(0, betInput - last),
      chipAdds: chipAdds.slice(0, -1),
    })
  },

  clearBet: () => set({ betInput: 0, chipAdds: [] }),

  rebet: () => {
    const { lastBet, game } = get()
    const amount = Math.min(game.bankroll, lastBet)
    set({ betInput: amount, chipAdds: amount > 0 ? [amount] : [] })
  },

  dispatch: (event) => {
    set({ game: reduce(get().game, event) })
  },

  placeBet: () => {
    const { game, betInput } = get()
    if (game.phase.kind !== 'betting') return
    if (betInput <= 0 || betInput > game.bankroll) return
    set({
      game: reduce(game, { type: 'PLACE_BET', amount: betInput }),
      lastBet: betInput,
      chipAdds: [],
    })
  },

  insurance: (take) => {
    const { game } = get()
    if (game.phase.kind !== 'insurance') return
    const tc = getTrueCountTrunc(game)
    const grade = gradeInsurance({ tookInsurance: take, trueCountTrunc: tc })
    useStatsStore.getState().recordDecision({
      isIndex: grade.isIndex || tc >= 3,
      correct: grade.errorKind === null,
      errorKind: grade.errorKind,
    })
    set({ game: reduce(game, { type: 'INSURANCE', take }) })
  },

  playerAction: (action) => {
    const { game } = get()
    if (game.phase.kind !== 'playerAction') return
    const hand = game.playerHands[game.activeHandIndex]!
    const legal = legalActions({
      hand,
      rules: game.rules,
      handCount: game.playerHands.length,
      bankroll: game.bankroll,
      firstAction: game.firstActionOnHand,
    })
    const grade = gradePlayerAction({
      chosen: action,
      hand,
      dealerUp: game.dealer.cards[0]!,
      rules: game.rules,
      legal,
      trueCountTrunc: getTrueCountTrunc(game),
      canOfferSurrender: game.firstActionOnHand,
    })
    useStatsStore.getState().recordDecision({
      isIndex: grade.isIndex,
      correct: grade.errorKind === null,
      errorKind: grade.errorKind,
    })
    set({ game: reduce(game, { type: 'PLAYER_ACTION', action }) })
  },

  tickDealer: () => {
    const { game } = get()
    if (game.phase.kind === 'dealerAction') {
      set({ game: reduce(game, { type: 'DEALER_STEP' }) })
    }
  },

  tickResolve: () => {
    const { game } = get()
    if (game.phase.kind === 'payout') {
      const next = reduce(game, { type: 'RESOLVE_PAYOUT' })
      useStatsStore.getState().recordHandResults(
        next.lastPayouts.map((p) => p.result),
      )
      set({ game: next })
    }
  },

  nextHand: () => {
    const { game } = get()
    if (game.phase.kind === 'handComplete') {
      set({ game: reduce(game, { type: 'NEXT_HAND' }) })
    }
  },

  openCountModal: () => set({ countModalOpen: true }),
  closeCountModal: () => set({ countModalOpen: false }),

  submitCountGuess: (rc, tc) => {
    const m = get().metrics()
    const rcOk = rc === m.runningCount
    const tcOk = Math.abs(tc - m.trueCountTrunc) < 0.01 || tc === Math.round(m.trueCount)
    const correct = rcOk && tcOk
    useStatsStore.getState().recordCountCheck(correct)
    return { rcOk, tcOk }
  },

  setDistraction: (msg) => set({ distraction: msg }),

  advice: () => getAdvice(get().game),
  basicAdvice: () => getBasicAdvice(get().game),

  legal: () => {
    const g = get().game
    if (g.phase.kind !== 'playerAction') return []
    return legalActions({
      hand: g.playerHands[g.activeHandIndex]!,
      rules: g.rules,
      handCount: g.playerHands.length,
      bankroll: g.bankroll,
      firstAction: g.firstActionOnHand,
    })
  },

  metrics: () => {
    const g = get().game
    const cardsLeft = cardsRemaining(g.shoe)
    return {
      runningCount: g.runningCount,
      trueCount: trueCount(g.runningCount, cardsLeft),
      trueCountTrunc: getTrueCountTrunc(g),
      decksRemaining: remainingDecksRounded(cardsLeft),
      cardsLeft,
      discardRatio: cardsDealt(g.shoe) / totalCards(g.shoe),
    }
  },
}))
