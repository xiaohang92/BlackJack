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
    { name: 'bj-settings' },
  ),
)
