import { Fragment, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { fmtKg, fmtPct, fmtPressure, fmtTemp } from './resultFormat'
import type { REquipmentContents, StepResultView } from './resultTypes'
import { cn } from '@/lib/cn'

export default function EquipmentContentsReport({ result }: { result: StepResultView }) {
  const project = useStore((s) => s.project)

  const opName = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of result.operationResults) m.set(r.operationId, r.operationName)
    return m
  }, [result.operationResults])

  const equipName = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of project?.facilities ?? []) for (const e of f.equipmentUnits) m.set(e.id, e.name)
    return m
  }, [project])

  const matName = useMemo(() => {
    const m = new Map<string, string>()
    for (const mm of project?.materials ?? []) m.set(mm.id, mm.name)
    return m
  }, [project])

  // Group snapshots by equipment (preserve first-seen order).
  const groups = useMemo(() => {
    const g = new Map<string, REquipmentContents[]>()
    for (const snap of result.equipmentContents) {
      const list = g.get(snap.equipmentId) ?? []
      list.push(snap)
      g.set(snap.equipmentId, list)
    }
    return g
  }, [result.equipmentContents])

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (groups.size === 0) {
    return <div className="p-3 text-sm text-muted">No equipment contents recorded.</div>
  }

  const numCls = 'px-3 py-1.5 text-right font-mono tabular-nums'

  return (
    <div className="space-y-3 p-3">
      {[...groups.entries()].map(([equipId, snaps]) => {
        const materialIds = [...new Set(snaps.flatMap((s) => s.components.map((c) => c.materialId)))]
        const open = !collapsed.has(equipId)
        return (
          <section key={equipId} className="rounded-md border border-border">
            <button
              onClick={() => toggle(equipId)}
              className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm font-semibold"
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {equipName.get(equipId) ?? equipId}
            </button>
            {open && (
              <div className="overflow-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-text-secondary">
                      <th className="px-3 py-1.5 text-left">Operation</th>
                      <th className="px-3 py-1.5 text-right">Total (kg)</th>
                      <th className="px-3 py-1.5 text-right">Temp (°C)</th>
                      <th className="px-3 py-1.5 text-right">Pressure (kPa)</th>
                      <th className="px-3 py-1.5 text-right">Fill</th>
                      {materialIds.map((mid) => (
                        <th key={mid} className="px-3 py-1.5 text-right">
                          {matName.get(mid) ?? mid}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {snaps.map((snap, i) => {
                      const byMat = new Map(snap.components.map((c) => [c.materialId, c]))
                      const overfill = snap.fillPct != null && snap.fillPct > 100
                      return (
                        <tr
                          key={`${snap.afterOperationId}-${i}`}
                          className={cn('border-b border-border', overfill && 'bg-warning/10')}
                        >
                          <td className="px-3 py-1.5">
                            {opName.get(snap.afterOperationId) ?? snap.afterOperationId}
                          </td>
                          <td className={numCls}>{fmtKg(snap.totalMassKg)}</td>
                          <td className={numCls}>{fmtTemp(snap.temperatureC)}</td>
                          <td className={numCls}>{fmtPressure(snap.pressureKpa)}</td>
                          <td className={cn(numCls, overfill && 'font-semibold text-warning')}>
                            <span className="inline-flex items-center gap-1">
                              {overfill && <AlertTriangle className="h-3.5 w-3.5" />}
                              {fmtPct(snap.fillPct)}
                            </span>
                          </td>
                          {materialIds.map((mid) => (
                            <Fragment key={mid}>
                              <td className={numCls}>
                                {byMat.has(mid) ? fmtKg(byMat.get(mid)!.massKg) : '—'}
                              </td>
                            </Fragment>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
