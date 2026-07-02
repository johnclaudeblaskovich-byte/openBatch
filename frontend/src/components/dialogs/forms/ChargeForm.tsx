import { Plus, X } from 'lucide-react'
import {
  Button,
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

const UNITS = ['kg', 'g', 'lb', 'L', 'mL', 'm3', 'mol', 'kmol']

interface ChargeMat {
  materialId: string
  amount: number
  amountUnit: string
  dissolutionPct?: number
}

export default function ChargeForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const materials = r.arr<ChargeMat>('materials')
  const chargeTimeMin = r.num('chargeTimeMin')
  const chargeRate = r.num('chargeRateKgPerMin')

  function setMaterials(next: ChargeMat[]) {
    update({ materials: next })
  }

  return (
    <div className="space-y-4">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Materials</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMaterials([...materials, { materialId: '', amount: 0, amountUnit: 'kg' }])}
          >
            <Plus className="h-3.5 w-3.5" /> Material
          </Button>
        </div>
        {materials.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <MaterialPicker
              className="flex-1"
              value={m.materialId}
              onChange={(materialId) => {
                const next = materials.slice()
                next[i] = { ...m, materialId }
                setMaterials(next)
              }}
            />
            <NumberInput
              className="w-24"
              value={m.amount}
              onChange={(v) => {
                const next = materials.slice()
                next[i] = { ...m, amount: v ?? 0 }
                setMaterials(next)
              }}
            />
            <Select
              value={m.amountUnit}
              onValueChange={(amountUnit) => {
                const next = materials.slice()
                next[i] = { ...m, amountUnit }
                setMaterials(next)
              }}
            >
              <SelectTrigger className="w-24">
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
              onClick={() => setMaterials(materials.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-error"
              aria-label="Remove material"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {materials.length === 0 && <div className="text-sm text-muted">No materials.</div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Charge time (min)">
          <NumberInput
            value={chargeTimeMin}
            disabled={chargeRate !== undefined}
            onChange={(v) => update({ chargeTimeMin: v })}
          />
        </Field>
        <Field label="Charge rate (kg/min)">
          <NumberInput
            value={chargeRate}
            disabled={chargeTimeMin !== undefined}
            onChange={(v) => update({ chargeRateKgPerMin: v })}
          />
        </Field>
      </div>

      <Field label="Condenser equipment">
        <EquipmentSelect
          value={r.str('condenserEquipmentId')}
          onChange={(id) => update({ condenserEquipmentId: id })}
        />
      </Field>
    </div>
  )
}
