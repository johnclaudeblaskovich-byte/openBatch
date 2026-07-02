import { Printer, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useStore } from '@/store'
import GanttChart from '@/components/results/gantt/GanttChart'
import StreamTable from '@/components/results/StreamTable'
import MaterialBalanceReport from '@/components/results/MaterialBalanceReport'
import EquipmentContentsReport from '@/components/results/EquipmentContentsReport'
import type { StepResultView } from '@/components/results/resultTypes'
import { generateTextRecipe } from '@/recipe/generateTextRecipe'
import type { Project, Step } from '@/types'
import '@/report/printStyles.css'

interface Props {
  step: Step
  project: Project
  result?: StepResultView
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="report-section mb-6">
      <h2 className="mb-2 border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Full-page, print-friendly report for a single step: title block, text recipe, and — when a
 * simulation result exists — the Gantt, stream table, material balance and equipment contents.
 * The "Print" button calls window.print(); printStyles.css hides all non-report chrome.
 */
export default function StepReport({ step, project, result, onClose }: Props) {
  const processName =
    useStore.getState().project?.processes.find((p) => p.steps.some((s) => s.id === step.id))?.name ??
    ''

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-panel">
      {/* Toolbar (never printed) */}
      <div className="no-print sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-panel px-4 py-2">
        <span className="text-sm font-semibold text-text-primary">Step Report</span>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="h-3.5 w-3.5" /> Close
          </Button>
        </div>
      </div>

      <div className="report-root mx-auto max-w-5xl p-6 text-text-primary">
        {/* Title block */}
        <div className="report-section mb-6">
          <h1 className="text-xl font-bold">{step.name}</h1>
          <div className="mt-1 text-sm text-text-secondary">
            {project.name}
            {processName ? ` · ${processName}` : ''}
          </div>
          <div className="mt-1 text-xs text-muted">
            Generated {new Date().toLocaleString()}
            {result ? ` · Batch time ${Math.round(result.batchTimeMin)} min` : ''}
          </div>
        </div>

        <Section title="Recipe">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-primary">
            {generateTextRecipe(step, project)}
          </pre>
        </Section>

        {result ? (
          <>
            <Section title="Equipment Occupancy (Gantt)">
              <GanttChart result={result} />
            </Section>
            <Section title="Stream Table">
              <StreamTable result={result} />
            </Section>
            <Section title="Material Balance">
              <MaterialBalanceReport result={result} />
            </Section>
            <Section title="Equipment Contents">
              <EquipmentContentsReport result={result} />
            </Section>
          </>
        ) : (
          <div className="rounded-md border border-border bg-background px-3 py-4 text-sm text-muted">
            No simulation results yet — run a simulation to include the Gantt, stream table, material
            balance and equipment contents in this report.
          </div>
        )}
      </div>
    </div>
  )
}
