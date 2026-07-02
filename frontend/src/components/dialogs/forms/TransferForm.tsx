import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import NumberInput from '@/components/forms/NumberInput'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'

const UNITS = ['kg', 'g', 'lb', 'L', 'mL', 'm3']

export default function TransferForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const transferAmount = r.num('transferAmount')
  const transferPct = r.num('transferPct')
  const transferTimeMin = r.num('transferTimeMin')
  const transferRate = r.num('transferRateKgPerMin')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="From equipment">
          <EquipmentSelect
            value={r.str('fromEquipmentId')}
            onChange={(id) => update({ fromEquipmentId: id })}
          />
        </Field>
        <Field label="To equipment">
          <EquipmentSelect
            value={r.str('toEquipmentId')}
            onChange={(id) => update({ toEquipmentId: id })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Transfer %">
          <NumberInput
            value={transferPct}
            disabled={transferAmount !== undefined}
            onChange={(v) => update({ transferPct: v })}
          />
        </Field>
        <Field label="Transfer amount">
          <div className="flex gap-2">
            <NumberInput
              className="flex-1"
              value={transferAmount}
              disabled={transferPct !== undefined}
              onChange={(v) => update({ transferAmount: v })}
            />
            <Select
              value={r.str('transferAmountUnit') ?? 'kg'}
              onValueChange={(u) => update({ transferAmountUnit: u })}
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
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Transfer time (min)">
          <NumberInput
            value={transferTimeMin}
            disabled={transferRate !== undefined}
            onChange={(v) => update({ transferTimeMin: v })}
          />
        </Field>
        <Field label="Transfer rate (kg/min)">
          <NumberInput
            value={transferRate}
            disabled={transferTimeMin !== undefined}
            onChange={(v) => update({ transferRateKgPerMin: v })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Inline filter equipment">
          <EquipmentSelect
            value={r.str('inlineFilterEquipmentId')}
            onChange={(id) => update({ inlineFilterEquipmentId: id })}
          />
        </Field>
        <Field label="Filter solids %">
          <NumberInput value={r.num('filterSolidsPct')} onChange={(v) => update({ filterSolidsPct: v })} />
        </Field>
        <Field label="Via equipment">
          <EquipmentSelect value={r.str('viaEquipmentId')} onChange={(id) => update({ viaEquipmentId: id })} />
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
