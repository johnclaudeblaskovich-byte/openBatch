import { useMemo, useState } from 'react'
import { Plus, Table as TableIcon, PanelLeft } from 'lucide-react'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { useStore, genId } from '@/store'
import PureComponentForm from '@/components/materials/PureComponentForm'
import MixtureForm from '@/components/materials/MixtureForm'
import CellForm from '@/components/materials/CellForm'
import MaterialsGrid from '@/components/materials/MaterialsGrid'
import { cn } from '@/lib/cn'
import type { Material, MaterialType } from '@/types'

function newPureComponent(): Material {
  return {
    id: genId('mat'),
    name: 'New Material',
    aliases: [],
    type: 'PureComponent',
    defaultPhase: 'Liquid',
    notes: '',
  }
}

const TYPES: { value: MaterialType; label: string }[] = [
  { value: 'PureComponent', label: 'Pure Component' },
  { value: 'PredefinedMixture', label: 'Predefined Mixture' },
  { value: 'Cell', label: 'Cell' },
]

export default function MaterialsView() {
  const materials = useStore((s) => s.project?.materials)
  const upsertMaterial = useStore((s) => s.upsertMaterial)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [gridView, setGridView] = useState(false)

  const list = useMemo(() => materials ?? [], [materials])
  const selected = list.find((m) => m.id === selectedId) ?? list[0] ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.aliases.some((a) => a.toLowerCase().includes(q)),
    )
  }, [list, query])

  function handleNew() {
    const m = newPureComponent()
    upsertMaterial(m)
    setSelectedId(m.id)
    setGridView(false)
  }

  function patch(p: Partial<Material>) {
    if (selected) upsertMaterial({ ...selected, ...p })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold text-text-primary">Materials</h2>
        <Button size="sm" variant="outline" onClick={() => setGridView((g) => !g)}>
          {gridView ? <PanelLeft className="h-3.5 w-3.5" /> : <TableIcon className="h-3.5 w-3.5" />}
          {gridView ? 'Editor view' : 'Grid view'}
        </Button>
      </div>

      {gridView ? (
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <MaterialsGrid materials={list} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* List */}
          <div className="flex w-64 shrink-0 flex-col border-r border-border">
            <div className="space-y-2 border-b border-border p-2">
              <Button size="sm" className="w-full" onClick={handleNew}>
                <Plus className="h-3.5 w-3.5" /> New Material
              </Button>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search materials…"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-1">
              {filtered.map((m) => {
                const isSelected = m.id === selected?.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                      isSelected ? 'bg-primary/10 text-text-primary' : 'hover:bg-background',
                    )}
                  >
                    <span className="truncate">{m.name}</span>
                    <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[10px] uppercase text-text-secondary">
                      {m.type === 'PredefinedMixture'
                        ? 'Mix'
                        : m.type === 'Cell'
                          ? 'Cell'
                          : 'Pure'}
                    </span>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted">No materials.</div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="shrink-0">Material type</Label>
                  <Select
                    value={selected.type}
                    onValueChange={(v) => patch({ type: v as MaterialType })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selected.type === 'PureComponent' && (
                  <PureComponentForm material={selected} onPatch={patch} />
                )}
                {selected.type === 'PredefinedMixture' && (
                  <MixtureForm material={selected} onPatch={patch} />
                )}
                {selected.type === 'Cell' && <CellForm material={selected} onPatch={patch} />}
              </div>
            ) : (
              <div className="text-sm text-muted">Select or create a material.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
