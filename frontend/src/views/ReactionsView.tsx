import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useStore, genId } from '@/store'
import ReactionForm from '@/components/reactions/ReactionForm'
import { reactionToString } from '@/lib/reactionString'
import { cn } from '@/lib/cn'
import type { ChemicalReaction, ReactionDataSet } from '@/types'

function newReactionSet(): ReactionDataSet {
  return { id: genId('rxnset'), name: 'New Reaction Set', description: '', reactions: [] }
}

function newReaction(): ChemicalReaction {
  return {
    id: genId('rxn'),
    name: 'New Reaction',
    reactants: [],
    products: [],
    keyComponentId: '',
    conversionPct: 100,
    heatOfReaction: 0,
    reactionType: 'Stoichiometric',
  }
}

export default function ReactionsView() {
  const sets = useStore((s) => s.project?.reactions)
  const materials = useStore((s) => s.project?.materials)
  const upsertReactionSet = useStore((s) => s.upsertReactionSet)

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [selectedReactionId, setSelectedReactionId] = useState<string | null>(null)

  const list = sets ?? []
  const matList = materials ?? []
  const set = list.find((s) => s.id === selectedSetId) ?? list[0] ?? null
  const reaction =
    set?.reactions.find((r) => r.id === selectedReactionId) ?? set?.reactions[0] ?? null

  function addSet() {
    const s = newReactionSet()
    upsertReactionSet(s)
    setSelectedSetId(s.id)
    setSelectedReactionId(null)
  }

  function addReaction() {
    if (!set) return
    const r = newReaction()
    upsertReactionSet({ ...set, reactions: [...set.reactions, r] })
    setSelectedReactionId(r.id)
  }

  function patchReaction(patch: Partial<ChemicalReaction>) {
    if (!set || !reaction) return
    upsertReactionSet({
      ...set,
      reactions: set.reactions.map((r) => (r.id === reaction.id ? { ...r, ...patch } : r)),
    })
  }

  return (
    <div className="flex h-full">
      {/* Reaction sets */}
      <div className="flex w-56 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border p-2">
          <Button size="sm" className="w-full" onClick={addSet}>
            <Plus className="h-3.5 w-3.5" /> Reaction Set
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-1">
          {list.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSetId(s.id)
                setSelectedReactionId(null)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                s.id === set?.id ? 'bg-primary/10 text-text-primary' : 'hover:bg-background',
              )}
            >
              <span className="truncate">{s.name}</span>
              <span className="shrink-0 text-xs text-muted">{s.reactions.length}</span>
            </button>
          ))}
          {list.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted">No reaction sets.</div>
          )}
        </div>
      </div>

      {/* Selected set */}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {!set ? (
          <div className="text-sm text-muted">Create a reaction set.</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Input
                value={set.name}
                onChange={(e) => upsertReactionSet({ ...set, name: e.target.value })}
                className="text-sm font-semibold"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {set.reactions.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReactionId(r.id)}
                  className={cn(
                    'rounded-sm border px-2 py-1 text-xs',
                    r.id === reaction?.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-background',
                  )}
                  title={reactionToString(r, matList)}
                >
                  {r.name}
                </button>
              ))}
              <Button size="sm" variant="outline" onClick={addReaction}>
                <Plus className="h-3.5 w-3.5" /> Reaction
              </Button>
            </div>

            {reaction ? (
              <ReactionForm reaction={reaction} onPatch={patchReaction} />
            ) : (
              <div className="text-sm text-muted">Add a reaction to this set.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
