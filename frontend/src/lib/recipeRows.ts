import type { AnyOperation, Project, Step } from '@/types'

export interface RecipeRow {
  kind: 'unitProcedure' | 'operation'
  /** Display number: '1' for a unit procedure, '1.1' for its first operation. */
  number: string
  /** Unit-procedure name or operation displayName. */
  label: string
  unitProcedureId: string
  /** Operation rows only. */
  operation?: AnyOperation
  /** Resolved equipment tag for operation rows (falls back to the UP's primary equipment). */
  equipmentTag?: string
}

/** Resolve the equipment id an operation occupies, falling back to the unit procedure's primary. */
function operationEquipmentId(op: AnyOperation, primaryEquipmentId: string): string {
  if ('equipmentId' in op && op.equipmentId) return op.equipmentId
  if ('sourceEquipmentId' in op && op.sourceEquipmentId) return op.sourceEquipmentId
  return primaryEquipmentId
}

/** Build a flat, numbered list of unit-procedure + operation rows in execution order. Pure. */
export function buildRecipeRows(step: Step, project: Project): RecipeRow[] {
  // Map equipmentId -> tag across all facilities.
  const tagById = new Map<string, string>()
  for (const facility of project.facilities) {
    for (const unit of facility.equipmentUnits) tagById.set(unit.id, unit.tag)
  }

  const rows: RecipeRow[] = []
  step.unitProcedures.forEach((up, ui) => {
    rows.push({
      kind: 'unitProcedure',
      number: `${ui + 1}`,
      label: up.name,
      unitProcedureId: up.id,
    })
    up.operations.forEach((op, oi) => {
      const equipId = operationEquipmentId(op, up.primaryEquipmentId)
      rows.push({
        kind: 'operation',
        number: `${ui + 1}.${oi + 1}`,
        label: op.displayName,
        unitProcedureId: up.id,
        operation: op,
        equipmentTag: tagById.get(equipId) ?? '',
      })
    })
  })
  return rows
}
