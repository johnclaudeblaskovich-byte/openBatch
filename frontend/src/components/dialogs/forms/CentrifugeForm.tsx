import NumberInput from '@/components/forms/NumberInput'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'

export default function CentrifugeForm({ op, update }: OpFormProps) {
  const r = reader(op)
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="From equipment">
        <EquipmentSelect value={r.str('fromEquipmentId')} onChange={(id) => update({ fromEquipmentId: id })} />
      </Field>
      <Field label="Centrifuge equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>
      <Field label="Filter solids %">
        <NumberInput value={r.num('filterSolidsPct')} onChange={(v) => update({ filterSolidsPct: v })} />
      </Field>
      <Field label="Cake moisture %">
        <NumberInput value={r.num('cakeMoisturePct')} onChange={(v) => update({ cakeMoisturePct: v })} />
      </Field>
      <Field label="Centrifuge time (min)">
        <NumberInput value={r.num('centrifugeTimeMin')} onChange={(v) => update({ centrifugeTimeMin: v })} />
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
  )
}
