import { describe, it, expect } from 'vitest'
import { buildRecipeRows } from './recipeRows'
import { ASPIRIN_SAMPLE } from '@/store'

const step = ASPIRIN_SAMPLE.processes[0].steps[0]

describe('buildRecipeRows', () => {
  it('flattens unit procedures + operations in numbered execution order', () => {
    const rows = buildRecipeRows(step, ASPIRIN_SAMPLE)
    expect(rows.slice(0, 5).map((r) => r.number)).toEqual(['1', '1.1', '1.2', '1.3', '2'])
  })

  it('resolves the equipment tag for the React operation', () => {
    const rows = buildRecipeRows(step, ASPIRIN_SAMPLE)
    const react = rows.find((r) => r.operation?.type === 'React')
    expect(react?.equipmentTag).toBe('R-101')
  })

  it('marks unit-procedure header rows distinctly', () => {
    const rows = buildRecipeRows(step, ASPIRIN_SAMPLE)
    expect(rows[0]).toMatchObject({ kind: 'unitProcedure', number: '1', label: 'Reaction' })
  })
})
