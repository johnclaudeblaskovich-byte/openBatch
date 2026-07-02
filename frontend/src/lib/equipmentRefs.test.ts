import { describe, it, expect } from 'vitest'
import { findOperationsUsingEquipment } from './equipmentRefs'
import { ASPIRIN_SAMPLE } from '@/store'

describe('findOperationsUsingEquipment', () => {
  it('finds operations referencing Reactor-1 (incl. the React op)', () => {
    const refs = findOperationsUsingEquipment('eq-reactor1', ASPIRIN_SAMPLE)
    expect(refs.some((r) => r.opLabel.includes('React'))).toBe(true)
  })

  it('returns no refs for an unreferenced equipment id', () => {
    expect(findOperationsUsingEquipment('eq-nonexistent', ASPIRIN_SAMPLE)).toEqual([])
  })
})
