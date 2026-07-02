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

const UNITS = ['kg', 'g', 'lb', 'L', 'mL', 'm3']

interface CakeWash {
  solventMaterialId: string
  amountPerWash: number
  amountUnit: string
  numberOfWashes?: number
  washType?: string
  washTimeMin?: number
}

export default function FilterDryForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const washes = r.arr<CakeWash>('washes')

  function setWashes(next: CakeWash[]) {
    update({ washes: next })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="From equipment">
          <EquipmentSelect value={r.str('fromEquipmentId')} onChange={(id) => update({ fromEquipmentId: id })} />
        </Field>
        <Field label="Filter-dryer equipment">
          <EquipmentSelect
            value={r.str('filterDryerEquipmentId')}
            onChange={(id) => update({ filterDryerEquipmentId: id })}
          />
        </Field>
        <Field label="Filter solids %">
          <NumberInput value={r.num('filterSolidsPct')} onChange={(v) => update({ filterSolidsPct: v })} />
        </Field>
        <Field label="Cake moisture % (after filtration)">
          <NumberInput
            value={r.num('cakeMoisturePctAfterFiltration')}
            onChange={(v) => update({ cakeMoisturePctAfterFiltration: v })}
          />
        </Field>
        <Field label="Filtration time (min)">
          <NumberInput value={r.num('filtrationTimeMin')} onChange={(v) => update({ filtrationTimeMin: v })} />
        </Field>
        <Field label="Slurry transfer time (min)">
          <NumberInput value={r.num('slurryTransferTimeMin')} onChange={(v) => update({ slurryTransferTimeMin: v })} />
        </Field>
      </div>

      {/* Washes — capped at 3 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Cake washes (max 3)</Label>
          <Button
            size="sm"
            variant="outline"
            disabled={washes.length >= 3}
            onClick={() =>
              setWashes([
                ...washes,
                { solventMaterialId: '', amountPerWash: 0, amountUnit: 'kg', numberOfWashes: 1 },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" /> Wash
          </Button>
        </div>
        {washes.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <MaterialPicker
              className="flex-1"
              value={w.solventMaterialId}
              onChange={(id) => {
                const next = washes.slice()
                next[i] = { ...w, solventMaterialId: id }
                setWashes(next)
              }}
            />
            <NumberInput
              className="w-20"
              value={w.amountPerWash}
              onChange={(v) => {
                const next = washes.slice()
                next[i] = { ...w, amountPerWash: v ?? 0 }
                setWashes(next)
              }}
            />
            <Select
              value={w.amountUnit}
              onValueChange={(u) => {
                const next = washes.slice()
                next[i] = { ...w, amountUnit: u }
                setWashes(next)
              }}
            >
              <SelectTrigger className="w-16">
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
            <button
              type="button"
              onClick={() => setWashes(washes.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-error"
              aria-label="Remove wash"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Drying time (min)">
          <NumberInput value={r.num('dryingTimeMin')} onChange={(v) => update({ dryingTimeMin: v })} />
        </Field>
        <Field label="Drying temperature (°C)">
          <NumberInput value={r.num('dryingTemperatureC')} onChange={(v) => update({ dryingTemperatureC: v })} />
        </Field>
        <Field label="Drying pressure (kPa)">
          <NumberInput value={r.num('dryingPressureKPa')} onChange={(v) => update({ dryingPressureKPa: v })} />
        </Field>
        <Field label="Final moisture %">
          <NumberInput value={r.num('finalMoisturePct')} onChange={(v) => update({ finalMoisturePct: v })} />
        </Field>
        <Field label="Cake dry bulk density (kg/m³)">
          <NumberInput value={r.num('cakeDryBulkDensity')} onChange={(v) => update({ cakeDryBulkDensity: v })} />
        </Field>
        <Field label="Mother liquor equipment">
          <EquipmentSelect
            value={r.str('motherLiquorEquipmentId')}
            onChange={(id) => update({ motherLiquorEquipmentId: id })}
          />
        </Field>
        <Field label="Spent wash equipment">
          <EquipmentSelect
            value={r.str('spentWashEquipmentId')}
            onChange={(id) => update({ spentWashEquipmentId: id })}
          />
        </Field>
        <Field label="Condenser equipment">
          <EquipmentSelect value={r.str('condenserEquipmentId')} onChange={(id) => update({ condenserEquipmentId: id })} />
        </Field>
      </div>
    </div>
  )
}
