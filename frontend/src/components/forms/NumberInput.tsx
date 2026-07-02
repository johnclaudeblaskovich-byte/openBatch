import { useEffect, useState } from 'react'
import { Input } from '@/components/ui'
import { cn } from '@/lib/cn'

interface Props {
  id?: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  /** When true, values <= 0 are rejected (not committed) and show an error. */
  mustBePositive?: boolean
  invalidMessage?: string
  placeholder?: string
  step?: number
  className?: string
  disabled?: boolean
}

/**
 * Controlled numeric input that tolerates partial/empty entry and validates locally. Invalid
 * values (non-numeric, or <= 0 when `mustBePositive`) display an inline error and are NOT
 * committed via onChange, so the store keeps its previous value.
 */
export default function NumberInput({
  id,
  value,
  onChange,
  mustBePositive,
  invalidMessage,
  placeholder,
  step,
  className,
  disabled,
}: Props) {
  const [raw, setRaw] = useState(value === undefined ? '' : String(value))
  const [error, setError] = useState<string | null>(null)

  // Sync when the external value changes (e.g. selecting a different record).
  useEffect(() => {
    setRaw(value === undefined ? '' : String(value))
    setError(null)
  }, [value])

  function handleChange(next: string) {
    setRaw(next)
    if (next.trim() === '') {
      setError(null)
      onChange(undefined)
      return
    }
    const parsed = Number(next)
    if (Number.isNaN(parsed)) {
      setError('Enter a valid number')
      return
    }
    if (mustBePositive && parsed <= 0) {
      setError(invalidMessage ?? 'Must be greater than 0')
      return
    }
    setError(null)
    onChange(parsed)
  }

  return (
    <div className={className}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        value={raw}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(error && 'border-error focus-visible:ring-error')}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}
