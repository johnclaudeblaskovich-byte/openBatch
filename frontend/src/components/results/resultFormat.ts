/** Shared number formatters for the result tabs. */

export function fmtKg(v: number | null | undefined): string {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(3)
}

export function fmtFrac(v: number | null | undefined): string {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(4)
}

export function fmtTemp(v: number | null | undefined): string {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(1)
}

export function fmtPressure(v: number | null | undefined): string {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(1)
}

export function fmtPct(v: number | null | undefined): string {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : `${v.toFixed(2)}%`
}
