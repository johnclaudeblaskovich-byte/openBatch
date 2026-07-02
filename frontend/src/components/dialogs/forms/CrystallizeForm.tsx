import { Plus, X } from 'lucide-react'
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import NumberInput from '@/components/forms/NumberInput'
import MaterialPicker from '@/components/materials/MaterialPicker'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'
import type { PhaseType } from '@/types'

const PHASES: PhaseType[] = ['Solid', 'Liquid', 'Gas', 'Mixed']

interface CrystalSeparation {
  materialId: string
  phase: PhaseType
  separationPct: number
}

export default function CrystallizeForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const seps = r.arr<CrystalSeparation>('separations')

  function setSeps(next: CrystalSeparation[]) {
    update({ separations: next })
  }

  return (
    <div className="space-y-4">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Crystal separations</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSeps([...seps, { materialId: '', phase: 'Solid', separationPct: 0 }])}
          >
            <Plus className="h-3.5 w-3.5" /> Separation
          </Button>
        </div>
        {seps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <MaterialPicker
              className="flex-1"
              value={s.materialId}
              onChange={(materialId) => {
                const next = seps.slice()
                next[i] = { ...s, materialId }
                setSeps(next)
              }}
            />
            <Select
              value={s.phase}
              onValueChange={(p) => {
                const next = seps.slice()
                next[i] = { ...s, phase: p as PhaseType }
                setSeps(next)
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NumberInput
              className="w-24"
              value={s.separationPct}
              onChange={(v) => {
                const next = seps.slice()
                next[i] = { ...s, separationPct: v ?? 0 }
                setSeps(next)
              }}
            />
            <button
              type="button"
              onClick={() => setSeps(seps.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-error"
              aria-label="Remove separation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Target temperature (°C)">
          <NumberInput
            value={r.num('targetTemperatureC')}
            onChange={(v) => update({ targetTemperatureC: v })}
          />
        </Field>
        <Field label="Crystallization time (min)">
          <NumberInput
            value={r.num('crystallizationTimeMin')}
            onChange={(v) => update({ crystallizationTimeMin: v })}
          />
        </Field>
        <Field label="Condenser equipment">
          <EquipmentSelect
            value={r.str('condenserEquipmentId')}
            onChange={(id) => update({ condenserEquipmentId: id })}
          />
        </Field>
      </div>
    </div>
  )
}
