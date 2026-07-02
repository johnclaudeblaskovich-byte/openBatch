import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui'

interface Props {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

/** Simple tag input: type + Enter (or comma) to add, click × to remove. */
export default function TagInput({ values, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-panel p-1">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded bg-background px-2 py-0.5 text-xs text-text-primary"
        >
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="text-muted hover:text-error"
            aria-label={`Remove ${v}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder={placeholder ?? 'Add…'}
        className="h-6 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
      />
    </div>
  )
}
