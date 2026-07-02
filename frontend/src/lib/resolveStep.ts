import type { Project, Step } from '@/types'

/** Resolve the Step the current selection belongs to (step / up / operation / fallback to first). */
export function resolveStep(
  project: Project | null,
  selectedId: string | null,
  selectedType: string | null,
): Step | null {
  if (!project) return null
  const steps: Step[] = project.processes.flatMap((p) => p.steps)
  if (selectedType === 'step') return steps.find((s) => s.id === selectedId) ?? steps[0] ?? null
  if (selectedType === 'unitProcedure')
    return steps.find((s) => s.unitProcedures.some((u) => u.id === selectedId)) ?? steps[0] ?? null
  if (selectedType === 'operation')
    return (
      steps.find((s) =>
        s.unitProcedures.some((u) => u.operations.some((o) => o.id === selectedId)),
      ) ??
      steps[0] ??
      null
    )
  return steps[0] ?? null
}
