import type { OperationType } from '@/types'

/**
 * Operation status-dot color by operation type, per the design system. Used by the Process
 * Explorer tree and the Recipe View so the two always agree.
 */
const OP_COLOR_GROUPS: Record<string, OperationType[]> = {
  // Charge/Transfer — indigo
  '#6366F1': ['Charge', 'Transfer', 'PressureTransfer', 'MultipleTransfer'],
  // React/Yield — red-orange
  '#EF4444': ['React', 'YieldReact', 'ReactDistill'],
  // Filter/Centrifuge — violet
  '#8B5CF6': ['Filter', 'WashCake', 'FilterDry', 'Centrifuge', 'Crystallize', 'Distill'],
  // Dry — amber
  '#F59E0B': ['Dry', 'AirDry', 'FluidBedDry', 'FreezeDry'],
  // Heat/Cool — sky
  '#0EA5E9': ['Heat', 'Cool'],
  // Mix/Age — gray
  '#6B7280': ['Mix', 'Age'],
}

const OP_COLOR_BY_TYPE = new Map<OperationType, string>()
for (const [color, types] of Object.entries(OP_COLOR_GROUPS)) {
  for (const t of types) OP_COLOR_BY_TYPE.set(t, color)
}

/** Custom / fallback — lime. */
const CUSTOM_COLOR = '#84CC16'

export function opColor(type: OperationType): string {
  return OP_COLOR_BY_TYPE.get(type) ?? CUSTOM_COLOR
}
