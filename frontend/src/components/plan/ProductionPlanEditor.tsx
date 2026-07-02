import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import NumberInput from '@/components/forms/NumberInput'
import { useStore, genId } from '@/store'
import type { ProductionPlanEntry } from '@/types'
import CampaignResultsView from './CampaignResultsView'

export default function ProductionPlanEditor() {
  const project = useStore((s) => s.project)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedNodeType = useStore((s) => s.selectedNodeType)
  const renamePlan = useStore((s) => s.renamePlan)
  const addEntry = useStore((s) => s.addEntry)
  const updateEntry = useStore((s) => s.updateEntry)
  const removeEntry = useStore((s) => s.removeEntry)
  const reorderEntries = useStore((s) => s.reorderEntries)
  const upsertPlan = useStore((s) => s.upsertPlan)

  const plan =
    selectedNodeType === 'plan'
      ? project?.productionPlans.find((p) => p.id === selectedNodeId)
      : undefined

  const processes = project?.processes ?? []

  if (!plan) {
    return <div className="p-4 text-sm text-muted">Select a production plan.</div>
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid max-w-xl grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Plan name</Label>
          <Input value={plan.name} onChange={(e) => renamePlan(plan.id, e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Earliest start (min)</Label>
          <NumberInput
            value={plan.earliestStartMin}
            onChange={(v) => upsertPlan({ ...plan, earliestStartMin: v })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Entries</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              addEntry(plan.id, {
                id: genId('ple'),
                processId: processes[0]?.id ?? '',
                stepId: undefined,
                numberOfBatches: 1,
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> Entry
          </Button>
        </div>

        {plan.entries.length === 0 && (
          <div className="text-sm text-muted">No entries yet.</div>
        )}

        {plan.entries.map((entry: ProductionPlanEntry, i) => {
          const proc = processes.find((p) => p.id === entry.processId)
          const steps = proc?.steps ?? []
          return (
            <div key={entry.id} className="flex items-center gap-2">
              <Select
                value={entry.processId || undefined}
                onValueChange={(v) =>
                  updateEntry(plan.id, entry.id, { processId: v, stepId: undefined })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Process…" />
                </SelectTrigger>
                <SelectContent>
                  {processes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={entry.stepId || undefined}
                onValueChange={(v) => updateEntry(plan.id, entry.id, { stepId: v })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Step…" />
                </SelectTrigger>
                <SelectContent>
                  {steps.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <NumberInput
                className="w-20"
                value={entry.numberOfBatches}
                mustBePositive
                onChange={(v) => updateEntry(plan.id, entry.id, { numberOfBatches: v ?? 1 })}
              />
              <span className="text-xs text-muted">Batches</span>

              <div className="ml-auto flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  disabled={i === 0}
                  onClick={() => reorderEntries(plan.id, i, i - 1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  disabled={i === plan.entries.length - 1}
                  onClick={() => reorderEntries(plan.id, i, i + 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <button
                  onClick={() => removeEntry(plan.id, entry.id)}
                  className="text-muted hover:text-error"
                  aria-label="Remove entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <CampaignResultsView planId={plan.id} />
    </div>
  )
}
