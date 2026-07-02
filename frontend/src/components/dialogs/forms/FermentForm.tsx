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
import { useStore } from '@/store'
import { EquipmentSelect, Field, reader } from '../shared/fields'
import ContinuousFeedEditor from '../shared/ContinuousFeedEditor'
import type { OpFormProps } from '../OpFormProps'
import type { ContinuousFeed, PhaseType } from '@/types'

const PHASES: PhaseType[] = ['Liquid', 'Solid', 'Gas', 'Mixed']

interface YieldSpec {
  materialId: string
  phase: PhaseType
  yieldPct: number
}

export default function FermentForm({ op, update }: OpFormProps) {
  const r = reader(op)
  const reactions = useStore((s) => s.project?.reactions ?? [])
  const yields = r.arr<YieldSpec>('yields')

  function setYields(next: YieldSpec[]) {
    update({ yields: next })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Equipment">
          <EquipmentSelect value={r.str('equipmentId')} onChange={(id) => update({ equipmentId: id })} />
        </Field>
        <Field label="Reaction data set">
          <Select
            value={r.str('reactionDataSetId') || undefined}
            onValueChange={(v) => update({ reactionDataSetId: v })}
          >
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
        <Field label="Reaction type">
          <Select value={r.str('reactionType') ?? 'Isothermal'} onValueChange={(v) => update({ reactionType: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Isothermal">Isothermal</SelectItem>
              <SelectItem value="Adiabatic">Adiabatic</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Fermentation time (min)">
          <NumberInput value={r.num('fermentationTimeMin')} onChange={(v) => update({ fermentationTimeMin: v })} />
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Yield specs</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setYields([...yields, { materialId: '', phase: 'Liquid', yieldPct: 0 }])}
          >
            <Plus className="h-3.5 w-3.5" /> Yield
          </Button>
        </div>
        {yields.map((y, i) => (
          <div key={i} className="flex items-center gap-2">
            <MaterialPicker
              className="flex-1"
              value={y.materialId}
              onChange={(materialId) => {
                const next = yields.slice()
                next[i] = { ...y, materialId }
                setYields(next)
              }}
            />
            <Select
              value={y.phase}
              onValueChange={(p) => {
                const next = yields.slice()
                next[i] = { ...y, phase: p as PhaseType }
                setYields(next)
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NumberInput
              className="w-24"
              value={y.yieldPct}
              onChange={(v) => {
                const next = yields.slice()
                next[i] = { ...y, yieldPct: v ?? 0 }
                setYields(next)
              }}
            />
            <button
              type="button"
              onClick={() => setYields(yields.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-error"
              aria-label="Remove yield"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <ContinuousFeedEditor
        value={r.arr<ContinuousFeed>('feeds')}
        onChange={(feeds) => update({ feeds })}
      />
    </div>
  )
}
