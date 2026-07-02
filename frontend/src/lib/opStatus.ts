import type { AnyOperation, StepSimulationResult } from '@/types'

export type OperationStatus = 'pending' | 'scheduled' | 'done'

/**
 * Resolve an operation's status:
 * - `done`   when a step result exists and contains an OperationResult for this op id.
 * - `scheduled` when the op has been scheduled (`op.scheduled`) but has no result yet.
 * - `pending` otherwise.
 */
export function operationStatus(
  op: AnyOperation,
  stepResult: StepSimulationResult | undefined,
): OperationStatus {
  if (stepResult?.operationResults.some((r) => r.operationId === op.id)) return 'done'
  if (op.scheduled) return 'scheduled'
  return 'pending'
}
