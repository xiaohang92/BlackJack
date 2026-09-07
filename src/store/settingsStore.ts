import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_TRAINER,
  VEGAS_DEFAULTS,
  type RulesConfig,
  type TrainerSettings,
} from '../engine/types'

type SettingsState = {
  rules: RulesConfig
  trainer: TrainerSettings
  tourCompleted: boolean
  setRules: (patch: Partial<RulesConfig>) => void
  setTrainer: (patch: Partial<TrainerSettings>) => void
  resetRules: () => void
  setTourCompleted: (done: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      rules: VEGAS_DEFAULTS,
      trainer: DEFAULT_TRAINER,
      tourCompleted: false,
      setRules: (patch) =>
        set((s) => ({ rules: { ...s.rules, ...patch } })),
      setTrainer: (patch) =>
        set((s) => ({ trainer: { ...s.trainer, ...patch } })),
      resetRules: () => set({ rules: VEGAS_DEFAULTS }),
      setTourCompleted: (done) => set({ tourCompleted: done }),
    }),
    {
      name: 'bj-settings',
      version: 3,
      migrate: (persisted, fromVersion) => {
        if (typeof persisted !== 'object' || persisted === null) {
          return persisted
        }
        const p = persisted as {
          rules?: Partial<RulesConfig>
          trainer?: Partial<TrainerSettings>
          tourCompleted?: boolean
        }
        let trainer = { ...p.trainer }
        if (fromVersion < 2) {
          trainer = { ...trainer, countCheckEveryNHands: 0 }
        }
        if (fromVersion < 3) {
          trainer = {
            ...trainer,
            tableMood: 'play',
            soundEnabled: true,
            cheatSheetOpen: false,
          }
        }
        return { ...p, trainer }
      },
      merge: (persistedState, currentState) => {
        if (typeof persistedState !== 'object' || persistedState === null) {
          return currentState
        }
        const p = persistedState as {
          rules?: Partial<RulesConfig>
          trainer?: Partial<TrainerSettings>
          tourCompleted?: boolean
        }
        return {
          ...currentState,
          tourCompleted: p.tourCompleted ?? currentState.tourCompleted,
          rules: { ...currentState.rules, ...p.rules },
          trainer: { ...currentState.trainer, ...p.trainer },
        }
      },
    },
  ),
)
