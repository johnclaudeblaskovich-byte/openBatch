import NumberInput from '@/components/forms/NumberInput'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'

export function MixForm({ op, update }: OpFormProps) {
  const r = reader(op)
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>
      <Field label="Mixing time (min)">
        <NumberInput value={r.num('mixingTimeMin')} onChange={(v) => update({ mixingTimeMin: v })} />
      </Field>
    </div>
  )
}

export function AgeForm({ op, update }: OpFormProps) {
  const r = reader(op)
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>
      <Field label="Aging time (min)">
        <NumberInput value={r.num('agingTimeMin')} onChange={(v) => update({ agingTimeMin: v })} />
      </Field>
      <Field label="Condenser equipment">
        <EquipmentSelect value={r.str('condenserEquipmentId')} onChange={(id) => update({ condenserEquipmentId: id })} />
      </Field>
    </div>
  )
}

export function ConcentrateForm({ op, update }: OpFormProps) {
  const r = reader(op)
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>
      <Field label="Operation time (min)">
        <NumberInput value={r.num('operationTimeMin')} onChange={(v) => update({ operationTimeMin: v })} />
      </Field>
      <Field label="Removal %">
        <NumberInput value={r.num('removalPct')} onChange={(v) => update({ removalPct: v })} />
      </Field>
      <Field label="Condenser equipment">
        <EquipmentSelect value={r.str('condenserEquipmentId')} onChange={(id) => update({ condenserEquipmentId: id })} />
      </Field>
    </div>
  )
}
