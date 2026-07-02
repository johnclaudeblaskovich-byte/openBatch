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

interface DecantSeparation {
  materialId: string
  goesTo: 'Top' | 'Bottom'
  pct: number
}

export default function DecantForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const seps = r.arr<DecantSeparation>('separations')

  function setSeps(next: DecantSeparation[]) {
    update({ separations: next })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Equipment">
          <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
        </Field>
        <Field label="Top layer equipment">
          <EquipmentSelect
            value={r.str('topLayerEquipmentId')}
            onChange={(id) => update({ topLayerEquipmentId: id })}
          />
        </Field>
        <Field label="Decant time (min)">
          <NumberInput value={r.num('decantTimeMin')} onChange={(v) => update({ decantTimeMin: v })} />
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Layer splits</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSeps([...seps, { materialId: '', goesTo: 'Top', pct: 0 }])}
          >
            <Plus className="h-3.5 w-3.5" /> Split
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
                next[i] = { ...s, goesTo: g as DecantSeparation['goesTo'] }
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
              aria-label="Remove split"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
