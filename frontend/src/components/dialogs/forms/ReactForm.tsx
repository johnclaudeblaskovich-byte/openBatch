import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import NumberInput from '@/components/forms/NumberInput'
import { useStore } from '@/store'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import ContinuousFeedEditor from '../shared/ContinuousFeedEditor'
import type { OpFormProps } from '../OpFormProps'
import type { ContinuousFeed } from '@/types'

export default function ReactForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const reactions = useStore((s) => s.project?.reactions ?? [])
  const dataSetId = r.str('reactionDataSetId')
  const reactionType = r.str('reactionType') ?? 'Isothermal'
  const selectedSet = reactions.find((s) => s.id === dataSetId)

  return (
    <div className="space-y-4">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>

      <Field label="Reaction data set">
        <Select value={dataSetId || undefined} onValueChange={(v) => update({ reactionDataSetId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select reaction set…" />
          </SelectTrigger>
          <SelectContent>
            {reactions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {selectedSet && (
        <div className="rounded-md border border-border bg-background p-2 text-xs text-text-secondary">
          {selectedSet.reactions.map((rx) => (
            <div key={rx.id}>
              {rx.name} — {rx.conversionPct}% conversion
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Reaction type">
          <Select value={reactionType} onValueChange={(v) => update({ reactionType: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Isothermal">Isothermal</SelectItem>
              <SelectItem value="Adiabatic">Adiabatic</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Reaction time (min)">
          <NumberInput value={r.num('reactionTimeMin')} onChange={(v) => update({ reactionTimeMin: v })} />
        </Field>
        {reactionType === 'Isothermal' && (
          <Field label="Final temperature (°C)">
            <NumberInput
              value={r.num('finalTemperatureC')}
              onChange={(v) => update({ finalTemperatureC: v })}
            />
          </Field>
        )}
        <Field label="Condenser equipment">
          <EquipmentSelect
            value={r.str('condenserEquipmentId')}
            onChange={(id) => update({ condenserEquipmentId: id })}
          />
        </Field>
      </div>

      <ContinuousFeedEditor
        value={r.arr<ContinuousFeed>('continuousFeeds')}
        onChange={(feeds) => update({ continuousFeeds: feeds })}
      />
    </div>
  )
}
