import { describe, it, expect } from 'vitest'
import { operationStatus } from './opStatus'
import type { AnyOperation, StepSimulationResult } from '@/types'

const op: AnyOperation = {
  id: 'op-react',
  type: 'React',
  displayName: 'React',
  isEnabled: true,
  notes: '',
  startAfterConstraints: [],
  equipmentId: 'e',
  reactionDataSetId: 'x',
  reactionTimeMin: 60,
}

function resultWith(opId: string): StepSimulationResult {
  return {
    stepId: 's',
    operationResults: [
      { operationId: opId, startMin: 0, endMin: 60, durationMin: 60, inputs: [], outputs: [] },
    ],
    streams: [],
    finalEquipmentContents: [],
    materialBalance: [],
    totalCycleTimeMin: 60,
    warnings: [],
    solvedAt: '2026-01-01T00:00:00Z',
  }
}

describe('operationStatus', () => {
  it('is pending when there is no step result', () => {
    expect(operationStatus(op, undefined)).toBe('pending')
  })

  it('is scheduled when scheduled but not yet solved', () => {
    const scheduled = { ...op, scheduled: { startMin: 0, endMin: 60, equipmentIds: ['e'] } }
    expect(operationStatus(scheduled, undefined)).toBe('scheduled')
  })

  it('is done when a matching OperationResult exists', () => {
    expect(operationStatus(op, resultWith('op-react'))).toBe('done')
  })
})
