import { describe, it, expect } from 'vitest'
import { parseFormula, checkReactionBalance, validateReaction } from './reactionBalance'
import { ASPIRIN_SAMPLE } from '@/store'
import type { ChemicalReaction } from '@/types'

const materials = ASPIRIN_SAMPLE.materials
const rxn = ASPIRIN_SAMPLE.reactions[0].reactions[0]

describe('parseFormula', () => {
  it('parses C9H8O4', () => {
    expect(parseFormula('C9H8O4')).toEqual({ C: 9, H: 8, O: 4 })
  })

  it('treats missing counts as 1 (H2O)', () => {
    expect(parseFormula('H2O')).toEqual({ H: 2, O: 1 })
  })
})

describe('checkReactionBalance', () => {
  it('reports the aspirin reaction as balanced', () => {
    const res = checkReactionBalance(rxn, materials)
    expect(res.balanced).toBe(true)
  })

  it('degrades gracefully when a formula is missing', () => {
    const noFormula = materials.map((m) => ({ ...m, formula: undefined }))
    const res = checkReactionBalance(rxn, noFormula)
    expect(res.balanced).toBe(true)
    expect(res.messages[0]).toContain('formula unavailable')
  })

  it('detects imbalance when a product is removed', () => {
    const broken: ChemicalReaction = { ...rxn, products: [rxn.products[0]] }
    const res = checkReactionBalance(broken, materials)
    expect(res.balanced).toBe(false)
    expect(res.messages.length).toBeGreaterThan(0)
  })
})

describe('validateReaction', () => {
  it('passes for the sample reaction', () => {
    expect(validateReaction(rxn)).toEqual([])
  })

  it('flags a missing product', () => {
    expect(validateReaction({ ...rxn, products: [] })).toContain(
      'Reaction must have at least one product.',
    )
  })

  it('flags out-of-range conversion', () => {
    expect(validateReaction({ ...rxn, conversionPct: 150 })).toContain(
      'Conversion must be between 0 and 100%.',
    )
  })
})
