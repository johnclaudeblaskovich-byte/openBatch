import {
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

export default function WashCakeForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const washType = r.str('washType') ?? 'Displacement'
  return (
    <div className="space-y-4">
      <Field label="Filter equipment">
        <EquipmentSelect value={r.str('filterEquipmentId')} onChange={(id) => update({ filterEquipmentId: id })} />
      </Field>
      <Field label="Solvent material">
        <MaterialPicker
          value={r.str('solventMaterialId') ?? ''}
          onChange={(id) => update({ solventMaterialId: id })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount per wash">
          <div className="flex gap-2">
            <NumberInput
              className="flex-1"
              value={r.num('amountPerWash')}
              onChange={(v) => update({ amountPerWash: v })}
            />
            <Select value={r.str('amountUnit') ?? 'kg'} onValueChange={(u) => update({ amountUnit: u })}>
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
        <Field label="Number of washes">
          <NumberInput value={r.num('numberOfWashes')} onChange={(v) => update({ numberOfWashes: v })} />
        </Field>
        <Field label="Wash type">
          <Select value={washType} onValueChange={(v) => update({ washType: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Displacement">Displacement</SelectItem>
              <SelectItem value="Slurry">Slurry</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Wash time (min)">
          <NumberInput value={r.num('washTimeMin')} onChange={(v) => update({ washTimeMin: v })} />
        </Field>
        <Field label="Spent wash equipment">
          <EquipmentSelect
            value={r.str('spentWashEquipmentId')}
            onChange={(id) => update({ spentWashEquipmentId: id })}
          />
        </Field>
      </div>
    </div>
  )
}
