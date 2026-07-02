import { AlertTriangle } from 'lucide-react'
import { fmtKg, fmtPct } from './resultFormat'
import type { StepResultView } from './resultTypes'
import { cn } from '@/lib/cn'

const TOL = 0.1

export default function MaterialBalanceReport({ result }: { result: StepResultView }) {
  const rows = result.materialBalance
  const offenders = rows.filter((r) => Math.abs(r.discrepancyPct) > TOL)

  const totalIn = rows.reduce((a, r) => a + r.massInKg, 0)
  const totalOut = rows.reduce((a, r) => a + r.massOutKg, 0)
  const totalAcc = rows.reduce((a, r) => a + r.accumulationKg, 0)

  const numCls = 'px-3 py-1.5 text-right font-mono tabular-nums'

  return (
    <div className="p-3">
      {/* Summary banner */}
      {offenders.length === 0 ? (
        <div className="mb-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          All operations balanced
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" />
          {offenders.length} operation(s) exceed 0.1% tolerance
        </div>
      )}

      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase text-text-secondary">
            <th className="px-3 py-1.5 text-left">Operation</th>
            <th className="px-3 py-1.5 text-right">Mass In (kg)</th>
            <th className="px-3 py-1.5 text-right">Mass Out (kg)</th>
            <th className="px-3 py-1.5 text-right">Accumulation (kg)</th>
            <th className="px-3 py-1.5 text-right">Discrepancy (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const flagged = Math.abs(r.discrepancyPct) > TOL
            return (
              <tr
                key={r.operationId}
                className={cn('border-b border-border', flagged && 'bg-warning/10')}
              >
                <td className="px-3 py-1.5">
                  <span className="flex items-center gap-1.5">
                    {flagged && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                    {r.operationName}
                  </span>
                </td>
                <td className={numCls}>{fmtKg(r.massInKg)}</td>
                <td className={numCls}>{fmtKg(r.massOutKg)}</td>
                <td className={numCls}>{fmtKg(r.accumulationKg)}</td>
                <td className={cn(numCls, flagged && 'font-semibold text-warning')}>
                  {fmtPct(r.discrepancyPct)}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-background font-medium">
            <td className="px-3 py-1.5">Total</td>
            <td className={numCls}>{fmtKg(totalIn)}</td>
            <td className={numCls}>{fmtKg(totalOut)}</td>
            <td className={numCls}>{fmtKg(totalAcc)}</td>
            <td className="px-3 py-1.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
