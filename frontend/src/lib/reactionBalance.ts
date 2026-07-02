import type { ChemicalReaction, Material } from '@/types'

export interface BalanceResult {
  balanced: boolean
  perElement: Record<string, { in: number; out: number }>
  messages: string[]
}

const TOLERANCE = 1e-6

/** Parse a simple elemental formula, e.g. `parseFormula('C9H8O4') -> { C:9, H:8, O:4 }`. */
export function parseFormula(formula: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const re = /([A-Z][a-z]?)(\d*)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(formula)) !== null) {
    if (!match[1]) continue
    const element = match[1]
    const count = match[2] === '' ? 1 : Number(match[2])
    counts[element] = (counts[element] ?? 0) + count
  }
  return counts
}

/**
 * Element-balance a reaction using each material's `formula`. Returns a per-element in/out tally
 * and whether the reaction is balanced. If any participating material lacks a formula, the check
 * degrades gracefully to `balanced: true` with an informational message.
 */
export function checkReactionBalance(
  rxn: ChemicalReaction,
  materials: Material[],
): BalanceResult {
  const formulaById = new Map(materials.map((m) => [m.id, m.formula]))
  const components = [...rxn.reactants, ...rxn.products]
  const missing = components.some((c) => !c.materialId || !formulaById.get(c.materialId))
  if (components.length === 0 || missing) {
    return { balanced: true, perElement: {}, messages: ['formula unavailable — skipped'] }
  }

  const perElement: Record<string, { in: number; out: number }> = {}
  const tally = (side: 'in' | 'out', coeff: number, formula: string) => {
    const elements = parseFormula(formula)
    for (const [el, n] of Object.entries(elements)) {
      perElement[el] ??= { in: 0, out: 0 }
      perElement[el][side] += coeff * n
    }
  }

  for (const c of rxn.reactants) tally('in', c.stoichiometricCoeff, formulaById.get(c.materialId)!)
  for (const c of rxn.products) tally('out', c.stoichiometricCoeff, formulaById.get(c.materialId)!)

  const messages: string[] = []
  let balanced = true
  for (const [el, { in: i, out: o }] of Object.entries(perElement)) {
    if (Math.abs(i - o) > TOLERANCE) {
      balanced = false
      messages.push(`${el}: in ${i}, out ${o}`)
    }
  }
  return { balanced, perElement, messages }
}

/** Non-balance data validations (conversion range, key component, product count). */
export function validateReaction(rxn: ChemicalReaction): string[] {
  const messages: string[] = []
  if (rxn.conversionPct < 0 || rxn.conversionPct > 100)
    messages.push('Conversion must be between 0 and 100%.')
  if (!rxn.keyComponentId || !rxn.reactants.some((r) => r.materialId === rxn.keyComponentId))
    messages.push('Key component must be one of the reactants.')
  if (rxn.products.length === 0) messages.push('Reaction must have at least one product.')
  return messages
}
