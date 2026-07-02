import { useCallback } from 'react'
import { useStore } from '@/store'
import { runSimulation } from '@/api/simulate'
import { toast } from '@/lib/toast'
import type { StepSimulationResult } from '@/types'

/**
 * Drives "Simulate Current Step": POSTs the project + step, surfaces progress in the job status,
 * and writes the read-only result into simulationSlice on completion.
 */
export function useSimulation() {
  const project = useStore((s) => s.project)
  const setJob = useStore((s) => s.setJob)
  const setResult = useStore((s) => s.setResult)
  const setSimError = useStore((s) => s.setSimError)

  const simulate = useCallback(
    async (stepId: string) => {
      if (!project) return
      setSimError(null)
      setJob({ jobId: 'pending', status: 'running', done: 0, total: 0 })
      try {
        await runSimulation(project, stepId, {
          onProgress: (done, total) => {
            setJob({ jobId: 'pending', status: 'running', done, total })
          },
          onComplete: (result) => {
            setResult(stepId, result as StepSimulationResult)
            setJob(null)
            setSimError(null)
            toast('Simulation complete')
          },
          onError: (message) => {
            setJob(null) // job-failed clears the spinner
            setSimError(message)
            toast(`Simulation failed: ${message}`)
          },
        })
      } catch (e) {
        setJob(null)
        setSimError((e as Error).message)
        toast(`Simulation failed: ${(e as Error).message}`)
      }
    },
    [project, setJob, setResult, setSimError],
  )

  return { simulate }
}
