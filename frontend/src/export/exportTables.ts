import * as XLSX from 'xlsx'
import type { Project } from '@/types'
import type { StepResultView } from '@/components/results/resultTypes'

/**
 * A single flat, spreadsheet-ready table. `rows` is an array-of-arrays aligned to `columns`.
 * Cells are raw values (numbers stay numeric so XLSX cells are numeric); `null` renders blank.
 */
export interface ExportTable {
  /** Base name — used for the download filename and the XLSX sheet name. */
  name: string
  columns: string[]
  rows: (string | number | null)[][]
}

type Cell = string | number | null

function round(n: number | null | undefined, digits = 4): number | null {
  if (n == null || !Number.isFinite(n)) return null
  const f = 10 ** digits
  return Math.round(n * f) / f
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function escapeCsvCell(cell: Cell): string {
  if (cell == null) return ''
  const s = String(cell)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Serialize one table to RFC-4180 CSV text (CRLF line endings). */
export function toCSV(table: ExportTable): string {
  const lines = [table.columns, ...table.rows].map((row) => row.map(escapeCsvCell).join(','))
  return lines.join('\r\n')
}

/** Build an XLSX workbook (as an ArrayBuffer) with one sheet per table. */
export function toXLSX(tables: ExportTable[]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const used = new Set<string>()
  for (const t of tables) {
    const ws = XLSX.utils.aoa_to_sheet([t.columns, ...t.rows])
    // Sheet names: max 31 chars, no []:*?/\ , and must be unique.
    let name = (t.name || 'Sheet').replace(/[[\]:*?/\\]/g, ' ').slice(0, 31)
    let n = 2
    while (used.has(name.toLowerCase())) name = `${t.name.slice(0, 28)} ${n++}`
    used.add(name.toLowerCase())
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
}

// ---------------------------------------------------------------------------
// Browser downloads
// ---------------------------------------------------------------------------

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadCSV(table: ExportTable, filename = `${table.name}.csv`): void {
  triggerDownload(new Blob([toCSV(table)], { type: 'text/csv;charset=utf-8' }), filename)
}

export function downloadXLSX(tables: ExportTable[], filename: string): void {
  const buf = toXLSX(tables)
  triggerDownload(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename,
  )
}

// ---------------------------------------------------------------------------
// Result → table builders
// ---------------------------------------------------------------------------

interface NameMaps {
  op: (id: string | null | undefined) => string
  equip: (id: string | null | undefined) => string
  mat: (id: string) => string
}

function buildNameMaps(result: StepResultView, project: Project | null): NameMaps {
  const op = new Map<string, string>()
  for (const r of result.operationResults) op.set(r.operationId, r.operationName)
  const equip = new Map<string, string>()
  const mat = new Map<string, string>()
  for (const f of project?.facilities ?? [])
    for (const e of f.equipmentUnits) equip.set(e.id, e.name)
  for (const m of project?.materials ?? []) mat.set(m.id, m.name)
  return {
    op: (id) => (id ? (op.get(id) ?? id) : '—'),
    equip: (id) => (id ? (equip.get(id) ?? id) : '—'),
    mat: (id) => mat.get(id) ?? id,
  }
}

function sortedMaterialIds(ids: Iterable<string>, mat: (id: string) => string): string[] {
  return [...new Set(ids)].sort((a, b) => mat(a).localeCompare(mat(b)))
}

/** Stream table → flat export table (one row per stream, kg + mass-fraction per material). */
export function streamTableToExport(result: StepResultView, project: Project | null): ExportTable {
  const m = buildNameMaps(result, project)
  const materialIds = sortedMaterialIds(
    result.streams.flatMap((s) => s.components.map((c) => c.materialId)),
    m.mat,
  )
  const columns = [
    'Stream',
    'From',
    'To',
    'Total (kg)',
    'Temp (°C)',
    'Pressure (kPa)',
    ...materialIds.flatMap((mid) => [`${m.mat(mid)} (kg)`, `${m.mat(mid)} (frac)`]),
  ]
  const rows = result.streams.map((s) => {
    const byMat = new Map(s.components.map((c) => [c.materialId, c]))
    const matCells: Cell[] = materialIds.flatMap((mid) => {
      const c = byMat.get(mid)
      if (!c) return [null, null]
      const frac = c.massFraction ?? (s.totalMassKg ? c.massKg / s.totalMassKg : 0)
      return [round(c.massKg), round(frac)]
    })
    return [
      s.name ?? s.id,
      m.op(s.sourceOperationId),
      m.equip(s.destinationEquipmentId),
      round(s.totalMassKg),
      round(s.temperatureC),
      round(s.pressureKpa),
      ...matCells,
    ]
  })
  return { name: 'Stream Table', columns, rows }
}

/** Material balance → flat export table (one row per operation + a Total row). */
export function materialBalanceToExport(
  result: StepResultView,
  project: Project | null,
): ExportTable {
  const m = buildNameMaps(result, project)
  const columns = [
    'Operation',
    'Mass In (kg)',
    'Mass Out (kg)',
    'Accumulation (kg)',
    'Discrepancy (%)',
  ]
  const rows: Cell[][] = result.materialBalance.map((r) => [
    r.operationName || m.op(r.operationId),
    round(r.massInKg),
    round(r.massOutKg),
    round(r.accumulationKg),
    round(r.discrepancyPct),
  ])
  const totalIn = result.materialBalance.reduce((a, r) => a + r.massInKg, 0)
  const totalOut = result.materialBalance.reduce((a, r) => a + r.massOutKg, 0)
  const totalAcc = result.materialBalance.reduce((a, r) => a + r.accumulationKg, 0)
  rows.push(['Total', round(totalIn), round(totalOut), round(totalAcc), null])
  return { name: 'Material Balance', columns, rows }
}

/** Equipment contents → flat export table (one row per snapshot, kg per material). */
export function equipmentContentsToExport(
  result: StepResultView,
  project: Project | null,
): ExportTable {
  const m = buildNameMaps(result, project)
  const materialIds = sortedMaterialIds(
    result.equipmentContents.flatMap((s) => s.components.map((c) => c.materialId)),
    m.mat,
  )
  const columns = [
    'Equipment',
    'After Operation',
    'Total (kg)',
    'Temp (°C)',
    'Pressure (kPa)',
    'Fill (%)',
    ...materialIds.map((mid) => `${m.mat(mid)} (kg)`),
  ]
  const rows = result.equipmentContents.map((snap) => {
    const byMat = new Map(snap.components.map((c) => [c.materialId, c]))
    return [
      m.equip(snap.equipmentId),
      m.op(snap.afterOperationId),
      round(snap.totalMassKg),
      round(snap.temperatureC),
      round(snap.pressureKpa),
      round(snap.fillPct),
      ...materialIds.map((mid) => (byMat.has(mid) ? round(byMat.get(mid)!.massKg) : null)),
    ]
  })
  return { name: 'Equipment Contents', columns, rows }
}
