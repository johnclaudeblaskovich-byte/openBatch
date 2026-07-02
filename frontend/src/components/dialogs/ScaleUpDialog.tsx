import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import NumberInput from '@/components/forms/NumberInput'
import { useStore } from '@/store'
import { applyScaleUp, previewScaleUp, type ScaleUpMode, type ScaleUpParams } from '@/api/scaleup'
import { toast } from '@/lib/toast'
import type { Step } from '@/types'

const MODES: { value: ScaleUpMode; label: string }[] = [
  { value: 'MaxBatchCurrentEquipment', label: 'Max batch — current equipment' },
  { value: 'MaxBatchSpecificEquipment', label: 'Max batch — specific equipment' },
  { value: 'TargetBatchSize', label: 'Target batch size' },
  { value: 'MultipleOfCurrent', label: 'Multiple of current' },
  { value: 'ReturnToOriginal', label: 'Return to original' },
]

interface Props {
  step: Step
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ScaleUpDialog({ step, open, onOpenChange }: Props) {
  const project = useStore((s) => s.project)
  const replaceStepOperations = useStore((s) => s.replaceStepOperations)

  const [mode, setMode] = useState<ScaleUpMode>('TargetBatchSize')
  const [targetMassKg, setTargetMassKg] = useState<number | undefined>(undefined)
  const [multiplier, setMultiplier] = useState<number | undefined>(2)
  const [equipmentId, setEquipmentId] = useState<string | undefined>(undefined)
  const [preview, setPreview] = useState<{ factor: number; predictedOutputKg: number } | null>(null)

  const equipment =
    project?.facilities.find((f) => f.id === step.facilityId)?.equipmentUnits ?? []

  function buildParams(): ScaleUpParams {
    return {
      targetMassKg,
      multiplier,
      equipmentId,
      currentScaleFactor: step.currentScaleFactor ?? 1,
    }
  }

  async function doPreview() {
    if (!project) return
    try {
      setPreview(await previewScaleUp(project, step.id, mode, buildParams()))
    } catch (e) {
      toast(`Preview failed: ${(e as Error).message}`)
    }
  }

  async function doApply() {
    if (!project) return
    try {
      const { factor, scaledStep } = await applyScaleUp(project, step.id, mode, buildParams())
      replaceStepOperations(step.id, scaledStep, factor)
      toast(`Applied scale factor ${factor.toFixed(3)}`)
      onOpenChange(false)
      setPreview(null)
    } catch (e) {
      toast(`Apply failed: ${(e as Error).message}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scale Up — {step.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Mode</Label>
            <Select
              value={mode}
              onValueChange={(v) => {
                setMode(v as ScaleUpMode)
                setPreview(null)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === 'TargetBatchSize' && (
            <div className="space-y-1">
              <Label>Target mass (kg)</Label>
              <NumberInput value={targetMassKg} mustBePositive onChange={setTargetMassKg} />
            </div>
          )}
          {mode === 'MultipleOfCurrent' && (
            <div className="space-y-1">
              <Label>Multiplier</Label>
              <NumberInput value={multiplier} mustBePositive onChange={setMultiplier} />
            </div>
          )}
          {mode === 'MaxBatchSpecificEquipment' && (
            <div className="space-y-1">
              <Label>Equipment</Label>
              <Select value={equipmentId || undefined} onValueChange={setEquipmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment…" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.tag} ({e.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {mode === 'ReturnToOriginal' && (
            <p className="text-sm text-text-secondary">
              Current scale factor: {(step.currentScaleFactor ?? 1).toFixed(3)} — this reverts to the
              original amounts.
            </p>
          )}

          {preview && (
            <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <div>
                Scale factor: <span className="font-mono font-semibold">{preview.factor.toFixed(4)}</span>
              </div>
              <div>
                Predicted output:{' '}
                <span className="font-mono">{preview.predictedOutputKg.toFixed(3)} kg</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={doPreview}>
            Preview
          </Button>
          <Button onClick={doApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
