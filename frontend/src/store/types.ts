import type { StateCreator } from 'zustand'
import type { ProjectSlice } from './projectSlice'
import type { UiSlice } from './uiSlice'
import type { SimulationSlice } from './simulationSlice'
import type { PlanSlice } from './planSlice'
import type { SettingsSlice } from './settingsSlice'

/** The composed store shape — exactly five slices. */
export type Store = ProjectSlice & UiSlice & SimulationSlice & PlanSlice & SettingsSlice

/** Helper alias for a slice creator running under the Immer middleware. */
export type SliceCreator<T> = StateCreator<Store, [['zustand/immer', never]], [], T>

/** Generate a short, unique id with a readable prefix. */
export function genId(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}
