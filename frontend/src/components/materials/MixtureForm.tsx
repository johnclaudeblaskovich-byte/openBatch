import { Plus, X } from 'lucide-react'
import { Button, Input, Label } from '@/components/ui'
import NumberInput from '@/components/forms/NumberInput'
import MaterialPicker from './MaterialPicker'
import { cn } from '@/lib/cn'
import type { Material } from '@/types'

interface Props {
  material: Material
  onPatch: (patch: Partial<Material>) => void
}

interface Row {
  materialId: string
  fraction: number
}

function toRows(composition: Record<string, number> | undefined): Row[] {
  return Object.entries(composition ?? {}).map(([materialId, fraction]) => ({
    materialId,
    fraction,
  }))
}

function toComposition(rows: Row[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) if (r.materialId) out[r.materialId] = r.fraction
  return out
}

const TOLERANCE = 1e-6

/** Composition editor for predefined mixtures (mass-fraction blends of other materials). */
export default function MixtureForm({ material, onPatch }: Props) {
  const rows = toRows(material.composition)
  const sum = rows.reduce((acc, r) => acc + (Number.isFinite(r.fraction) ? r.fraction : 0), 0)
  const balanced = Math.abs(sum - 1) <= TOLERANCE

  function commit(next: Row[]) {
    onPatch({ composition: toComposition(next) })
  }

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Identity
        </h3>
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={material.name} onChange={(e) => onPatch({ name: e.target.value })} />
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Composition (mass fractions)
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => commit([...rows, { materialId: '', fraction: 0 }])}
          >
            <Plus className="h-3.5 w-3.5" /> Component
          </Button>
        </div>

        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <MaterialPicker
                className="flex-1"
                value={row.materialId}
                onChange={(materialId) => {
                  const next = rows.slice()
                  next[i] = { ...row, materialId }
                  commit(next)
                }}
              />
              <NumberInput
                className="w-32"
                value={row.fraction}
                onChange={(v) => {
                  const next = rows.slice()
                  next[i] = { ...row, fraction: v ?? 0 }
                  commit(next)
                }}
              />
              <button
                type="button"
                onClick={() => commit(rows.filter((_, idx) => idx !== i))}
                className="text-muted hover:text-error"
                aria-label="Remove component"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-sm text-muted">No components yet.</div>
          )}
        </div>

        <div className={cn('text-sm', balanced ? 'text-text-secondary' : 'text-warning')}>
          Sum: {sum.toFixed(4)}
          {!balanced && ' (should equal 1.0)'}
        </div>
      </section>

      <section className="space-y-1">
        <Label>Notes</Label>
        <Input value={material.notes} onChange={(e) => onPatch({ notes: e.target.value })} />
      </section>
    </div>
  )
}
