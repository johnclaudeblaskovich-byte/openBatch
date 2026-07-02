/**
 * Read-only simulation result types.
 *
 * These are written into the store only by the simulation hook (Phase 12) — they are derived
 * from the backend and never edited by the user.
 */

import type { PhaseType } from './material'

export interface ComponentFlow {
  materialId: string
  massKg: number
  moles?: number
  massFraction?: number
  phase?: PhaseType
}

export interface StreamResult {
  id: string
  name: string
  sourceOperationId?: string
  destinationEquipmentId?: string
  components: ComponentFlow[]
  totalMassKg: number
  temperatureC?: number
}

export interface EquipmentContentsResult {
  equipmentId: string
  components: ComponentFlow[]
  totalMassKg: number
  totalVolumeL?: number
  temperatureC?: number
  fillFraction?: number
}

export interface OperationResult {
  operationId: string
  startMin: number
  endMin: number
  durationMin: number
  inputs: ComponentFlow[]
  outputs: ComponentFlow[]
  equipmentContents?: EquipmentContentsResult
  heatDutyKJ?: number
  warnings?: string[]
}

export interface MaterialBalanceRow {
  materialId: string
  materialName: string
  inKg: number
  outKg: number
  accumulationKg: number
}

export interface StepSimulationResult {
  stepId: string
  operationResults: OperationResult[]
  streams: StreamResult[]
  finalEquipmentContents: EquipmentContentsResult[]
  materialBalance: MaterialBalanceRow[]
  totalCycleTimeMin: number
  warnings: string[]
  solvedAt: string
}

export interface ProductionPlanEntry {
  id: string
  processId: string
  stepId?: string
  numberOfBatches: number
  startTimeMin?: number
  campaignName?: string
}

export interface ProductionPlan {
  id: string
  name: string
  description: string
  earliestStartMin?: number
  entries: ProductionPlanEntry[]
  campaignResult?: CampaignResult
}

export interface CampaignResult {
  planId: string
  totalBatches: number
  makespanMin: number
  /** Map of equipmentId -> utilisation fraction (0..1). */
  equipmentUtilization: Record<string, number>
  totalProductKg?: number
  solvedAt: string
}
