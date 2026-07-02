import type { StepSimulationResult } from '@/types'
import type { SliceCreator } from './types'

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface CurrentJob {
  jobId: string
  status: JobStatus
  done?: number
  total?: number
}

export interface SimulationSlice {
  currentJob: CurrentJob | null
  resultsByStepId: Record<string, StepSimulationResult>
  /** Last simulation error, surfaced as a result-level banner; cleared on the next solve. */
  simError: string | null

  setJob: (job: CurrentJob | null) => void
  setResult: (stepId: string, result: StepSimulationResult) => void
  setSimError: (message: string | null) => void
  clearResults: () => void
}

export const createSimulationSlice: SliceCreator<SimulationSlice> = (set) => ({
  currentJob: null,
  resultsByStepId: {},
  simError: null,

  setJob: (job) =>
    set((state) => {
      state.currentJob = job
    }),

  setSimError: (message) =>
    set((state) => {
      state.simError = message
    }),

  // Results are written only by the simulation hook (Phase 12).
  setResult: (stepId, result) =>
    set((state) => {
      state.resultsByStepId[stepId] = result
    }),

  clearResults: () =>
    set((state) => {
      state.resultsByStepId = {}
      state.currentJob = null
    }),
})
