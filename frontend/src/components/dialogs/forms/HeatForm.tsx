import NumberInput from '@/components/forms/NumberInput'
import { EquipmentSelect, Field, UtilitySelect, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'

export default function HeatForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const time = r.num('heatingTimeMin')
  const rate = r.num('heatingRateC_PerMin')
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>
      <Field label="Target temperature (°C)">
        <NumberInput value={r.num('targetTemperatureC')} onChange={(v) => update({ targetTemperatureC: v })} />
      </Field>
      <Field label="Heating time (min)">
        <NumberInput value={time} disabled={rate !== undefined} onChange={(v) => update({ heatingTimeMin: v })} />
      </Field>
      <Field label="Heating rate (°C/min)">
        <NumberInput
          value={rate}
          disabled={time !== undefined}
          onChange={(v) => update({ heatingRateC_PerMin: v })}
        />
      </Field>
      <Field label="Utility (heating)">
        <UtilitySelect
          value={r.str('utilityId')}
          filterType="Heating"
          onChange={(id) => update({ utilityId: id })}
        />
      </Field>
    </div>
  )
}
