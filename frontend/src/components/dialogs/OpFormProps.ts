import type { AnyOperation } from '@/types'

/**
 * Contract every per-operation form receives: the draft op + an update(patch) callback.
 *
 * `patch` is a loose record because operation field sets are type-specific and `Partial<AnyOperation>`
 * (a union) only exposes the common BaseOperation keys.
 */
export type OpPatch = Record<string, unknown>

export interface OpFormProps {
  op: AnyOperation
  update: (patch: OpPatch) => void
}
