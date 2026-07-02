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
import MaterialPicker from '@/components/materials/MaterialPicker'
import { useStore } from '@/store'
import { reactionToString } from '@/lib/reactionString'
import { checkReactionBalance, validateReaction } from '@/lib/reactionBalance'
import { cn } from '@/lib/cn'
import type { ChemicalReaction, PhaseType, ReactionComponent } from '@/types'

interface Props {
  reaction: ChemicalReaction
  onPatch: (patch: Partial<ChemicalReaction>) => void
}

const PHASES: PhaseType[] = ['Liquid', 'Solid', 'Gas', 'Mixed']

function ComponentRows({
  title,
  rows,
  onChange,
}: {
  title: string
  rows: ReactionComponent[]
  onChange: (rows: ReactionComponent[]) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([...rows, { materialId: '', stoichiometricCoeff: 1, phase: 'Liquid' }])
          }
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <MaterialPicker
            className="flex-1"
            value={row.materialId}
            onChange={(materialId) => {
              const next = rows.slice()
              next[i] = { ...row, materialId }
              onChange(next)
            }}
          />
          <NumberInput
            className="w-20"
            value={row.stoichiometricCoeff}
            mustBePositive
            onChange={(v) => {
              const next = rows.slice()
              next[i] = { ...row, stoichiometricCoeff: v ?? 1 }
              onChange(next)
            }}
          />
          <Select
            value={row.phase}
            onValueChange={(v) => {
              const next = rows.slice()
              next[i] = { ...row, phase: v as PhaseType }
              onChange(next)
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
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="text-muted hover:text-error"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function ReactionForm({ reaction, onPatch }: Props) {
  const materials = useStore((s) => s.project?.materials)
  const list = materials ?? []
  const nameById = new Map(list.map((m) => [m.id, m.name]))

  const balance = checkReactionBalance(reaction, list)
  const validations = validateReaction(reaction)
  const formulaSkipped = balance.balanced && balance.messages[0]?.includes('formula unavailable')
  const verifiedBalanced = balance.balanced && balance.messages.length === 0

  const exo = reaction.heatOfReaction < 0
  const heatHint =
    reaction.heatOfReaction === 0
      ? 'thermoneutral'
      : exo
        ? 'exothermic (heat released)'
        : 'endothermic (heat absorbed)'

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={reaction.name} onChange={(e) => onPatch({ name: e.target.value })} />
      </div>

      <div className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
        {reactionToString(reaction, list)}
      </div>

      {/* Balance + validation banner */}
      {verifiedBalanced && validations.length === 0 ? (
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Balanced
        </div>
      ) : validations.length === 0 && balance.balanced && formulaSkipped ? (
        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-secondary">
          Balance not checked — {balance.messages[0]}.
        </div>
      ) : (
        <div
          className={cn(
            'space-y-1 rounded-md border px-3 py-2 text-sm',
            'border-warning/30 bg-warning/10 text-warning',
          )}
        >
          {!balance.balanced && (
            <div>Charge/mass imbalance: {balance.messages.join('; ')}</div>
          )}
          {validations.map((m) => (
            <div key={m}>{m}</div>
          ))}
        </div>
      )}

      <ComponentRows
        title="Reactants"
        rows={reaction.reactants}
        onChange={(reactants) => onPatch({ reactants })}
      />
      <ComponentRows
        title="Products"
        rows={reaction.products}
        onChange={(products) => onPatch({ products })}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Key component</Label>
          <Select
            value={reaction.keyComponentId || undefined}
            onValueChange={(v) => onPatch({ keyComponentId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reactant…" />
            </SelectTrigger>
            <SelectContent>
              {reaction.reactants
                .filter((r) => r.materialId)
                .map((r) => (
                  <SelectItem key={r.materialId} value={r.materialId}>
                    {nameById.get(r.materialId) ?? r.materialId}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Reaction type</Label>
          <Select
            value={reaction.reactionType}
            onValueChange={(v) => onPatch({ reactionType: v as ChemicalReaction['reactionType'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Stoichiometric">Stoichiometric</SelectItem>
              <SelectItem value="Yield">Yield</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Conversion (%)</Label>
          <NumberInput
            value={reaction.conversionPct}
            onChange={(v) => onPatch({ conversionPct: v ?? 0 })}
          />
        </div>

        <div className="space-y-1">
          <Label>Heat of reaction (J/mol key)</Label>
          <NumberInput
            value={reaction.heatOfReaction}
            onChange={(v) => onPatch({ heatOfReaction: v ?? 0 })}
          />
          <p className="text-xs text-text-secondary">{heatHint}</p>
        </div>
      </div>
    </div>
  )
}
