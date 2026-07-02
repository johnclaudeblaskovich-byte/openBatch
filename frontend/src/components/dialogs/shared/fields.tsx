import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { useStore } from '@/store'
import { resolveStep } from '@/lib/resolveStep'
import type { AnyOperation, EquipmentUnit, Utility } from '@/types'

/**
 * Loose typed reader over an operation draft. Operation field sets diverge between the frontend
 * interfaces and the backend solvers (and forms write the backend-aligned names), so forms read
 * via this helper rather than the strict union type.
 */
export function reader(op: AnyOperation) {
  const o = op as unknown as Record<string, unknown>
  return {
    num: (k: string): number | undefined => o[k] as number | undefined,
    str: (k: string): string | undefined => o[k] as string | undefined,
    bool: (k: string): boolean | undefined => o[k] as boolean | undefined,
    arr: <T,>(k: string): T[] => (o[k] as T[] | undefined) ?? [],
    raw: o,
  }
}

/** Label + control wrapper used by every operation form. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

/** The equipment units of the currently-selected step's facility. */
export function useStepEquipment(): EquipmentUnit[] {
  const project = useStore((s) => s.project)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedNodeType = useStore((s) => s.selectedNodeType)
  const step = resolveStep(project, selectedNodeId, selectedNodeType)
  if (!project || !step) return []
  const facility = project.facilities.find((f) => f.id === step.facilityId)
  return facility?.equipmentUnits ?? []
}

interface EquipmentSelectProps {
  value: string | undefined
  onChange: (id: string) => void
  placeholder?: string
}

/** Select listing the step facility's equipment by tag. */
export function EquipmentSelect({ value, onChange, placeholder }: EquipmentSelectProps) {
  const equipment = useStepEquipment()
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? 'Select equipment…'} />
      </SelectTrigger>
      <SelectContent>
        {equipment.map((e) => (
          <SelectItem key={e.id} value={e.id}>
            {e.tag} ({e.name})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface UtilitySelectProps {
  value: string | undefined
  onChange: (id: string) => void
  /** Filter to only this utility type (e.g. Heating/Cooling). */
  filterType?: Utility['type']
  placeholder?: string
}

/** Select listing the project's utilities, optionally filtered by type. */
export function UtilitySelect({ value, onChange, filterType, placeholder }: UtilitySelectProps) {
  const utilities = useStore((s) => s.project?.utilities)
  const list = (utilities ?? []).filter((u) => !filterType || u.type === filterType)
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? 'Select utility…'} />
      </SelectTrigger>
      <SelectContent>
        {list.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
