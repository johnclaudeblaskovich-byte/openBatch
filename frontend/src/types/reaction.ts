/**
 * Reaction domain types.
 *
 * Reaction operations reference a `ReactionDataSet` by id; the React and YieldReact solvers
 * consume the reactions inside it.
 */

import type { PhaseType } from './material'

export interface ReactionComponent {
  materialId: string
  stoichiometricCoeff: number
  phase: PhaseType
}

export interface ChemicalReaction {
  id: string
  name: string
  reactants: ReactionComponent[]
  products: ReactionComponent[]
  keyComponentId: string
  conversionPct: number
  /** J/mol of key component; negative = exothermic. */
  heatOfReaction: number
  reactionType: 'Stoichiometric' | 'Yield'
}

export interface ReactionDataSet {
  id: string
  name: string
  description: string
  reactions: ChemicalReaction[]
}
