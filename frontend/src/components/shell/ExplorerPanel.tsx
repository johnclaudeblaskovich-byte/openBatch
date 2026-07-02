import ProcessExplorer from './ProcessExplorer'
import PlanExplorer from '@/components/plan/PlanExplorer'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border bg-panel px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
      {children}
    </div>
  )
}

/**
 * Left explorer panel: the Process tree on top (scrollable, fills space) over a fixed Plan list
 * at the bottom, separated by section headers + a divider.
 */
export default function ExplorerPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-panel">
      <SectionHeader>Processes</SectionHeader>
      <div className="min-h-0 flex-1">
        <ProcessExplorer />
      </div>
      <div className="h-px shrink-0 bg-border" />
      <SectionHeader>Production Plans</SectionHeader>
      <div className="h-40 shrink-0 overflow-hidden border-t border-border">
        <PlanExplorer />
      </div>
    </div>
  )
}
