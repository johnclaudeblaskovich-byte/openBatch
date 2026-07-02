import type { ChemicalReaction, Material, ReactionComponent } from '@/types'

function side(components: ReactionComponent[], nameById: Map<string, string>): string {
  if (components.length === 0) return '∅'
  return components
    .map((c) => {
      const name = nameById.get(c.materialId) ?? c.materialId ?? '?'
      const coeff = c.stoichiometricCoeff
      return coeff === 1 ? name : `${coeff} ${name}`
    })
    .join(' + ')
}

/** Render a reaction as a readable equation, e.g. `2 A + B → C`. */
export function reactionToString(rxn: ChemicalReaction, materials: Material[]): string {
  const nameById = new Map(materials.map((m) => [m.id, m.name]))
  return `${side(rxn.reactants, nameById)} → ${side(rxn.products, nameById)}`
}
