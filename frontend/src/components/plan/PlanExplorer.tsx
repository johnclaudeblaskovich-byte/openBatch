import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'

/** Plan Explorer: lists production plans and their entries; selecting a plan opens the editor. */
export default function PlanExplorer() {
  const project = useStore((s) => s.project)
  const plans = project?.productionPlans ?? []
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedNodeType = useStore((s) => s.selectedNodeType)
  const select = useStore((s) => s.select)
  const setEditorTab = useStore((s) => s.setEditorTab)
  const addPlan = useStore((s) => s.addPlan)

  const nameMaps = useMemo(() => {
    const procName = new Map<string, string>()
    const stepName = new Map<string, string>()
    for (const p of project?.processes ?? []) {
      procName.set(p.id, p.name)
      for (const s of p.steps) stepName.set(s.id, s.name)
    }
    return { procName, stepName }
  }, [project])

  function openPlan(id: string) {
    select(id, 'plan')
    setEditorTab('plan')
  }

  function createPlan() {
    const id = addPlan(`Plan ${plans.length + 1}`)
    openPlan(id)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-1">
        <Button size="sm" variant="outline" className="w-full" onClick={createPlan}>
          <Plus className="h-3.5 w-3.5" /> Plan
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-1">
        {plans.length === 0 && <div className="px-2 py-1.5 text-sm text-muted">No plans.</div>}
        {plans.map((plan) => {
          const isSelected = selectedNodeType === 'plan' && plan.id === selectedNodeId
          return (
            <div key={plan.id}>
              <button
                onClick={() => openPlan(plan.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1 text-left text-sm',
                  isSelected ? 'bg-primary/10 text-text-primary' : 'hover:bg-background',
                )}
              >
                <span className="truncate">{plan.name}</span>
                <span className="shrink-0 text-xs text-muted">{plan.entries.length}</span>
              </button>
              {plan.entries.map((e) => (
                <div key={e.id} className="truncate px-2 py-0.5 pl-6 text-xs text-text-secondary">
                  {e.numberOfBatches}× {nameMaps.stepName.get(e.stepId ?? '') ?? '(no step)'}
                  <span className="text-muted"> · {nameMaps.procName.get(e.processId) ?? '—'}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
