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
import { EquipmentSelect, Field } from './fields'
import { genId } from '@/store'
import type { ContinuousFeed } from '@/types'

const UNITS = ['kg', 'g', 'lb', 'L', 'mL', 'm3', 'mol', 'kmol']

interface Props {
  value: ContinuousFeed[]
  onChange: (feeds: ContinuousFeed[]) => void
}

/** Edits ContinuousFeed[] — reused by React / YieldReact / Distill / Ferment forms. */
export default function ContinuousFeedEditor({ value, onChange }: Props) {
  function patch(i: number, p: Partial<ContinuousFeed>) {
    const next = value.slice()
    next[i] = { ...next[i], ...p }
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Continuous feeds</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...value,
              { id: genId('feed'), source: 'Inventory', amount: 0, amountUnit: 'kg' },
            ])
          }
        >
          <Plus className="h-3.5 w-3.5" /> Feed
        </Button>
      </div>

      {value.map((feed, i) => (
        <div key={feed.id} className="space-y-2 rounded-md border border-border p-2">
          <div className="flex items-center gap-2">
            <Select value={feed.source} onValueChange={(v) => patch(i, { source: v as ContinuousFeed['source'] })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inventory">Inventory</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
            {feed.source === 'Equipment' ? (
              <EquipmentSelect
                value={feed.sourceEquipmentId}
                onChange={(id) => patch(i, { sourceEquipmentId: id })}
              />
            ) : (
              <MaterialPicker
                className="flex-1"
                value={feed.materialId ?? ''}
                onChange={(materialId) => patch(i, { materialId })}
              />
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-error"
              aria-label="Remove feed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Amount">
              <div className="flex gap-1">
                <NumberInput
                  className="flex-1"
                  value={feed.amount}
                  onChange={(v) => patch(i, { amount: v ?? 0 })}
                />
                <Select value={feed.amountUnit} onValueChange={(u) => patch(i, { amountUnit: u })}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>
            <Field label="Charge time (min)">
              <NumberInput value={feed.chargeTimeMin} onChange={(v) => patch(i, { chargeTimeMin: v })} />
            </Field>
            <Field label="Charge rate (kg/min)">
              <NumberInput
                value={feed.chargeRateKgPerMin}
                onChange={(v) => patch(i, { chargeRateKgPerMin: v })}
              />
            </Field>
            <Field label="Time delay (min)">
              <NumberInput value={feed.timeDelayMin} onChange={(v) => patch(i, { timeDelayMin: v })} />
            </Field>
            <Field label="# allotments">
              <NumberInput
                value={feed.numberOfAllotments}
                onChange={(v) => patch(i, { numberOfAllotments: v })}
              />
            </Field>
            <Field label="Interval (min)">
              <NumberInput value={feed.timeIntervalMin} onChange={(v) => patch(i, { timeIntervalMin: v })} />
            </Field>
          </div>
        </div>
      ))}
      {value.length === 0 && <div className="text-sm text-muted">No feeds.</div>}
    </div>
  )
}
