import { create } from 'zustand'
import type { HandResult, SessionStats } from '../engine/types'

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

export function applyStreak(
  winStreak: number,
  coldStreak: number,
  results: Array<'win' | 'loss' | 'push' | 'blackjack' | 'surrender'>,
): { winStreak: number; coldStreak: number } {
  const hasWin = results.some((r) => r === 'win' || r === 'blackjack')
  const hasLoss = results.some((r) => r === 'loss' || r === 'surrender')
  if (hasLoss) return { winStreak: 0, coldStreak: coldStreak + 1 }
  if (hasWin) return { winStreak: winStreak + 1, coldStreak: 0 }
  return { winStreak, coldStreak }
}

type StatsState = SessionStats & {
  lastErrorKind: 'basic' | 'index' | null
  lastErrorMessage: string
  sessionFailed: boolean
  recentResults: HandResult[]
  winStreak: number
  coldStreak: number
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
  recentResults: [],
  winStreak: 0,
  coldStreak: 0,
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
      const { winStreak, coldStreak } = applyStreak(
        s.winStreak,
        s.coldStreak,
        results,
      )
      return {
        handsPlayed: s.handsPlayed + 1,
        wins,
        losses,
        pushes,
        recentResults: [...results, ...s.recentResults].slice(0, 12),
        winStreak,
        coldStreak,
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
      recentResults: [],
      winStreak: 0,
      coldStreak: 0,
    }),
}))
