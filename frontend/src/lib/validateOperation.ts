import type { AnyOperation } from '@/types'

/**
 * Lightweight required-field validation for the operation dialog draft. Returns a list of
 * human-readable problems (empty = valid). Kept intentionally minimal — the authoritative
 * balance validation still runs in the backend solver.
 */
export function validateOperationDraft(op: AnyOperation): string[] {
  const rec = op as unknown as Record<string, unknown>
  const errors: string[] = []

  if (!String(rec.displayName ?? '').trim()) {
    errors.push('Display name is required.')
  }

  const str = (k: string) => (typeof rec[k] === 'string' ? (rec[k] as string) : '')

  switch (op.type) {
    case 'Charge': {
      const mats = (rec.materials as Array<Record<string, unknown>>) ?? []
      if (mats.length === 0) {
        errors.push('Add at least one material to charge.')
      }
      mats.forEach((m, i) => {
        if (!m.materialId) errors.push(`Material ${i + 1}: choose a material.`)
        if (!(Number(m.amount) > 0)) errors.push(`Material ${i + 1}: amount must be positive.`)
      })
      break
    }
    case 'Transfer':
    case 'PressureTransfer':
      if (!str('fromEquipmentId')) errors.push('Source equipment is required.')
      if (!str('toEquipmentId')) errors.push('Destination equipment is required.')
      break
    case 'React':
    case 'YieldReact':
      if (!str('reactionDataSetId')) errors.push('A reaction data set is required.')
      if (!str('equipmentId')) errors.push('Equipment is required.')
      break
    case 'Filter':
      if (!str('fromEquipmentId')) errors.push('Source equipment is required.')
      break
    default:
      break
  }

  return errors
}
