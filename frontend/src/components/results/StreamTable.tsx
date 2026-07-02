import { Fragment, useMemo } from 'react'
import { useStore } from '@/store'
import { fmtFrac, fmtKg, fmtPressure, fmtTemp } from './resultFormat'
import type { StepResultView } from './resultTypes'

export default function StreamTable({ result }: { result: StepResultView }) {
  const project = useStore((s) => s.project)

  const { opName, equipName, matName } = useMemo(() => {
    const opName = new Map<string, string>()
    for (const r of result.operationResults) opName.set(r.operationId, r.operationName)
    const equipName = new Map<string, string>()
    for (const f of project?.facilities ?? [])
      for (const e of f.equipmentUnits) equipName.set(e.id, e.name)
    const matName = new Map<string, string>()
    for (const m of project?.materials ?? []) matName.set(m.id, m.name)
    return { opName, equipName, matName }
  }, [project, result.operationResults])

  // Distinct materials across all streams (dynamic columns).
  const materialIds = useMemo(() => {
    const set = new Set<string>()
    for (const s of result.streams) for (const c of s.components) set.add(c.materialId)
    return [...set].sort((a, b) => (matName.get(a) ?? a).localeCompare(matName.get(b) ?? b))
  }, [result.streams, matName])

  if (result.streams.length === 0) {
    return <div className="p-3 text-sm text-muted">No streams recorded for this step.</div>
  }

  const numCls = 'px-3 py-1.5 text-right font-mono tabular-nums'
  const headCls = 'sticky top-0 z-10 bg-panel px-3 py-1.5 text-left text-xs font-semibold uppercase text-text-secondary'

  return (
    <div className="overflow-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className={headCls}>Stream</th>
            <th className={headCls}>From → To</th>
            <th className={`${headCls} text-right`}>Total (kg)</th>
            <th className={`${headCls} text-right`}>Temp (°C)</th>
            <th className={`${headCls} text-right`}>Pressure (kPa)</th>
            {materialIds.map((mid) => (
              <th key={mid} className={`${headCls} text-right`} colSpan={2}>
                {matName.get(mid) ?? mid}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.streams.map((s, i) => {
            const byMat = new Map(s.components.map((c) => [c.materialId, c]))
            const from = s.sourceOperationId ? (opName.get(s.sourceOperationId) ?? s.sourceOperationId) : '—'
            const to = s.destinationEquipmentId
              ? (equipName.get(s.destinationEquipmentId) ?? s.destinationEquipmentId)
              : '—'
            return (
              <tr key={s.id} className={i % 2 ? 'bg-background' : 'bg-panel'}>
                <td className="px-3 py-1.5">{s.name ?? s.id}</td>
                <td className="px-3 py-1.5 text-text-secondary">
                  {from} → {to}
                </td>
                <td className={numCls}>{fmtKg(s.totalMassKg)}</td>
                <td className={numCls}>{fmtTemp(s.temperatureC)}</td>
                <td className={numCls}>{fmtPressure(s.pressureKpa)}</td>
                {materialIds.map((mid) => {
                  const c = byMat.get(mid)
                  const frac = c
                    ? (c.massFraction ?? (s.totalMassKg ? c.massKg / s.totalMassKg : 0))
                    : undefined
                  return (
                    <Fragment key={mid}>
                      <td className={numCls}>{c ? fmtKg(c.massKg) : '—'}</td>
                      <td className={`${numCls} text-muted`}>{c ? fmtFrac(frac) : '—'}</td>
                    </Fragment>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
