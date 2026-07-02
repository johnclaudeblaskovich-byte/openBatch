import { describe, it, expect } from 'vitest'
import { displayDurationMin } from './opDuration'
import type { AnyOperation } from '@/types'

const settings = { defaultChargeRateKgPerMin: 100 }

function charge(extra: Partial<Extract<AnyOperation, { type: 'Charge' }>>): AnyOperation {
  return {
    id: 'c',
    type: 'Charge',
    displayName: 'Charge',
    isEnabled: true,
    notes: '',
    startAfterConstraints: [],
    equipmentId: 'e',
    materials: [],
    ...extra,
  }
}

describe('displayDurationMin', () => {
  it('returns explicit chargeTimeMin', () => {
    expect(displayDurationMin(charge({ chargeTimeMin: 15 }), settings)).toBe(15)
  })

  it('returns null for a Charge with only a charge rate', () => {
    expect(displayDurationMin(charge({ chargeRateKgPerMin: 50 }), settings)).toBeNull()
  })

  it('applies the React default (60) when no time is given', () => {
    const react: AnyOperation = {
      id: 'r',
      type: 'React',
      displayName: 'React',
      isEnabled: true,
      notes: '',
      startAfterConstraints: [],
      equipmentId: 'e',
      reactionDataSetId: 'x',
      // reactionTimeMin omitted via cast to exercise the default path
    } as unknown as AnyOperation
    expect(displayDurationMin(react, settings)).toBe(60)
  })

  it('applies the Filter default (30) when no time is given', () => {
    const filter: AnyOperation = {
      id: 'f',
      type: 'Filter',
      displayName: 'Filter',
      isEnabled: true,
      notes: '',
      startAfterConstraints: [],
      equipmentId: 'e',
    }
    expect(displayDurationMin(filter, settings)).toBe(30)
  })
})
