import { create } from 'zustand'
import type { SessionStats } from '../engine/types'

const empty: SessionStats = {
  handsPlayed: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  basicDecisions: 0,
  basicCorrect: 0,
  indexDecisions: 0,
  indexCorrect: 0,
  countPrompts: 0,
  countCorrect: 0,
}

type StatsState = SessionStats & {
  lastErrorKind: 'basic' | 'index' | null
  lastErrorMessage: string
  sessionFailed: boolean
  recordHandResults: (results: Array<'win' | 'loss' | 'push' | 'blackjack' | 'surrender'>) => void
  recordDecision: (args: {
    isIndex: boolean
    correct: boolean
    errorKind: 'basic' | 'index' | null
  }) => void
  recordCountCheck: (correct: boolean) => void
  setError: (kind: 'basic' | 'index' | null, message: string) => void
  failSession: () => void
  reset: () => void
}

export const useStatsStore = create<StatsState>((set) => ({
  ...empty,
  lastErrorKind: null,
  lastErrorMessage: '',
  sessionFailed: false,
  recordHandResults: (results) =>
    set((s) => {
      let wins = s.wins
      let losses = s.losses
      let pushes = s.pushes
      for (const r of results) {
        if (r === 'win' || r === 'blackjack') wins++
        else if (r === 'loss' || r === 'surrender') losses++
        else pushes++
      }
      return {
        handsPlayed: s.handsPlayed + 1,
        wins,
        losses,
        pushes,
      }
    }),
  recordDecision: ({ isIndex, correct, errorKind }) =>
    set((s) => {
      if (isIndex || errorKind === 'index') {
        return {
          indexDecisions: s.indexDecisions + 1,
          indexCorrect: s.indexCorrect + (correct ? 1 : 0),
          lastErrorKind: errorKind,
          lastErrorMessage:
            errorKind === 'index'
              ? 'Index Error — deviation from Illustrious 18 / Fab 4'
              : errorKind === 'basic'
                ? 'Basic Strategy Error'
                : '',
        }
      }
      return {
        basicDecisions: s.basicDecisions + 1,
        basicCorrect: s.basicCorrect + (correct ? 1 : 0),
        lastErrorKind: errorKind,
        lastErrorMessage:
          errorKind === 'basic' ? 'Basic Strategy Error' : '',
      }
    }),
  recordCountCheck: (correct) =>
    set((s) => ({
      countPrompts: s.countPrompts + 1,
      countCorrect: s.countCorrect + (correct ? 1 : 0),
    })),
  setError: (kind, message) =>
    set({ lastErrorKind: kind, lastErrorMessage: message }),
  failSession: () => set({ sessionFailed: true }),
  reset: () =>
    set({
      ...empty,
      lastErrorKind: null,
      lastErrorMessage: '',
      sessionFailed: false,
    }),
}))
