import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
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
import { useStore } from '@/store'
import { toast } from '@/lib/toast'
import type { EquipmentUnit, Step } from '@/types'

interface Props {
  step: Step
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Minimal unit→kg for the fit-check volume estimate (display only, not balance math).
function toKg(amount: number, unit: string, density: number): number {
  switch (unit) {
    case 'kg':
      return amount
    case 'g':
      return amount / 1000
    case 'lb':
      return amount * 0.453592
    case 'L':
      return (amount * density) / 1000
    case 'mL':
      return (amount * density) / 1_000_000
    case 'm3':
      return amount * density
    default:
      return amount
  }
}

function workingVolume(e: EquipmentUnit): number {
  return e.maxFillVolume ?? e.totalVolume * e.workingVolumeFraction
}

export default function EquipmentReplacementDialog({ step, open, onOpenChange }: Props) {
  const project = useStore((s) => s.project)
  const replaceEquipmentInStep = useStore((s) => s.replaceEquipmentInStep)

  const equipment = useMemo(
    () => project?.facilities.find((f) => f.id === step.facilityId)?.equipmentUnits ?? [],
    [project, step.facilityId],
  )
  const materialDensity = useMemo(() => {
    const m = new Map<string, number>()
    for (const mat of project?.materials ?? []) m.set(mat.id, mat.density ?? 1000)
    return m
  }, [project])

  // Equipment currently referenced in the step.
  const usedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const up of step.unitProcedures) {
      if (up.primaryEquipmentId) ids.add(up.primaryEquipmentId)
      for (const op of up.operations) {
        for (const [k, v] of Object.entries(op as unknown as Record<string, unknown>)) {
          if ((k === 'equipmentId' || k.toLowerCase().endsWith('equipmentid')) && typeof v === 'string')
            ids.add(v)
        }
      }
    }
    return [...ids].filter((id) => equipment.some((e) => e.id === id))
  }, [step, equipment])

  const [sourceId, setSourceId] = useState('')
  const [replacementId, setReplacementId] = useState('')

  const source = equipment.find((e) => e.id === sourceId)
  const replacement = equipment.find((e) => e.id === replacementId)

  const candidates = useMemo(
    () =>
      source
        ? equipment.filter((e) => e.id !== source.id && e.equipmentClass === source.equipmentClass)
        : [],
    [equipment, source],
  )

  // Predicted batch fill (m³) on the source equipment = Σ charge volume across its UPs.
  const batchFillM3 = useMemo(() => {
    if (!source) return 0
    let vol = 0
    for (const up of step.unitProcedures) {
      if (up.primaryEquipmentId !== source.id) continue
      for (const op of up.operations) {
        const rec = op as unknown as Record<string, unknown>
        if (rec.type === 'Charge' && Array.isArray(rec.materials)) {
          for (const mat of rec.materials as Array<Record<string, unknown>>) {
            const density = materialDensity.get(mat.materialId as string) ?? 1000
            const massKg = toKg(mat.amount as number, mat.amountUnit as string, density)
            vol += massKg / density
          }
        }
      }
    }
    return vol
  }, [source, step, materialDensity])

  const newWorking = replacement ? workingVolume(replacement) : 0
  const overfill = !!replacement && batchFillM3 > newWorking

  function apply() {
    if (!source || !replacement) return
    replaceEquipmentInStep(step.id, source.id, replacement.id)
    toast(`Replaced ${source.tag} → ${replacement.tag}`)
    onOpenChange(false)
    setSourceId('')
    setReplacementId('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace Equipment — {step.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Source equipment (used in step)</Label>
            <Select value={sourceId || undefined} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment…" />
              </SelectTrigger>
              <SelectContent>
                {usedIds.map((id) => {
                  const e = equipment.find((x) => x.id === id)!
                  return (
                    <SelectItem key={id} value={id}>
                      {e.tag} ({e.equipmentClass})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Replacement (compatible units)</Label>
            <Select
              value={replacementId || undefined}
              onValueChange={setReplacementId}
              disabled={!source}
            >
              <SelectTrigger>
                <SelectValue placeholder={source ? 'Select replacement…' : 'Choose a source first'} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.tag} — working {workingVolume(e).toFixed(3)} m³
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {source && candidates.length === 0 && (
              <p className="text-xs text-muted">
                No other {source.equipmentClass} units in this facility.
              </p>
            )}
          </div>

          {replacement && (
            <div
              className={
                overfill
                  ? 'flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning'
                  : 'rounded-md border border-border bg-background px-3 py-2 text-sm text-text-secondary'
              }
            >
              {overfill && <AlertTriangle className="h-4 w-4" />}
              Predicted fill {batchFillM3.toFixed(3)} m³ vs working volume {newWorking.toFixed(3)} m³
              {overfill && ' — exceeds working volume!'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={apply} disabled={!source || !replacement}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
