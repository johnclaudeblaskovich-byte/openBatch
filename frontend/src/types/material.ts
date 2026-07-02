/**
 * Material domain types.
 *
 * Solvers look up molecular weight, density, phase, and Antoine constants by `materialId`.
 */

export type MaterialType = 'PureComponent' | 'PredefinedMixture' | 'Cell'

export type PhaseType = 'Liquid' | 'Solid' | 'Gas' | 'Mixed'

export interface Material {
  id: string
  name: string
  aliases: string[]
  type: MaterialType
  defaultPhase: PhaseType
  molecularWeight?: number
  density?: number
  boilingPoint?: number
  meltingPoint?: number
  heatCapacityLiquid?: number
  heatCapacitySolid?: number
  heatOfVaporization?: number
  antoineA?: number
  antoineB?: number
  antoineC?: number
  /** Elemental formula, e.g. "C9H8O4" — used by the stoichiometry balance checker. */
  formula?: string
  /** PredefinedMixture only: map of componentMaterialId -> mass fraction. */
  composition?: Record<string, number>
  /** Cell only. */
  cellType?: string
  notes: string
}
