import { beforeEach, describe, expect, it } from 'vitest'
import type { AnyOperation } from '@/types'
import { useStore } from './index'
import { ASPIRIN_SAMPLE } from './sampleProject'

function findUp(upId: string) {
  const project = useStore.getState().project!
  for (const proc of project.processes) {
    for (const step of proc.steps) {
      const up = step.unitProcedures.find((u) => u.id === upId)
      if (up) return up
    }
  }
  throw new Error(`unit procedure ${upId} not found`)
}

function makeCharge(id: string): AnyOperation {
  return {
    id,
    type: 'Charge',
    displayName: 'Charge X',
    isEnabled: true,
    notes: '',
    startAfterConstraints: [],
    equipmentId: 'eq-reactor1',
    materials: [{ materialId: 'mat-water', amount: 5, amountUnit: 'kg' }],
  }
}

beforeEach(() => {
  // Reset to a known state before each test.
  useStore.getState().loadProject(ASPIRIN_SAMPLE)
  useStore.setState({ selectedNodeId: null, selectedNodeType: null })
})

describe('projectSlice', () => {
  it('loadProject populates non-empty processes', () => {
    const project = useStore.getState().project
    expect(project).not.toBeNull()
    expect(project!.processes.length).toBeGreaterThan(0)
  })

  it('addOperation then deleteOperation leaves the op count unchanged', () => {
    const before = findUp('up-reaction').operations.length
    useStore.getState().addOperation('up-reaction', makeCharge('op-tmp'))
    expect(findUp('up-reaction').operations.length).toBe(before + 1)
    useStore.getState().deleteOperation('op-tmp')
    expect(findUp('up-reaction').operations.length).toBe(before)
  })

  it('reorderOperation(up, 0, 2) moves the first op to the end', () => {
    expect(findUp('up-reaction').operations.map((o) => o.id)).toEqual([
      'op-charge-sa',
      'op-charge-aan',
      'op-react',
    ])
    useStore.getState().reorderOperation('up-reaction', 0, 2)
    expect(findUp('up-reaction').operations.map((o) => o.id)).toEqual([
      'op-charge-aan',
      'op-react',
      'op-charge-sa',
    ])
  })

  it('mutating via an action does not mutate the previous state reference (Immer)', () => {
    const before = useStore.getState().project
    useStore.getState().addOperation('up-reaction', makeCharge('op-immutable'))
    const after = useStore.getState().project
    expect(after).not.toBe(before)
    // The previous snapshot still has the original op count.
    const beforeUp = before!.processes[0].steps[0].unitProcedures.find(
      (u) => u.id === 'up-reaction',
    )!
    expect(beforeUp.operations.some((o) => o.id === 'op-immutable')).toBe(false)
  })

  it('updateOperation patches an operation in place', () => {
    useStore.getState().updateOperation('op-react', { displayName: 'React (modified)' })
    const op = findUp('up-reaction').operations.find((o) => o.id === 'op-react')!
    expect(op.displayName).toBe('React (modified)')
  })
})

describe('uiSlice', () => {
  it('selectedNodeType is null initially and becomes "step" after select', () => {
    expect(useStore.getState().selectedNodeType).toBeNull()
    useStore.getState().select('step-1', 'step')
    expect(useStore.getState().selectedNodeId).toBe('step-1')
    expect(useStore.getState().selectedNodeType).toBe('step')
  })
})

describe('planSlice', () => {
  it('adds, renames, and deletes a plan', () => {
    const before = useStore.getState().getPlans().length
    const id = useStore.getState().addPlan('New Plan', 30)
    expect(useStore.getState().getPlans().length).toBe(before + 1)
    useStore.getState().renamePlan(id, 'Renamed')
    expect(useStore.getState().getPlans().find((p) => p.id === id)?.name).toBe('Renamed')
    useStore.getState().deletePlan(id)
    expect(useStore.getState().getPlans().find((p) => p.id === id)).toBeUndefined()
  })

  it('adds, reorders and removes entries', () => {
    const id = useStore.getState().addPlan('P')
    useStore.getState().addEntry(id, { id: 'e1', processId: 'proc-1', numberOfBatches: 1 })
    useStore.getState().addEntry(id, { id: 'e2', processId: 'proc-1', numberOfBatches: 2 })
    const plan = () => useStore.getState().getPlans().find((p) => p.id === id)!
    expect(plan().entries.map((e) => e.id)).toEqual(['e1', 'e2'])
    useStore.getState().reorderEntries(id, 0, 1)
    expect(plan().entries.map((e) => e.id)).toEqual(['e2', 'e1'])
    useStore.getState().removeEntry(id, 'e2')
    expect(plan().entries.map((e) => e.id)).toEqual(['e1'])
    useStore.getState().deletePlan(id)
  })
})
