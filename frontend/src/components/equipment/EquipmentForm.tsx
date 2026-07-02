import { Plus, X } from 'lucide-react'
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
import NumberInput from '@/components/forms/NumberInput'
import { useStore } from '@/store'
import {
  EQUIPMENT_CLASSES,
  type EquipmentClass,
  type EquipmentUnit,
  type UtilityConnection,
} from '@/types'

const LOCATIONS: UtilityConnection['location'][] = ['Jacket', 'Coil', 'Other']

// Stable empty fallback so the selector never returns a fresh array.
const NO_UTILITIES: import('@/types').Utility[] = []

interface Props {
  equipment: EquipmentUnit
  onPatch: (patch: Partial<EquipmentUnit>) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

/** Detailed equipment-unit form, including auto-computed (or overridden) max fill volume. */
export default function EquipmentForm({ equipment, onPatch }: Props) {
  const utilities = useStore((s) => s.project?.utilities ?? NO_UTILITIES)
  const connections = equipment.utilities

  function setConnections(next: UtilityConnection[]) {
    onPatch({ utilities: next })
  }

  const isOverridden = equipment.maxFillVolume !== undefined
  const autoMaxFill = equipment.totalVolume * equipment.workingVolumeFraction
  const maxFillValue = isOverridden ? equipment.maxFillVolume : autoMaxFill

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Equipment details
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input value={equipment.name} onChange={(e) => onPatch({ name: e.target.value })} />
        </Field>
        <Field label="Tag">
          <Input value={equipment.tag} onChange={(e) => onPatch({ tag: e.target.value })} />
        </Field>

        <Field label="Equipment class">
          <Select
            value={equipment.equipmentClass}
            onValueChange={(v) => onPatch({ equipmentClass: v as EquipmentClass })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Material of construction">
          <Input
            value={equipment.materialOfConstruction}
            onChange={(e) => onPatch({ materialOfConstruction: e.target.value })}
          />
        </Field>

        <Field label="Total volume (m³)">
          <NumberInput
            value={equipment.totalVolume}
            mustBePositive
            onChange={(v) => onPatch({ totalVolume: v ?? 0 })}
          />
        </Field>
        <Field label="Working volume fraction">
          <NumberInput
            value={equipment.workingVolumeFraction}
            mustBePositive
            onChange={(v) => onPatch({ workingVolumeFraction: v ?? 0.8 })}
          />
        </Field>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label>Max fill volume (m³)</Label>
            <span className="text-xs text-muted">{isOverridden ? 'overridden' : 'auto'}</span>
          </div>
          <NumberInput
            value={maxFillValue}
            mustBePositive
            onChange={(v) => onPatch({ maxFillVolume: v })}
          />
          {isOverridden ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => onPatch({ maxFillVolume: undefined })}
            >
              Reset to auto ({autoMaxFill} m³)
            </button>
          ) : (
            <p className="text-xs text-text-secondary">
              auto = total × working = {autoMaxFill} m³
            </p>
          )}
        </div>

        <Field label="Manufacturer">
          <Input
            value={equipment.manufacturer ?? ''}
            onChange={(e) => onPatch({ manufacturer: e.target.value })}
          />
        </Field>
        <Field label="Model">
          <Input
            value={equipment.model ?? ''}
            onChange={(e) => onPatch({ model: e.target.value })}
          />
        </Field>
      </div>

      {/* Utility connections */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Utility connections</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConnections([...connections, { utilityId: '', location: 'Jacket' }])}
          >
            <Plus className="h-3.5 w-3.5" /> Connection
          </Button>
        </div>
        {connections.map((conn, i) => (
          <div key={i} className="flex items-center gap-2">
            <Select
              value={conn.utilityId || undefined}
              onValueChange={(v) => {
                const next = connections.slice()
                next[i] = { ...conn, utilityId: v }
                setConnections(next)
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select utility…" />
              </SelectTrigger>
              <SelectContent>
                {utilities.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={conn.location}
              onValueChange={(v) => {
                const next = connections.slice()
                next[i] = { ...conn, location: v as UtilityConnection['location'] }
                setConnections(next)
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setConnections(connections.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-error"
              aria-label="Remove connection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {connections.length === 0 && (
          <div className="text-sm text-muted">No utility connections.</div>
        )}
      </section>

      <Field label="Notes">
        <Input value={equipment.notes} onChange={(e) => onPatch({ notes: e.target.value })} />
      </Field>
    </div>
  )
}
