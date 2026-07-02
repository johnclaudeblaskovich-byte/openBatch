import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'

interface Props {
  value: string
  onChange: (materialId: string) => void
  placeholder?: string
  className?: string
}

/**
 * Reusable combobox that searches the project's materials by name and alias and returns a
 * materialId. Used by the mixture editor, reactions editor, and operation dialogs.
 */
export default function MaterialPicker({ value, onChange, placeholder, className }: Props) {
  const materials = useStore((s) => s.project?.materials)
  const list = useMemo(() => materials ?? [], [materials])
  const selected = list.find((m) => m.id === value)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.aliases.some((a) => a.toLowerCase().includes(q)),
    )
  }, [list, query])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-panel px-3 text-sm"
      >
        <span className={cn('truncate', !selected && 'text-muted')}>
          {selected ? selected.name : (placeholder ?? 'Select material…')}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-panel shadow-lg">
          <div className="p-1">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or alias…"
              className="h-8"
            />
          </div>
          <div className="max-h-56 overflow-auto p-1">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(m.id)
                  setOpen(false)
                  setQuery('')
                }}
                className="flex w-full flex-col rounded-sm px-2 py-1.5 text-left text-sm hover:bg-background"
              >
                <span className="truncate">{m.name}</span>
                {m.aliases.length > 0 && (
                  <span className="truncate text-xs text-muted">{m.aliases.join(', ')}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted">No matches.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
