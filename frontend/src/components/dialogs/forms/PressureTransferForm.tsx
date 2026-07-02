import NumberInput from '@/components/forms/NumberInput'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'

export default function PressureTransferForm({ op, update }: OpFormProps) {
  const r = reader(op)
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

      <Field label="Transfer %">
        <NumberInput value={r.num('transferPct')} onChange={(v) => update({ transferPct: v })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Before pressure — source (kPa)">
          <NumberInput
            value={r.num('beforePressureSourceKPa')}
            onChange={(v) => update({ beforePressureSourceKPa: v })}
          />
        </Field>
        <Field label="Before pressure — dest (kPa)">
          <NumberInput
            value={r.num('beforePressureDestKPa')}
            onChange={(v) => update({ beforePressureDestKPa: v })}
          />
        </Field>
        <Field label="After pressure — source (kPa)">
          <NumberInput
            value={r.num('afterPressureSourceKPa')}
            onChange={(v) => update({ afterPressureSourceKPa: v })}
          />
        </Field>
        <Field label="After pressure — dest (kPa)">
          <NumberInput
            value={r.num('afterPressureDestKPa')}
            onChange={(v) => update({ afterPressureDestKPa: v })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pressurization time (min)">
          <NumberInput
            value={r.num('beforeTransferTimeMin')}
            onChange={(v) => update({ beforeTransferTimeMin: v })}
          />
        </Field>
        <Field label="Inline filter equipment">
          <EquipmentSelect
            value={r.str('inlineFilterEquipmentId')}
            onChange={(id) => update({ inlineFilterEquipmentId: id })}
          />
        </Field>
        <Field label="Vacuum unit">
          <EquipmentSelect value={r.str('vacuumUnitId')} onChange={(id) => update({ vacuumUnitId: id })} />
        </Field>
      </div>
    </div>
  )
}
