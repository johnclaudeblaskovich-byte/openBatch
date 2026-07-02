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

const MODELS = ['ShortcutFilter', 'ConstantFlowrate', 'ConstantPressureDrop']

export default function FilterForm({ op, update }: OpFormProps) {
  const r = reader(op)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="From equipment">
          <EquipmentSelect value={r.str('fromEquipmentId')} onChange={(id) => update({ fromEquipmentId: id })} />
        </Field>
        <Field label="Filter equipment">
          <EquipmentSelect value={r.str('filterEquipmentId')} onChange={(id) => update({ filterEquipmentId: id })} />
        </Field>
        <Field label="Model">
          <Select value={r.str('model') ?? 'ShortcutFilter'} onValueChange={(v) => update({ model: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Transfer %">
          <NumberInput value={r.num('transferPct')} onChange={(v) => update({ transferPct: v })} />
        </Field>
        <Field label="Filter solids %">
          <NumberInput value={r.num('filterSolidsPct')} onChange={(v) => update({ filterSolidsPct: v })} />
        </Field>
        <Field label="Cake moisture %">
          <NumberInput value={r.num('cakeMoisturePct')} onChange={(v) => update({ cakeMoisturePct: v })} />
        </Field>
        <Field label="Filtration time (min)">
          <NumberInput value={r.num('filtrationTimeMin')} onChange={(v) => update({ filtrationTimeMin: v })} />
        </Field>
        <Field label="Slurry transfer time (min)">
          <NumberInput value={r.num('slurryTransferTimeMin')} onChange={(v) => update({ slurryTransferTimeMin: v })} />
        </Field>
        <Field label="Mother liquor equipment">
          <EquipmentSelect
            value={r.str('motherLiquorEquipmentId')}
            onChange={(id) => update({ motherLiquorEquipmentId: id })}
          />
        </Field>
        <Field label="Condenser equipment">
          <EquipmentSelect value={r.str('condenserEquipmentId')} onChange={(id) => update({ condenserEquipmentId: id })} />
        </Field>
      </div>
    </div>
  )
}
