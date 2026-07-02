import { Plus, X } from 'lucide-react'
import {
  Button,
  Label,
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

interface ExtractSeparation {
  materialId: string
  goesTo: 'Top' | 'Bottom'
  pct: number
}

export default function ExtractForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const seps = r.arr<ExtractSeparation>('separations')

  function setSeps(next: ExtractSeparation[]) {
    update({ separations: next })
  }

  return (
    <div className="space-y-4">
      <Field label="Equipment">
        <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Layer partitions</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSeps([...seps, { materialId: '', goesTo: 'Top', pct: 0 }])}
          >
            <Plus className="h-3.5 w-3.5" /> Partition
          </Button>
        </div>
        {seps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <MaterialPicker
              className="flex-1"
              value={s.materialId}
              onChange={(materialId) => {
                const next = seps.slice()
                next[i] = { ...s, materialId }
                setSeps(next)
              }}
            />
            <Select
              value={s.goesTo}
              onValueChange={(g) => {
                const next = seps.slice()
                next[i] = { ...s, goesTo: g as ExtractSeparation['goesTo'] }
                setSeps(next)
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Top">Top</SelectItem>
                <SelectItem value="Bottom">Bottom</SelectItem>
              </SelectContent>
            </Select>
            <NumberInput
              className="w-20"
              value={s.pct}
              onChange={(v) => {
                const next = seps.slice()
                next[i] = { ...s, pct: v ?? 0 }
                setSeps(next)
              }}
            />
            <button
              type="button"
              onClick={() => setSeps(seps.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-error"
              aria-label="Remove partition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Unspecified goes to">
          <Select
            value={r.str('unspecifiedGoesTo') ?? 'Bottom'}
            onValueChange={(v) => update({ unspecifiedGoesTo: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Top">Top</SelectItem>
              <SelectItem value="Bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Top layer equipment">
          <EquipmentSelect
            value={r.str('topLayerEquipmentId')}
            onChange={(id) => update({ topLayerEquipmentId: id })}
          />
        </Field>
        <Field label="Extraction time (min)">
          <NumberInput value={r.num('extractionTimeMin')} onChange={(v) => update({ extractionTimeMin: v })} />
        </Field>
        <Field label="Condenser equipment">
          <EquipmentSelect value={r.str('condenserEquipmentId')} onChange={(id) => update({ condenserEquipmentId: id })} />
        </Field>
      </div>
    </div>
  )
}
