import { useStore } from '@/store'
import type { ResultsTab } from '@/store'
import { cn } from '@/lib/cn'

const TABS: { value: ResultsTab; label: string }[] = [
  { value: 'gantt', label: 'Gantt' },
  { value: 'streams', label: 'Stream Table' },
  { value: 'balance', label: 'Material Balance' },
  { value: 'contents', label: 'Equipment Contents' },
  { value: 'warnings', label: 'Warnings' },
]

/** Pill-style tab bar for the results panel (active = primary text + bottom border). */
export default function ResultsTabBar({ warningCount = 0 }: { warningCount?: number }) {
  const active = useStore((s) => s.activeResultsTab)
  const setTab = useStore((s) => s.setActiveResultsTab)

  return (
    <div className="flex items-center gap-1 px-2">
      {TABS.map((t) => (
        <button
          key={t.value}
          onClick={() => setTab(t.value)}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm font-medium transition-colors',
            active === t.value
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary',
          )}
        >
          {t.label}
          {t.value === 'warnings' && warningCount > 0 && (
            <span className="rounded-full bg-warning px-1.5 text-xs font-semibold text-panel">
              {warningCount}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
