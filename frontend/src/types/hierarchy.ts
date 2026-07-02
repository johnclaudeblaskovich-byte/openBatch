/**
 * Recipe hierarchy domain types (ISA-S88 style):
 *   Project -> BpProcess -> Step -> UnitProcedure -> Operation
 *
 * A Step is the unit of simulation (produces one StepSimulationResult).
 */

import type { AnyOperation } from './operations'
import type { StepSimulationResult } from './results'
import type { UomSet } from './project'

export interface UnitProcedure {
  id: string
  name: string
  primaryEquipmentId: string
  operations: AnyOperation[]
}

export interface Step {
  id: string
  name: string
  description: string
  facilityId: string
  /** Per-Step display UOM, overriding Project.uom. */
  uom: UomSet
  /** Cumulative scale factor applied to this step (so ReturnToOriginal can undo). */
  currentScaleFactor?: number
  unitProcedures: UnitProcedure[]
  simulationResults?: StepSimulationResult
}

export interface BpProcess {
  id: string
  name: string
  description: string
  keyProduct: string
  steps: Step[]
}
