import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Store } from './types'
import { createProjectSlice } from './projectSlice'
import { createUiSlice } from './uiSlice'
import { createSimulationSlice } from './simulationSlice'
import { createPlanSlice } from './planSlice'
import { createSettingsSlice } from './settingsSlice'

export const useStore = create<Store>()(
  immer((...a) => ({
    ...createProjectSlice(...a),
    ...createUiSlice(...a),
    ...createSimulationSlice(...a),
    ...createPlanSlice(...a),
    ...createSettingsSlice(...a),
  })),
)

export type { Store } from './types'
export { genId } from './types'
export { ASPIRIN_SAMPLE, DEFAULT_UOM } from './sampleProject'
export type { ProjectSlice } from './projectSlice'
export type { UiSlice, SelectedNodeType, EditorTab, ResultsTab, ActiveDialog } from './uiSlice'
export type { SimulationSlice, CurrentJob, JobStatus } from './simulationSlice'
export type { PlanSlice } from './planSlice'
export type { SettingsSlice, UserPrefs } from './settingsSlice'
