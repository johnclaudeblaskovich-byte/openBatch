import { beforeEach, describe, it, expect } from 'vitest'
import { useStore, ASPIRIN_SAMPLE } from '.'
import type { AnyOperation, Step } from '@/types'

function reset() {
  useStore.getState().loadProject(structuredClone(ASPIRIN_SAMPLE))
}

function firstStep(): Step {
  return useStore.getState().project!.processes[0].steps[0]
}

beforeEach(reset)

describe('projectSlice operation CRUD', () => {
  it('adds, updates and removes an operation', () => {
    const up = firstStep().unitProcedures[0]
    const before = up.operations.length

    const op = { id: 'test-op', type: 'Mix', displayName: 'Test Mix' } as unknown as AnyOperation
    useStore.getState().addOperation(up.id, op)
    expect(firstStep().unitProcedures[0].operations).toHaveLength(before + 1)

    useStore.getState().updateOperation('test-op', { displayName: 'Renamed' } as Partial<AnyOperation>)
    const updated = firstStep()
      .unitProcedures[0].operations.find((o) => o.id === 'test-op')!
    expect(updated.displayName).toBe('Renamed')

    useStore.getState().deleteOperation('test-op')
    expect(firstStep().unitProcedures[0].operations).toHaveLength(before)
  })
})

describe('replaceStepOperations + ReturnToOriginal round-trip', () => {
  it('multiplies the cumulative scale factor and restores on inverse', () => {
    const step = firstStep()
    const original = structuredClone(step)

    // Scale up by 2×.
    const scaled = structuredClone(original)
    useStore.getState().replaceStepOperations(step.id, scaled as Step, 2)
    expect(firstStep().currentScaleFactor).toBeCloseTo(2)

    // ReturnToOriginal applies factor 1/2 → cumulative back to 1.
    useStore.getState().replaceStepOperations(step.id, original as Step, 0.5)
    expect(firstStep().currentScaleFactor).toBeCloseTo(1)
  })
})

describe('replaceEquipmentInStep', () => {
  it('reassigns primary equipment and operation equipment references', () => {
    const step = firstStep()
    const up = step.unitProcedures[0]
    const oldEquip = up.primaryEquipmentId!
    expect(oldEquip).toBeTruthy()

    useStore.getState().replaceEquipmentInStep(step.id, oldEquip, 'NEW-EQ')

    const after = firstStep().unitProcedures[0]
    expect(after.primaryEquipmentId).toBe('NEW-EQ')
    // No operation should still reference the old equipment id.
    const stillOld = firstStep().unitProcedures.some((u) =>
      u.operations.some((o) =>
        Object.entries(o as unknown as Record<string, unknown>).some(
          ([k, v]) =>
            (k === 'equipmentId' || k.toLowerCase().endsWith('equipmentid')) && v === oldEquip,
        ),
      ),
    )
    expect(stillOld).toBe(false)
  })
})
