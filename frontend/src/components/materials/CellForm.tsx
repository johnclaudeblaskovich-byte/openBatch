import { Input, Label } from '@/components/ui'
import type { Material } from '@/types'

interface Props {
  material: Material
  onPatch: (patch: Partial<Material>) => void
}

/** Editor for cell materials used in fermentation. */
export default function CellForm({ material, onPatch }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={material.name} onChange={(e) => onPatch({ name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Cell type</Label>
        <Input
          value={material.cellType ?? ''}
          onChange={(e) => onPatch({ cellType: e.target.value })}
          placeholder="e.g. E. coli, CHO"
        />
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Input value={material.notes} onChange={(e) => onPatch({ notes: e.target.value })} />
      </div>
    </div>
  )
}
