import { useStore } from '@/store'
import { resolveStep } from '@/lib/resolveStep'

/**
 * Bottom status bar — shows the current project name, live simulation progress, and (after a
 * solve) the batch time of the selected step.
 */
export default function StatusBar() {
  const projectName = useStore((s) => s.project?.name ?? 'No project')
  const job = useStore((s) => s.currentJob)
  const project = useStore((s) => s.project)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedNodeType = useStore((s) => s.selectedNodeType)
  const resultsByStepId = useStore((s) => s.resultsByStepId)

  const step = resolveStep(project, selectedNodeId, selectedNodeType)
  const result = step ? resultsByStepId[step.id] : undefined
  const batchTime = result
    ? ((result as unknown as { batchTimeMin?: number }).batchTimeMin ??
      result.totalCycleTimeMin)
    : undefined

  let right = 'Ready'
  if (job?.status === 'running') {
    right = job.total ? `Simulating ${job.done ?? 0}/${job.total}…` : 'Simulating…'
  } else if (batchTime !== undefined) {
    right = `Batch time: ${Math.round(batchTime)} min`
  }

  return (
    <div className="flex h-7 items-center justify-between border-t border-border bg-panel px-3 text-xs text-text-secondary">
      <span>{projectName}</span>
      <span>{right}</span>
    </div>
  )
}
