import NumberInput from '@/components/forms/NumberInput'
import { EquipmentSelect, Field, UtilitySelect, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'

export default function CoolForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const time = r.num('coolingTimeMin')
  const rate = r.num('coolingRateC_PerMin')
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>
      <Field label="Target temperature (°C)">
        <NumberInput value={r.num('targetTemperatureC')} onChange={(v) => update({ targetTemperatureC: v })} />
      </Field>
      <Field label="Cooling time (min)">
        <NumberInput value={time} disabled={rate !== undefined} onChange={(v) => update({ coolingTimeMin: v })} />
      </Field>
      <Field label="Cooling rate (°C/min)">
        <NumberInput
          value={rate}
          disabled={time !== undefined}
          onChange={(v) => update({ coolingRateC_PerMin: v })}
        />
      </Field>
      <Field label="Utility (cooling)">
        <UtilitySelect
          value={r.str('utilityId')}
          filterType="Cooling"
          onChange={(id) => update({ utilityId: id })}
        />
      </Field>
      <Field label="Condenser equipment">
        <EquipmentSelect value={r.str('condenserEquipmentId')} onChange={(id) => update({ condenserEquipmentId: id })} />
      </Field>
    </div>
  )
}
