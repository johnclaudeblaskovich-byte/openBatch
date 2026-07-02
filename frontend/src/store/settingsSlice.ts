import type { UomSet } from '@/types'
import type { SliceCreator } from './types'
import { DEFAULT_UOM } from './sampleProject'

export interface UserPrefs {
  /** Show operations that are disabled (isEnabled === false) in the recipe view. */
  showDisabledOperations: boolean
  /** Confirm before deleting recipe nodes / equipment. */
  confirmDeletes: boolean
}

export interface SettingsSlice {
  defaultChargeRateKgPerMin: number
  uom: UomSet
  prefs: UserPrefs

  setDefaultChargeRate: (rate: number) => void
  setUomDefaults: (patch: Partial<UomSet>) => void
  setPrefs: (patch: Partial<UserPrefs>) => void
}

export const createSettingsSlice: SliceCreator<SettingsSlice> = (set) => ({
  defaultChargeRateKgPerMin: 100,
  uom: { ...DEFAULT_UOM },
  prefs: {
    showDisabledOperations: true,
    confirmDeletes: true,
  },

  setDefaultChargeRate: (rate) =>
    set((state) => {
      state.defaultChargeRateKgPerMin = rate
    }),

  setUomDefaults: (patch) =>
    set((state) => {
      Object.assign(state.uom, patch)
    }),

  setPrefs: (patch) =>
    set((state) => {
      Object.assign(state.prefs, patch)
    }),
})
