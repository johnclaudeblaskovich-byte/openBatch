/**
 * Operations — the polymorphic heart of a recipe.
 *
 * Each Tier-1 operation type is a distinct interface extending BaseOperation, combined into the
 * `AnyOperation` discriminated union keyed by `type`. Backend solvers are registered in
 * OPERATION_SOLVERS keyed by the same `type` string — do not change these string values.
 */

import type { PhaseType } from './material'

export type OperationType =
  | 'Charge'
  | 'Transfer'
  | 'PressureTransfer'
  | 'MultipleTransfer'
  | 'React'
  | 'YieldReact'
  | 'Crystallize'
  | 'Distill'
  | 'ReactDistill'
  | 'Filter'
  | 'WashCake'
  | 'FilterDry'
  | 'Centrifuge'
  | 'Dry'
  | 'AirDry'
  | 'FluidBedDry'
  | 'FreezeDry'
  | 'Heat'
  | 'Cool'
  | 'Mix'
  | 'Age'
  | 'Extract'
  | 'Decant'
  | 'Concentrate'
  | 'Ferment'
  | 'CellDisrupt'
  | 'Clean'
  | 'CleanInPlace'
  | 'Sterilize'
  | 'QCTest'
  | 'Purge'
  | 'Vent'
  | 'Pressurize'
  | 'Evacuate'
  | 'LineBlow'
  | 'LineFlush'
  | 'Custom'
  | 'Set'

export interface StartAfterConstraint {
  targetOperationId: string
  delayMin: number
}

export interface BaseOperation {
  id: string
  type: OperationType
  displayName: string
  isEnabled: boolean
  notes: string
  startAfterConstraints: StartAfterConstraint[]
  scheduled?: { startMin: number; endMin: number; equipmentIds: string[] }
}

export interface ContinuousFeed {
  id: string
  source: 'Inventory' | 'Equipment'
  materialId?: string
  sourceEquipmentId?: string
  amount: number
  amountUnit: string
  chargeTimeMin?: number
  chargeRateKgPerMin?: number
  timeDelayMin?: number
  numberOfAllotments?: number
  timeIntervalMin?: number
  heatExchangerEquipmentId?: string
}

// ---------------------------------------------------------------------------
// Materials movement
// ---------------------------------------------------------------------------

export interface ChargeMaterial {
  materialId: string
  amount: number
  amountUnit: string
  phase?: PhaseType
}

export interface ChargeOperation extends BaseOperation {
  type: 'Charge'
  equipmentId: string
  materials: ChargeMaterial[]
  chargeTimeMin?: number
  chargeRateKgPerMin?: number
  targetTemperatureC?: number
}

export interface TransferOperation extends BaseOperation {
  type: 'Transfer'
  sourceEquipmentId: string
  destinationEquipmentId: string
  transferFraction?: number
  transferAmount?: number
  transferAmountUnit?: string
  transferTimeMin?: number
  transferRateKgPerMin?: number
  heelVolumeL?: number
}

export interface PressureTransferOperation extends BaseOperation {
  type: 'PressureTransfer'
  sourceEquipmentId: string
  destinationEquipmentId: string
  pressureKpa?: number
  transferFraction?: number
  transferTimeMin?: number
  heelVolumeL?: number
}

// ---------------------------------------------------------------------------
// Reaction
// ---------------------------------------------------------------------------

export interface ReactOperation extends BaseOperation {
  type: 'React'
  equipmentId: string
  reactionDataSetId: string
  reactionTimeMin: number
  temperatureC?: number
  pressureKpa?: number
  continuousFeeds?: ContinuousFeed[]
}

export interface YieldSpec {
  productMaterialId: string
  basisMaterialId: string
  /** Mass of product per unit mass of basis material consumed. */
  massYield: number
}

export interface YieldReactOperation extends BaseOperation {
  type: 'YieldReact'
  equipmentId: string
  yields: YieldSpec[]
  reactionTimeMin: number
  temperatureC?: number
}

export interface CrystalSeparation {
  /** Fraction of dissolved product that crystallises into the solid phase. */
  solidFraction: number
  motherLiquorRetention?: number
}

export interface CrystallizeOperation extends BaseOperation {
  type: 'Crystallize'
  equipmentId: string
  productMaterialId: string
  solventMaterialId?: string
  crystallizationTimeMin?: number
  finalTemperatureC?: number
  coolingRateCPerMin?: number
  separation?: CrystalSeparation
}

export type DistillStopCriterion =
  | { type: 'BottomsTemperature'; temperatureC: number }
  | { type: 'OverheadTemperature'; temperatureC: number }
  | { type: 'DistillateVolume'; volumeL: number }
  | { type: 'AmountRemoved'; amountKg: number }
  | { type: 'Time'; timeMin: number }

export interface DistillSeparation {
  /** Map of materialId -> fraction reporting to the distillate. */
  componentSplits: Record<string, number>
  distillateEquipmentId?: string
}

export interface DistillOperation extends BaseOperation {
  type: 'Distill'
  equipmentId: string
  distillationTimeMin?: number
  separation: DistillSeparation
  stopCriterion: DistillStopCriterion
}

// ---------------------------------------------------------------------------
// Separation
// ---------------------------------------------------------------------------

export interface FilterOperation extends BaseOperation {
  type: 'Filter'
  equipmentId: string
  filtrationTimeMin?: number
  cakeSolidFraction?: number
  motherLiquorRetention?: number
  filtrateEquipmentId?: string
}

export interface WashCakeOperation extends BaseOperation {
  type: 'WashCake'
  equipmentId: string
  washMaterialId: string
  washAmount: number
  washAmountUnit: string
  washTimeMin?: number
  numberOfWashes?: number
  washEfficiency?: number
}

export interface CakeWash {
  washMaterialId: string
  washAmount: number
  washAmountUnit: string
  numberOfWashes?: number
}

export interface FilterDryOperation extends BaseOperation {
  type: 'FilterDry'
  equipmentId: string
  filtrationTimeMin?: number
  dryingTimeMin?: number
  cakeWash?: CakeWash
  finalMoistureFraction?: number
}

export interface CentrifugeOperation extends BaseOperation {
  type: 'Centrifuge'
  equipmentId: string
  spinTimeMin?: number
  cakeSolidFraction?: number
  motherLiquorRetention?: number
}

export interface ExtractSeparation {
  /** Map of materialId -> fraction partitioning into the extract phase. */
  componentDistribution: Record<string, number>
  extractPhaseEquipmentId?: string
}

export interface ExtractOperation extends BaseOperation {
  type: 'Extract'
  equipmentId: string
  solventMaterialId: string
  solventAmount: number
  solventAmountUnit: string
  numberOfStages?: number
  extractionTimeMin?: number
  separation: ExtractSeparation
}

export interface DecantSeparation {
  keptPhase: 'Light' | 'Heavy'
  /** Map of materialId -> fraction reporting to the kept phase. */
  phaseSplit?: Record<string, number>
}

export interface DecantOperation extends BaseOperation {
  type: 'Decant'
  equipmentId: string
  settlingTimeMin?: number
  separation: DecantSeparation
}

export interface ConcentrateOperation extends BaseOperation {
  type: 'Concentrate'
  equipmentId: string
  solventMaterialId?: string
  targetVolumeFraction?: number
  amountRemovedKg?: number
  concentrationTimeMin?: number
  temperatureC?: number
}

// ---------------------------------------------------------------------------
// Drying
// ---------------------------------------------------------------------------

export interface DryOperation extends BaseOperation {
  type: 'Dry'
  equipmentId: string
  dryingTimeMin?: number
  finalMoistureFraction?: number
  temperatureC?: number
  pressureKpa?: number
}

// ---------------------------------------------------------------------------
// Heat transfer
// ---------------------------------------------------------------------------

export interface HeatOperation extends BaseOperation {
  type: 'Heat'
  equipmentId: string
  targetTemperatureC: number
  heatingTimeMin?: number
  rateCPerMin?: number
  utilityId?: string
}

export interface CoolOperation extends BaseOperation {
  type: 'Cool'
  equipmentId: string
  targetTemperatureC: number
  coolingTimeMin?: number
  rateCPerMin?: number
  utilityId?: string
}

// ---------------------------------------------------------------------------
// Timing / agitation
// ---------------------------------------------------------------------------

export interface MixOperation extends BaseOperation {
  type: 'Mix'
  equipmentId: string
  mixingTimeMin?: number
  rpm?: number
}

export interface AgeOperation extends BaseOperation {
  type: 'Age'
  equipmentId: string
  agingTimeMin?: number
  temperatureC?: number
}

// ---------------------------------------------------------------------------
// Biotech
// ---------------------------------------------------------------------------

export interface FermentOperation extends BaseOperation {
  type: 'Ferment'
  equipmentId: string
  cellMaterialId: string
  substrateMaterialId?: string
  productMaterialId?: string
  fermentationTimeMin?: number
  temperatureC?: number
  yieldFraction?: number
}

export type AnyOperation =
  | ChargeOperation
  | TransferOperation
  | PressureTransferOperation
  | ReactOperation
  | YieldReactOperation
  | CrystallizeOperation
  | DistillOperation
  | FilterOperation
  | WashCakeOperation
  | FilterDryOperation
  | CentrifugeOperation
  | DryOperation
  | ExtractOperation
  | DecantOperation
  | ConcentrateOperation
  | HeatOperation
  | CoolOperation
  | MixOperation
  | AgeOperation
  | FermentOperation
