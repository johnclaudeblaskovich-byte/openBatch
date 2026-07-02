/** Stable Unit-Procedure-id → color mapping for Gantt bars. */

const PALETTE = [
  '#2563EB', // primary blue
  '#16A34A', // green
  '#D97706', // amber
  '#8B5CF6', // violet
  '#EF4444', // red
  '#0EA5E9', // sky
  '#DB2777', // pink
  '#65A30D', // lime
  '#0891B2', // cyan
  '#9333EA', // purple
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/** Deterministic color for a Unit Procedure id. */
export function upColor(unitProcedureId: string | null | undefined): string {
  if (!unitProcedureId) return '#6B7280'
  return PALETTE[hashString(unitProcedureId) % PALETTE.length]
}
