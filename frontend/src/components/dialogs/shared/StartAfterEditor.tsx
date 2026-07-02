import { useState } from 'react'
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
import type { AnyOperation, Step } from '@/types'

interface Props {
  op: AnyOperation
  step: Step
  update: (patch: Record<string, unknown>) => void
}

/** Edits BaseOperation.startAfterConstraints: target operation (within the step) + delay. */
export default function StartAfterEditor({ op, step, update }: Props) {
  const constraints = op.startAfterConstraints ?? []
  const targets = step.unitProcedures
    .flatMap((u) => u.operations)
    .filter((o) => o.id !== op.id)

  const [targetId, setTargetId] = useState('')
  const [delay, setDelay] = useState<number | undefined>(0)

  function add() {
    if (!targetId) return
    update({
      startAfterConstraints: [
        ...constraints,
        { targetOperationId: targetId, delayMin: delay ?? 0 },
      ],
    })
    setTargetId('')
    setDelay(0)
  }

  function nameFor(id: string) {
    return targets.find((t) => t.id === id)?.displayName ?? id
  }

  return (
    <div className="space-y-2">
      <Label>Start-after constraints</Label>
      {constraints.map((c, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="flex-1">
            After <span className="font-medium">{nameFor(c.targetOperationId)}</span> + {c.delayMin}{' '}
            min
          </span>
          <button
            type="button"
            onClick={() =>
              update({ startAfterConstraints: constraints.filter((_, idx) => idx !== i) })
            }
            className="text-muted hover:text-error"
            aria-label="Remove constraint"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Select value={targetId || undefined} onValueChange={setTargetId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Target operation…" />
          </SelectTrigger>
          <SelectContent>
            {targets.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NumberInput className="w-24" value={delay} onChange={setDelay} placeholder="delay min" />
        <Button size="sm" variant="outline" onClick={add} disabled={!targetId}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </div>
  )
}
