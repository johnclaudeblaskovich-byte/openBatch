import { describe, it, expect } from 'vitest'
import { generateTextRecipe } from './generateTextRecipe'
import { ASPIRIN_SAMPLE } from '@/store'

const step = ASPIRIN_SAMPLE.processes[0].steps[0]

describe('generateTextRecipe', () => {
  it('numbers unit procedures and operations hierarchically', () => {
    const text = generateTextRecipe(step, ASPIRIN_SAMPLE)
    expect(text).toContain('1. Reaction')
    expect(text).toMatch(/1\.1 Charge SALICYLIC-ACID/)
    expect(text).toMatch(/1\.3 React/)
    expect(text).toContain('2. Crystallization')
  })

  it('resolves material and equipment display names', () => {
    const text = generateTextRecipe(step, ASPIRIN_SAMPLE)
    expect(text).toContain('SALICYLIC-ACID')
    expect(text).toContain('Reactor-1')
    // No raw ids leaked for known references.
    expect(text).not.toContain('mat-salicylic')
    expect(text).not.toContain('eq-reactor1')
  })

  it('is deterministic', () => {
    expect(generateTextRecipe(step, ASPIRIN_SAMPLE)).toBe(
      generateTextRecipe(step, ASPIRIN_SAMPLE),
    )
  })
})
