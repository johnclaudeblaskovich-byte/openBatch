import type { AnyOperation, Project } from '@/types'

export interface EquipmentRef {
  stepName: string
  opLabel: string
}

/** Recursively collect every equipment id referenced by an operation (any *EquipmentId field). */
function collectEquipmentIds(value: unknown, acc: Set<string>): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (const item of value) collectEquipmentIds(item, acc)
    return
  }
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string' && (key === 'equipmentId' || /EquipmentId$/.test(key))) {
      if (v) acc.add(v)
    } else if (v && typeof v === 'object') {
      collectEquipmentIds(v, acc)
    }
  }
}

function operationUsesEquipment(op: AnyOperation, equipId: string): boolean {
  const ids = new Set<string>()
  collectEquipmentIds(op, ids)
  return ids.has(equipId)
}

/** Find every operation that references the given equipment id, with a readable label. */
export function findOperationsUsingEquipment(equipId: string, project: Project): EquipmentRef[] {
  const refs: EquipmentRef[] = []
  for (const proc of project.processes) {
    for (const step of proc.steps) {
      step.unitProcedures.forEach((up, ui) => {
        // A unit procedure's primary equipment also counts as a reference.
        if (up.primaryEquipmentId === equipId) {
          refs.push({ stepName: step.name, opLabel: `${ui + 1}. ${up.name} (primary)` })
        }
        up.operations.forEach((op, oi) => {
          if (operationUsesEquipment(op, equipId)) {
            refs.push({ stepName: step.name, opLabel: `${ui + 1}.${oi + 1} ${op.displayName}` })
          }
        })
      })
    }
  }
  return refs
}
