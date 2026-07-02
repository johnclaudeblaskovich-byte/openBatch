import { useMemo } from 'react'
import { AlertTriangle, XCircle } from 'lucide-react'
import type { StepResultView } from './resultTypes'
import { cn } from '@/lib/cn'

/** Rule-violation panel: structured warnings from the backend Implicit Rules pass, by operation. */
export default function WarningsPanel({ result }: { result: StepResultView }) {
  const warnings = result.ruleWarnings ?? []

  const opName = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of result.operationResults) m.set(r.operationId, r.operationName)
    return m
  }, [result.operationResults])

  const groups = useMemo(() => {
    const g = new Map<string, typeof warnings>()
    for (const w of warnings) {
      const key = w.operationId ?? '__step__'
      const list = g.get(key) ?? []
      list.push(w)
      g.set(key, list)
    }
    return [...g.entries()]
  }, [warnings])

  if (warnings.length === 0) {
    return (
      <div className="m-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
        No rule violations — all Implicit Rules satisfied.
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      {groups.map(([opId, list]) => (
        <section key={opId} className="rounded-md border border-border">
          <header className="border-b border-border bg-background px-3 py-1.5 text-sm font-semibold text-text-primary">
            {opId === '__step__' ? 'Step' : (opName.get(opId) ?? opId)}
          </header>
          <ul className="divide-y divide-border">
            {list.map((w, i) => {
              const isError = w.severity === 'error'
              return (
                <li
                  key={`${w.rule}-${i}`}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2 text-sm',
                    isError ? 'text-error' : 'text-warning',
                  )}
                >
                  {isError ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>
                    <span className="font-mono text-xs text-muted">[{w.rule}]</span> {w.message}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
