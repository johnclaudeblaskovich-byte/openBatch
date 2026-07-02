import { useMemo, useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui'
import { useStore } from '@/store'
import { buildRecipeRows, type RecipeRow } from '@/lib/recipeRows'
import { opColor } from '@/lib/opColor'
import { displayDurationMin } from '@/lib/opDuration'
import { operationStatus, type OperationStatus } from '@/lib/opStatus'
import { createOperation, type CreatableOperationType } from '@/lib/makeOperation'
import OperationTypePicker from '@/components/recipe/OperationTypePicker'
import ScaleUpDialog from '@/components/dialogs/ScaleUpDialog'
import EquipmentReplacementDialog from '@/components/dialogs/EquipmentReplacementDialog'
import TextRecipeView from '@/components/recipe/TextRecipeView'
import StepReport from '@/components/report/StepReport'
import type { StepResultView } from '@/components/results/resultTypes'
import { resolveStep } from '@/lib/resolveStep'
import { cn } from '@/lib/cn'
import { FileText, Maximize2, Replace, Printer } from 'lucide-react'

function StatusPill({ status }: { status: OperationStatus }) {
  if (status === 'done')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
        ✓ done
      </span>
    )
  if (status === 'scheduled')
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
        scheduled
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full bg-background px-2 py-0.5 text-xs text-muted">
      pending
    </span>
  )
}

export default function RecipeView() {
  const project = useStore((s) => s.project)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedNodeType = useStore((s) => s.selectedNodeType)
  const defaultChargeRateKgPerMin = useStore((s) => s.defaultChargeRateKgPerMin)

  const select = useStore((s) => s.select)
  const openDialog = useStore((s) => s.openDialog)
  const addUnitProcedure = useStore((s) => s.addUnitProcedure)
  const deleteUnitProcedure = useStore((s) => s.deleteUnitProcedure)
  const addOperation = useStore((s) => s.addOperation)
  const deleteOperation = useStore((s) => s.deleteOperation)
  const reorderOperation = useStore((s) => s.reorderOperation)

  const step = resolveStep(project, selectedNodeId, selectedNodeType)
  const result = useStore((s) => (step ? s.resultsByStepId[step.id] : undefined))

  const [pickerOpen, setPickerOpen] = useState(false)
  const [scaleOpen, setScaleOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [textMode, setTextMode] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const rows = useMemo<RecipeRow[]>(
    () => (step && project ? buildRecipeRows(step, project) : []),
    [step, project],
  )

  // Locate the selected operation within its unit procedure (for move/delete/add targeting).
  const selectedLoc = useMemo(() => {
    if (!step) return null
    for (const up of step.unitProcedures) {
      const idx = up.operations.findIndex((o) => o.id === selectedNodeId)
      if (idx !== -1) return { upId: up.id, index: idx, count: up.operations.length }
    }
    return null
  }, [step, selectedNodeId])

  if (!step) return <div className="p-4 text-sm text-muted">Select a step to view its recipe.</div>

  // Target unit procedure for "+ Operation": the selected UP, the selected op's UP, or the last UP.
  const targetUpId =
    selectedNodeType === 'unitProcedure'
      ? selectedNodeId
      : (selectedLoc?.upId ?? step.unitProcedures.at(-1)?.id ?? null)

  const opSelected = selectedNodeType === 'operation' && !!selectedLoc
  const canMoveUp = opSelected && selectedLoc!.index > 0
  const canMoveDown = opSelected && selectedLoc!.index < selectedLoc!.count - 1

  function handleAddOperation(type: CreatableOperationType) {
    if (targetUpId) addOperation(targetUpId, createOperation(type))
  }

  function handleDelete() {
    if (selectedNodeType === 'operation' && selectedNodeId) deleteOperation(selectedNodeId)
    else if (selectedNodeType === 'unitProcedure' && selectedNodeId)
      deleteUnitProcedure(selectedNodeId)
  }

  function handleMove(dir: -1 | 1) {
    if (!selectedLoc) return
    reorderOperation(selectedLoc.upId, selectedLoc.index, selectedLoc.index + dir)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        <Button size="sm" variant="outline" onClick={() => addUnitProcedure(step.id)}>
          <Plus className="h-3.5 w-3.5" /> Unit Procedure
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!targetUpId}
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Operation
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button
          size="sm"
          variant="outline"
          disabled={!canMoveUp}
          onClick={() => handleMove(-1)}
          aria-label="Move up"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!canMoveDown}
          onClick={() => handleMove(1)}
          aria-label="Move down"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={
            !(
              (selectedNodeType === 'operation' || selectedNodeType === 'unitProcedure') &&
              selectedNodeId
            )
          }
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant={textMode ? 'default' : 'outline'}
            onClick={() => setTextMode((v) => !v)}
          >
            <FileText className="h-3.5 w-3.5" /> Text Recipe
          </Button>
          <Button size="sm" variant="outline" onClick={() => setReportOpen(true)}>
            <Printer className="h-3.5 w-3.5" /> Report / Print
          </Button>
          <Button size="sm" variant="outline" onClick={() => setReplaceOpen(true)}>
            <Replace className="h-3.5 w-3.5" /> Replace Equipment…
          </Button>
          <Button size="sm" variant="outline" onClick={() => setScaleOpen(true)}>
            <Maximize2 className="h-3.5 w-3.5" /> Scale Up…
          </Button>
        </div>
      </div>

      <ScaleUpDialog step={step} open={scaleOpen} onOpenChange={setScaleOpen} />
      <EquipmentReplacementDialog step={step} open={replaceOpen} onOpenChange={setReplaceOpen} />
      {reportOpen && project && (
        <StepReport
          step={step}
          project={project}
          result={result as unknown as StepResultView | undefined}
          onClose={() => setReportOpen(false)}
        />
      )}

      {textMode && project ? (
        <div className="min-h-0 flex-1">
          <TextRecipeView step={step} project={project} />
        </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <h2 className="mb-2 text-sm font-semibold text-text-primary">{step.name}</h2>
        <table className="w-full table-fixed border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
              <th className="w-14 px-2 py-1.5">#</th>
              <th className="px-2 py-1.5">Operation</th>
              <th className="w-28 px-2 py-1.5">Equipment</th>
              <th className="w-24 px-2 py-1.5">Time (min)</th>
              <th className="w-28 px-2 py-1.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              if (row.kind === 'unitProcedure') {
                const isSelected =
                  selectedNodeType === 'unitProcedure' && selectedNodeId === row.unitProcedureId
                return (
                  <tr
                    key={row.unitProcedureId}
                    onClick={() => select(row.unitProcedureId, 'unitProcedure')}
                    className={cn(
                      'cursor-pointer border-b border-border',
                      isSelected ? 'bg-primary/10' : 'bg-panel',
                    )}
                  >
                    <td className="px-2 py-1.5 font-semibold text-text-primary">{row.number}.</td>
                    <td className="px-2 py-1.5 font-semibold text-text-primary" colSpan={2}>
                      {row.label}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-muted">[Unit Proc]</td>
                    <td className="px-2 py-1.5" />
                  </tr>
                )
              }
              const op = row.operation!
              const duration = displayDurationMin(op, { defaultChargeRateKgPerMin })
              const status = operationStatus(op, result)
              const isSelected = selectedNodeType === 'operation' && selectedNodeId === op.id
              return (
                <tr
                  key={op.id}
                  onClick={() => select(op.id, 'operation')}
                  onDoubleClick={() => openDialog('operation', op.id)}
                  className={cn(
                    'cursor-pointer border-b border-border',
                    isSelected
                      ? 'bg-primary/10'
                      : idx % 2 === 0
                        ? 'bg-panel'
                        : 'bg-background',
                  )}
                >
                  <td className="px-2 py-1.5 text-text-secondary">{row.number}</td>
                  <td className="px-2 py-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-[2px]"
                        style={{ backgroundColor: opColor(op.type) }}
                      />
                      <span className="truncate">{row.label}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-text-secondary">{row.equipmentTag || '—'}</td>
                  <td className="px-2 py-1.5 text-text-secondary">
                    {duration === null ? '—' : duration}
                  </td>
                  <td className="px-2 py-1.5">
                    <StatusPill status={status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      )}

      <OperationTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={handleAddOperation}
      />
    </div>
  )
}
