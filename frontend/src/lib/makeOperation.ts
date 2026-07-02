import type { AnyOperation } from '@/types'
import { genId } from '@/store'

export type CreatableOperationType = AnyOperation['type']

interface BaseFields {
  id: string
  displayName: string
  isEnabled: true
  notes: string
  startAfterConstraints: never[]
}

function base(type: CreatableOperationType): BaseFields {
  return {
    id: genId('op'),
    displayName: type,
    isEnabled: true,
    notes: '',
    startAfterConstraints: [],
  }
}

/**
 * Build a new operation of the given type with sensible defaults. Required type-specific fields
 * are populated with empty / neutral values so the object satisfies its interface immediately.
 * Reused by the Process Explorer context menu and the Recipe View operation-type picker.
 */
export function createOperation(type: CreatableOperationType): AnyOperation {
  const b = base(type)
  switch (type) {
    case 'Charge':
      return { ...b, type, equipmentId: '', materials: [] }
    case 'Transfer':
      return { ...b, type, sourceEquipmentId: '', destinationEquipmentId: '' }
    case 'PressureTransfer':
      return { ...b, type, sourceEquipmentId: '', destinationEquipmentId: '' }
    case 'React':
      return { ...b, type, equipmentId: '', reactionDataSetId: '', reactionTimeMin: 60 }
    case 'YieldReact':
      return { ...b, type, equipmentId: '', yields: [], reactionTimeMin: 60 }
    case 'Crystallize':
      return { ...b, type, equipmentId: '', productMaterialId: '' }
    case 'Distill':
      return {
        ...b,
        type,
        equipmentId: '',
        separation: { componentSplits: {} },
        stopCriterion: { type: 'Time', timeMin: 60 },
      }
    case 'Filter':
      return { ...b, type, equipmentId: '' }
    case 'WashCake':
      return {
        ...b,
        type,
        equipmentId: '',
        washMaterialId: '',
        washAmount: 0,
        washAmountUnit: 'kg',
      }
    case 'FilterDry':
      return { ...b, type, equipmentId: '' }
    case 'Centrifuge':
      return { ...b, type, equipmentId: '' }
    case 'Dry':
      return { ...b, type, equipmentId: '' }
    case 'Extract':
      return {
        ...b,
        type,
        equipmentId: '',
        solventMaterialId: '',
        solventAmount: 0,
        solventAmountUnit: 'kg',
        separation: { componentDistribution: {} },
      }
    case 'Decant':
      return { ...b, type, equipmentId: '', separation: { keptPhase: 'Heavy' } }
    case 'Concentrate':
      return { ...b, type, equipmentId: '' }
    case 'Heat':
      return { ...b, type, equipmentId: '', targetTemperatureC: 25 }
    case 'Cool':
      return { ...b, type, equipmentId: '', targetTemperatureC: 25 }
    case 'Mix':
      return { ...b, type, equipmentId: '' }
    case 'Age':
      return { ...b, type, equipmentId: '' }
    case 'Ferment':
      return { ...b, type, equipmentId: '', cellMaterialId: '' }
    default: {
      // Exhaustiveness guard.
      const _never: never = type
      throw new Error(`Unsupported operation type: ${String(_never)}`)
    }
  }
}
