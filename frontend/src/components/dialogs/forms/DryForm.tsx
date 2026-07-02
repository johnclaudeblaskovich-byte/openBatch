import NumberInput from '@/components/forms/NumberInput'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import type { OpFormProps } from '../OpFormProps'

export default function DryForm({ op, update }: OpFormProps) {
  const r = reader(op)
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>
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
      <Field label="Drying rate (kg/min)">
        <NumberInput value={r.num('dryingRateKgPerMin')} onChange={(v) => update({ dryingRateKgPerMin: v })} />
      </Field>
      <Field label="Evaporated solvent equipment">
        <EquipmentSelect
          value={r.str('evaporatedSolventEquipmentId')}
          onChange={(id) => update({ evaporatedSolventEquipmentId: id })}
        />
      </Field>
      <Field label="Condenser equipment">
        <EquipmentSelect value={r.str('condenserEquipmentId')} onChange={(id) => update({ condenserEquipmentId: id })} />
      </Field>
      <Field label="Vacuum pump">
        <EquipmentSelect value={r.str('vacuumPumpId')} onChange={(id) => update({ vacuumPumpId: id })} />
      </Field>
    </div>
  )
}
