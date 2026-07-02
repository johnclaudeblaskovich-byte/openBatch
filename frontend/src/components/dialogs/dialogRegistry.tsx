import type { FC } from 'react'
import { Checkbox, Input, Label } from '@/components/ui'
import type { OperationType } from '@/types'
import type { OpFormProps } from './OpFormProps'

/** Per-type Main-tab forms. Populated by P13-02…P13-07. */
export const MAIN_FORMS: Partial<Record<OperationType, FC<OpFormProps>>> = {}

/** Per-type Model-tab forms (for ops with a selectable model). */
export const MODEL_FORMS: Partial<Record<OperationType, FC<OpFormProps>>> = {}

/** Fallback form for operation types without a custom form yet. */
export function GenericForm({ op, update }: OpFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Display name</Label>
        <Input value={op.displayName} onChange={(e) => update({ displayName: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="op-enabled"
          checked={op.isEnabled}
          onCheckedChange={(v) => update({ isEnabled: Boolean(v) })}
        />
        <Label htmlFor="op-enabled">Enabled</Label>
      </div>
      <p className="text-sm text-muted">No dedicated form for “{op.type}” yet.</p>
    </div>
  )
}

export function renderMainTab(props: OpFormProps) {
  const Form = MAIN_FORMS[props.op.type]
  return Form ? <Form {...props} /> : <GenericForm {...props} />
}

export function renderModelTab(props: OpFormProps) {
  const Form = MODEL_FORMS[props.op.type]
  if (Form) return <Form {...props} />
  return <p className="text-sm text-muted">Model: Shortcut (read-only for MVP).</p>
}
