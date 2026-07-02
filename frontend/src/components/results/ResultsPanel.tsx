import { AlertCircle } from 'lucide-react'
import { useStore } from '@/store'
import { useStepResult } from './resultTypes'
import ResultsTabBar from './ResultsTabBar'
import GanttChart from './gantt/GanttChart'
import StreamTable from './StreamTable'
import MaterialBalanceReport from './MaterialBalanceReport'
import EquipmentContentsReport from './EquipmentContentsReport'
import WarningsPanel from './WarningsPanel'
import ExportMenu from './ExportMenu'
import {
  equipmentContentsToExport,
  materialBalanceToExport,
  streamTableToExport,
} from '@/export/exportTables'

/** Right-column results panel: a tab bar over the read-only result of the selected step. */
export default function ResultsPanel() {
  const activeTab = useStore((s) => s.activeResultsTab)
  const project = useStore((s) => s.project)
  const job = useStore((s) => s.currentJob)
  const simError = useStore((s) => s.simError)
  const { step, result } = useStepResult()

  // Result-level error banner — surfaces a backend/solver/connection failure without crashing.
  if (simError && !result) {
    return (
      <div className="flex items-start gap-2 border-t border-border bg-error/10 px-3 py-2 text-sm text-error">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Simulation failed: {simError}</span>
      </div>
    )
  }

  // Loading skeleton while a solve is in flight and no prior result exists.
  if (job?.status === 'running' && !result) {
    return (
      <div className="space-y-2 border-t border-border bg-panel p-3">
        <div className="h-4 w-40 animate-pulse rounded bg-background" />
        <div className="h-24 w-full animate-pulse rounded bg-background" />
        <div className="text-xs text-muted">
          Simulating{job.total ? ` ${job.done ?? 0}/${job.total}` : ''}…
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex h-7 items-center border-t border-border bg-background px-3 text-xs text-muted">
        {step ? 'Run a simulation to see results' : 'Select a step to see results'}
      </div>
    )
  }

  const base = (step?.name ?? 'step').replace(/\s+/g, '_')
  const warningCount = result.ruleWarnings?.length ?? 0

  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-border bg-panel">
      {/* A re-simulation failure surfaces here even when a prior (stale) result is shown. */}
      {simError && (
        <div className="flex items-start gap-2 border-b border-error/30 bg-error/10 px-3 py-1.5 text-xs text-error">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Last simulation failed: {simError} — showing the previous result.</span>
        </div>
      )}
      <div className="flex items-center border-b border-border">
        <ResultsTabBar warningCount={warningCount} />
        <div className="ml-auto px-2">
          {activeTab === 'streams' && (
            <ExportMenu
              filenameBase={`${base}_streams`}
              build={() => streamTableToExport(result, project)}
            />
          )}
          {activeTab === 'balance' && (
            <ExportMenu
              filenameBase={`${base}_material_balance`}
              build={() => materialBalanceToExport(result, project)}
            />
          )}
          {activeTab === 'contents' && (
            <ExportMenu
              filenameBase={`${base}_equipment_contents`}
              build={() => equipmentContentsToExport(result, project)}
            />
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === 'gantt' && <GanttChart result={result} />}
        {activeTab === 'streams' && <StreamTable result={result} />}
        {activeTab === 'balance' && <MaterialBalanceReport result={result} />}
        {activeTab === 'contents' && <EquipmentContentsReport result={result} />}
        {activeTab === 'warnings' && <WarningsPanel result={result} />}
      </div>
    </div>
  )
}
