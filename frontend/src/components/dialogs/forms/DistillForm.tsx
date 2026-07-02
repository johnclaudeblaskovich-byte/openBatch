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
import ContinuousFeedEditor from '../shared/ContinuousFeedEditor'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'
import type { ContinuousFeed } from '@/types'

interface DistillSeparation {
  materialId: string
  goesTo: 'Overhead' | 'Bottoms'
  pct: number
}

type StopType = 'AmountRemoved' | 'AmountRetained' | 'BottomsTemperature'
const UNITS = ['kg', 'g', 'lb', 'L', 'mL', 'm3']

export default function DistillForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const seps = r.arr<DistillSeparation>('separations')
  const stop = (r.raw.stopCriterion as Record<string, unknown> | undefined) ?? { type: 'AmountRemoved' }
  const stopType = (stop.type as StopType) ?? 'AmountRemoved'

  function setSeps(next: DistillSeparation[]) {
    update({ separations: next })
  }
  function setStop(p: Record<string, unknown>) {
    update({ stopCriterion: { ...stop, ...p } })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Equipment">
          <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
        </Field>
        <Field label="Separation mode">
          <Select
            value={r.str('separationMode') ?? 'Percent'}
            onValueChange={(v) => update({ separationMode: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Percent">Percent</SelectItem>
              <SelectItem value="Rayleigh">Rayleigh</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Component splits</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSeps([...seps, { materialId: '', goesTo: 'Overhead', pct: 0 }])}
          >
            <Plus className="h-3.5 w-3.5" /> Split
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
              value={s.goesTo}
              onValueChange={(g) => {
                const next = seps.slice()
                next[i] = { ...s, goesTo: g as DistillSeparation['goesTo'] }
                setSeps(next)
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Overhead">Overhead</SelectItem>
                <SelectItem value="Bottoms">Bottoms</SelectItem>
              </SelectContent>
            </Select>
            <NumberInput
              className="w-20"
              value={s.pct}
              onChange={(v) => {
                const next = seps.slice()
                next[i] = { ...s, pct: v ?? 0 }
                setSeps(next)
              }}
            />
            <button
              type="button"
              onClick={() => setSeps(seps.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-error"
              aria-label="Remove split"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Field label="Unspecified components go to">
        <Select
          value={r.str('unspecifiedGoesTo') ?? 'Bottoms'}
          onValueChange={(v) => update({ unspecifiedGoesTo: v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Overhead">Overhead</SelectItem>
            <SelectItem value="Bottoms">Bottoms</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* Stop criterion — discriminated control */}
      <div className="space-y-2 rounded-md border border-border p-2">
        <Label>Stop criterion</Label>
        <div className="flex items-center gap-2">
          <Select value={stopType} onValueChange={(t) => setStop({ type: t })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AmountRemoved">Amount removed</SelectItem>
              <SelectItem value="AmountRetained">Amount retained</SelectItem>
              <SelectItem value="BottomsTemperature">Bottoms temperature</SelectItem>
            </SelectContent>
          </Select>
          {stopType === 'BottomsTemperature' ? (
            <NumberInput
              className="w-28"
              value={stop.temperatureC as number | undefined}
              placeholder="°C"
              onChange={(v) => setStop({ temperatureC: v })}
            />
          ) : (
            <>
              <NumberInput
                className="w-28"
                value={stop.amount as number | undefined}
                placeholder="amount"
                onChange={(v) => setStop({ amount: v })}
              />
              <Select
                value={(stop.unit as string) ?? 'kg'}
                onValueChange={(u) => setStop({ unit: u })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Distillation time (min)">
          <NumberInput value={r.num('distillationTimeMin')} onChange={(v) => update({ distillationTimeMin: v })} />
        </Field>
        <Field label="Reflux ratio">
          <NumberInput value={r.num('refluxRatio')} onChange={(v) => update({ refluxRatio: v })} />
        </Field>
        <Field label="Distillate rate (kg/min)">
          <NumberInput
            value={r.num('distillateRateKgPerMin')}
            onChange={(v) => update({ distillateRateKgPerMin: v })}
          />
        </Field>
        <Field label="Distillate equipment">
          <EquipmentSelect
            value={r.str('distillateEquipmentId')}
            onChange={(id) => update({ distillateEquipmentId: id })}
          />
        </Field>
        <Field label="Bottoms temperature (°C)">
          <NumberInput value={r.num('bottomsTemperatureC')} onChange={(v) => update({ bottomsTemperatureC: v })} />
        </Field>
        <Field label="Bottoms pressure (kPa)">
          <NumberInput value={r.num('bottomsPressureKPa')} onChange={(v) => update({ bottomsPressureKPa: v })} />
        </Field>
        <Field label="Condenser equipment">
          <EquipmentSelect
            value={r.str('condenserEquipmentId')}
            onChange={(id) => update({ condenserEquipmentId: id })}
          />
        </Field>
        <Field label="Vacuum pump">
          <EquipmentSelect value={r.str('vacuumPumpId')} onChange={(id) => update({ vacuumPumpId: id })} />
        </Field>
      </div>

      <ContinuousFeedEditor
        value={r.arr<ContinuousFeed>('feeds')}
        onChange={(feeds) => update({ feeds })}
      />
    </div>
  )
}
