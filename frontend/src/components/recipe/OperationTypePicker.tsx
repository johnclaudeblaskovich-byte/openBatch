import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { opColor } from '@/lib/opColor'
import type { CreatableOperationType } from '@/lib/makeOperation'

interface Group {
  title: string
  types: CreatableOperationType[]
}

const GROUPS: Group[] = [
  { title: 'Materials Movement', types: ['Charge', 'Transfer', 'PressureTransfer'] },
  { title: 'Reaction', types: ['React', 'YieldReact', 'Crystallize', 'Distill'] },
  {
    title: 'Separation',
    types: ['Filter', 'WashCake', 'FilterDry', 'Centrifuge', 'Extract', 'Decant', 'Concentrate'],
  },
  { title: 'Heat Transfer', types: ['Heat', 'Cool', 'Dry'] },
  { title: 'Timing', types: ['Mix', 'Age'] },
  { title: 'Biotech', types: ['Ferment'] },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (type: CreatableOperationType) => void
}

/** Grouped picker for the Tier-1 operation types, color-coded via opColor. */
export default function OperationTypePicker({ open, onOpenChange, onPick }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Operation</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-2 gap-4 overflow-auto">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {group.title}
              </div>
              <div className="flex flex-col gap-1">
                {group.types.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      onPick(type)
                      onOpenChange(false)
                    }}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-background"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-[2px]"
                      style={{ backgroundColor: opColor(type) }}
                    />
                    {type}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
