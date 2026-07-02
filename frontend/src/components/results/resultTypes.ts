/**
 * View types matching the backend StepSimulationResult dict (which carries a few more fields than
 * the strict frontend StepSimulationResult interface). The result tabs read these read-only.
 */
import { useStore } from '@/store'
import { resolveStep } from '@/lib/resolveStep'
import type { Step } from '@/types'

export interface RComponentFlow {
  materialId: string
  massKg: number
  massFraction?: number
  phase?: string
}

export interface RStream {
  id: string
  name?: string
  sourceOperationId?: string | null
  destinationEquipmentId?: string | null
  totalMassKg: number
  temperatureC?: number | null
  pressureKpa?: number | null
  components: RComponentFlow[]
}

export interface RMaterialBalanceRow {
  operationId: string
  operationName: string
  massInKg: number
  massOutKg: number
  accumulationKg: number
  discrepancyPct: number
}

export interface REquipmentContents {
  afterOperationId: string
  equipmentId: string
  totalMassKg: number
  totalVolumeM3: number
  temperatureC?: number | null
  pressureKpa?: number | null
  fillPct?: number | null
  components: RComponentFlow[]
}

export interface ROperationResult {
  operationId: string
  operationName: string
  unitProcedureId?: string | null
  durationMin: number
  scheduledStartMin?: number | null
  scheduledEndMin?: number | null
  equipmentIds: string[]
  warnings: string[]
}

export interface RRuleWarning {
  rule: string
  severity: 'warning' | 'error'
  operationId?: string | null
  message: string
}

export interface StepResultView {
  stepId: string
  operationResults: ROperationResult[]
  streams: RStream[]
  equipmentContents: REquipmentContents[]
  finalEquipmentContents: REquipmentContents[]
  materialBalance: RMaterialBalanceRow[]
  batchTimeMin: number
  cycleTimeMin: number
  warnings: string[]
  ruleWarnings?: RRuleWarning[]
  solvedAt: string
}

/** Resolve the current step and its (read-only) simulation result, if any. */
export function useStepResult(): { step: Step | null; result: StepResultView | undefined } {
  const project = useStore((s) => s.project)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedNodeType = useStore((s) => s.selectedNodeType)
  const resultsByStepId = useStore((s) => s.resultsByStepId)

  const step = resolveStep(project, selectedNodeId, selectedNodeType)
  const result = step
    ? (resultsByStepId[step.id] as unknown as StepResultView | undefined)
    : undefined
  return { step, result }
}
