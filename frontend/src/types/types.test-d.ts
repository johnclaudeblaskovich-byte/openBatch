/**
 * Compile-time type assertions (not executed). Ensures the discriminated union narrows and the
 * key acceptance shapes type-check. `tsc -b` fails if any of these break.
 */
import type {
  AnyOperation,
  ChargeOperation,
  DistillStopCriterion,
  Project,
  Step,
  UnitProcedure,
} from '@/types'

// Project / Step / UnitProcedure are importable from '@/types'.
declare const _project: Project
declare const _step: Step
declare const _up: UnitProcedure
void _project
void _step
void _up

// Discriminated-union narrowing works in a switch.
export function describeOp(op: AnyOperation): string {
  switch (op.type) {
    case 'Charge':
      return `charge ${op.materials.length} material(s)`
    case 'React':
      return `react for ${op.reactionTimeMin} min`
    case 'Heat':
      return `heat to ${op.targetTemperatureC} C`
    default:
      return op.displayName
  }
}

// A valid Charge assignment to AnyOperation type-checks.
const _charge: AnyOperation = {
  id: 'op1',
  type: 'Charge',
  displayName: 'Charge SA',
  isEnabled: true,
  notes: '',
  startAfterConstraints: [],
  equipmentId: 'R1',
  materials: [{ materialId: 'm1', amount: 10, amountUnit: 'kg' }],
} satisfies ChargeOperation
void _charge

// DistillStopCriterion accepts a known variant.
const _stop: DistillStopCriterion = { type: 'BottomsTemperature', temperatureC: 80 }
void _stop
