import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import NumberInput from '@/components/forms/NumberInput'
import { useStore, genId } from '@/store'
import type { Utility } from '@/types'

const TYPES: Utility['type'][] = ['Heating', 'Cooling', 'Other']

/** Count how many equipment units connect to a given utility. */
function connectionCount(utilityId: string, project: ReturnType<typeof useStore.getState>['project']) {
  if (!project) return 0
  let n = 0
  for (const f of project.facilities)
    for (const e of f.equipmentUnits)
      if (e.utilities.some((c) => c.utilityId === utilityId)) n++
  return n
}

/** Project-level utility catalog (cooling water, steam, etc.). */
export default function UtilitiesPanel() {
  const project = useStore((s) => s.project)
  const utilities = project?.utilities ?? []
  const upsertUtility = useStore((s) => s.upsertUtility)
  const deleteUtility = useStore((s) => s.deleteUtility)

  const [pending, setPending] = useState<{ utility: Utility; count: number } | null>(null)

  function add() {
    upsertUtility({
      id: genId('util'),
      name: 'New Utility',
      type: 'Cooling',
      supplyTemperature: 7,
    })
  }

  function requestDelete(u: Utility) {
    const count = connectionCount(u.id, project)
    if (count > 0) setPending({ utility: u, count })
    else deleteUtility(u.id)
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Utilities
        </h3>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="h-3.5 w-3.5" /> Utility
        </Button>
      </div>

      <div className="space-y-2">
        {utilities.map((u) => (
          <div key={u.id} className="flex items-center gap-2">
            <Input
              className="flex-1"
              value={u.name}
              onChange={(e) => upsertUtility({ ...u, name: e.target.value })}
            />
            <Select
              value={u.type}
              onValueChange={(v) => upsertUtility({ ...u, type: v as Utility['type'] })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NumberInput
              className="w-24"
              value={u.supplyTemperature}
              placeholder="Supply °C"
              onChange={(v) => upsertUtility({ ...u, supplyTemperature: v ?? 0 })}
            />
            <NumberInput
              className="w-24"
              value={u.returnTemperature}
              placeholder="Return °C"
              onChange={(v) => upsertUtility({ ...u, returnTemperature: v })}
            />
            <button
              onClick={() => requestDelete(u)}
              className="text-muted hover:text-error"
              aria-label={`Delete ${u.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {utilities.length === 0 && <div className="text-sm text-muted">No utilities.</div>}
      </div>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pending?.utility.name}?</DialogTitle>
            <DialogDescription>
              This utility is connected to {pending?.count} equipment unit
              {pending && pending.count === 1 ? '' : 's'}. Deleting it will leave those connections
              dangling.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pending) deleteUtility(pending.utility.id)
                setPending(null)
              }}
            >
              Delete anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
