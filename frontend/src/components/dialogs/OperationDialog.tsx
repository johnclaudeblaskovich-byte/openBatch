import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { useStore } from '@/store'
import type { AnyOperation, Step } from '@/types'
import { renderMainTab, renderModelTab } from './dialogRegistry'
import StartAfterEditor from './shared/StartAfterEditor'
import { validateOperationDraft } from '@/lib/validateOperation'
import './forms/register'

function findOpAndStep(
  project: ReturnType<typeof useStore.getState>['project'],
  opId: string | undefined,
): { op: AnyOperation; step: Step } | null {
  if (!project || !opId) return null
  for (const proc of project.processes)
    for (const step of proc.steps)
      for (const up of step.unitProcedures) {
        const op = up.operations.find((o) => o.id === opId)
        if (op) return { op, step }
      }
  return null
}

/** Modal operation editor: Main / Model / Schedule / Notes tabs over a local draft. */
export default function OperationDialog() {
  const activeDialog = useStore((s) => s.activeDialog)
  const closeDialog = useStore((s) => s.closeDialog)
  const updateOperation = useStore((s) => s.updateOperation)
  const project = useStore((s) => s.project)
  const resultsByStepId = useStore((s) => s.resultsByStepId)

  const open = activeDialog?.kind === 'operation'
  const found = findOpAndStep(project, activeDialog?.opId)

  const [draft, setDraft] = useState<AnyOperation | null>(null)
  useEffect(() => {
    setDraft(found ? structuredClone(found.op) : null)
    // Only re-init when the targeted operation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDialog?.opId])

  if (!open || !found || !draft) return null
  const { step } = found

  const update = (patch: Record<string, unknown>) =>
    setDraft((prev) => (prev ? ({ ...prev, ...patch } as AnyOperation) : prev))

  const problems = validateOperationDraft(draft)

  function save() {
    if (!draft || problems.length > 0) return
    updateOperation(draft.id, draft)
    closeDialog()
  }

  // Scheduled timing from a prior solve, if any.
  const stepResult = resultsByStepId[step.id] as unknown as
    | { operationResults?: Array<Record<string, unknown>> }
    | undefined
  const sched = stepResult?.operationResults?.find((r) => r.operationId === draft.id)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {draft.displayName}{' '}
            <span className="text-sm font-normal text-text-secondary">({draft.type})</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="main" className="min-h-[20rem]">
          <TabsList>
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="max-h-[55vh] overflow-auto p-1">
            {renderMainTab({ op: draft, update })}
          </TabsContent>

          <TabsContent value="model" className="p-1">
            {renderModelTab({ op: draft, update })}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 p-1">
            <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              {sched ? (
                <div className="font-mono">
                  start {String(sched.scheduledStartMin)} → end {String(sched.scheduledEndMin)} min
                  (duration {String(sched.durationMin)})
                </div>
              ) : (
                <span className="text-muted">Not yet scheduled — run a simulation.</span>
              )}
            </div>
            <StartAfterEditor op={draft} step={step} update={update} />
          </TabsContent>

          <TabsContent value="notes" className="p-1">
            <textarea
              className="h-40 w-full rounded-md border border-border bg-panel p-2 text-sm"
              value={draft.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Notes…"
            />
          </TabsContent>
        </Tabs>

        {problems.length > 0 && (
          <ul className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
            {problems.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => closeDialog()}>
            Cancel
          </Button>
          <Button onClick={save} disabled={problems.length > 0}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
