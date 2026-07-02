import type { AnyOperation } from '@/types'

export interface DurationSettings {
  defaultChargeRateKgPerMin: number
}

/** Spec default durations (minutes) applied only when neither an explicit time nor a rate is set. */
const DEFAULT_DURATION: Partial<Record<AnyOperation['type'], number>> = {
  React: 60,
  YieldReact: 60,
  Filter: 30,
}

/**
 * Resolve the duration (minutes) to display for an operation.
 *
 * - Returns the explicit `*TimeMin` field for the op type when present.
 * - Charge with no `chargeTimeMin` but a `chargeRateKgPerMin` returns `null` (computed at solve
 *   time; the table shows "—").
 * - Falls back to a spec default (React/YieldReact 60, Filter 30) only when neither an explicit
 *   time nor a rate is given.
 * - Otherwise returns `null`.
 */
export function displayDurationMin(
  op: AnyOperation,
  // Settings are accepted for parity with the solver call-site; not needed for display.
  _settings?: DurationSettings,
): number | null {
  switch (op.type) {
    case 'Charge':
      if (typeof op.chargeTimeMin === 'number') return op.chargeTimeMin
      if (typeof op.chargeRateKgPerMin === 'number') return null
      return null
    case 'Transfer':
      return op.transferTimeMin ?? null
    case 'PressureTransfer':
      return op.transferTimeMin ?? null
    case 'React':
      return op.reactionTimeMin ?? DEFAULT_DURATION.React ?? null
    case 'YieldReact':
      return op.reactionTimeMin ?? DEFAULT_DURATION.YieldReact ?? null
    case 'Crystallize':
      return op.crystallizationTimeMin ?? null
    case 'Distill':
      return op.distillationTimeMin ?? null
    case 'Filter':
      return op.filtrationTimeMin ?? DEFAULT_DURATION.Filter ?? null
    case 'WashCake':
      return op.washTimeMin ?? null
    case 'FilterDry': {
      const total = (op.filtrationTimeMin ?? 0) + (op.dryingTimeMin ?? 0)
      return total > 0 ? total : null
    }
    case 'Centrifuge':
      return op.spinTimeMin ?? null
    case 'Dry':
      return op.dryingTimeMin ?? null
    case 'Heat':
      return op.heatingTimeMin ?? null
    case 'Cool':
      return op.coolingTimeMin ?? null
    case 'Mix':
      return op.mixingTimeMin ?? null
    case 'Age':
      return op.agingTimeMin ?? null
    case 'Extract':
      return op.extractionTimeMin ?? null
    case 'Decant':
      return op.settlingTimeMin ?? null
    case 'Concentrate':
      return op.concentrationTimeMin ?? null
    case 'Ferment':
      return op.fermentationTimeMin ?? null
    default: {
      const _never: never = op
      void _never
      return null
    }
  }
}
