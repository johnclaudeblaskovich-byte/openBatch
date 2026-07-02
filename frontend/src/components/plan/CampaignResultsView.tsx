import { useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui'
import { useStore } from '@/store'
import { runCampaign } from '@/api/campaign'
import { toast } from '@/lib/toast'
import GanttChart from '@/components/results/gantt/GanttChart'
import StreamTable from '@/components/results/StreamTable'
import MaterialBalanceReport from '@/components/results/MaterialBalanceReport'
import EquipmentContentsReport from '@/components/results/EquipmentContentsReport'
import type { StepResultView } from '@/components/results/resultTypes'
import { cn } from '@/lib/cn'

interface CampaignBatch extends StepResultView {
  batchIndex: number
  batchStartMin: number
  entryId?: string
}

interface CampaignResultView {
  planId: string
  totalBatches: number
  totalTimeMin: number
  batchResults: CampaignBatch[]
  equipmentUtilization: Record<string, number>
  solvedAt: string
}

type DrillTab = 'gantt' | 'streams' | 'balance' | 'contents'

export default function CampaignResultsView({ planId }: { planId: string }) {
  const project = useStore((s) => s.project)
  const setCampaignResult = useStore((s) => s.setCampaignResult)
  const campaign = useStore(
    (s) => s.campaignResultByPlan[planId] as unknown as CampaignResultView | undefined,
  )

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [selectedBatch, setSelectedBatch] = useState(0)
  const [drillTab, setDrillTab] = useState<DrillTab>('gantt')

  async function run() {
    if (!project) return
    setProgress({ done: 0, total: 0 })
    await runCampaign(project, planId, {
      onProgress: (done, total) => setProgress({ done, total }),
      onComplete: (result) => {
        setCampaignResult(planId, result as never)
        setProgress(null)
        setSelectedBatch(0)
        toast('Campaign complete')
      },
      onError: (message) => {
        setProgress(null)
        toast(`Campaign failed: ${message}`)
      },
    })
  }

  // Combined multi-batch Gantt: offset each batch along the time axis, prefix labels with batch #.
  const combined = useMemo<StepResultView | null>(() => {
    if (!campaign) return null
    return {
      stepId: 'campaign',
      operationResults: campaign.batchResults.flatMap((b) =>
        b.operationResults.map((o) => ({
          ...o,
          operationName: `B${b.batchIndex}: ${o.operationName}`,
          scheduledStartMin: (o.scheduledStartMin ?? 0) + b.batchStartMin,
          scheduledEndMin: (o.scheduledEndMin ?? 0) + b.batchStartMin,
        })),
      ),
      streams: [],
      equipmentContents: [],
      finalEquipmentContents: [],
      materialBalance: [],
      batchTimeMin: campaign.totalTimeMin,
      cycleTimeMin: campaign.totalTimeMin,
      warnings: [],
      solvedAt: campaign.solvedAt,
    }
  }, [campaign])

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center gap-3">
        <Button onClick={run} disabled={!!progress}>
          <Play className="h-4 w-4" /> Run Campaign
        </Button>
        {progress && (
          <span className="text-sm text-text-secondary">
            Simulating {progress.total ? `${progress.done}/${progress.total}` : '…'}
          </span>
        )}
      </div>

      {campaign && combined && (
        <>
          {/* KPIs */}
          <div className="grid max-w-2xl grid-cols-3 gap-3">
            <Kpi label="Total batches" value={String(campaign.totalBatches)} />
            <Kpi
              label="Campaign time"
              value={`${Math.round(campaign.totalTimeMin)} min (${(campaign.totalTimeMin / 60).toFixed(1)} h)`}
            />
            <Kpi
              label="Avg cycle time"
              value={`${Math.round(
                campaign.batchResults.reduce((a, b) => a + b.batchTimeMin, 0) /
                  Math.max(campaign.batchResults.length, 1),
              )} min`}
            />
          </div>

          {/* Stacked multi-batch Gantt */}
          <div>
            <h3 className="mb-1 text-sm font-semibold">Campaign schedule</h3>
            <div className="rounded-md border border-border">
              <GanttChart result={combined} />
            </div>
          </div>

          {/* Per-batch drill-down */}
          <div>
            <h3 className="mb-1 text-sm font-semibold">Batch details</h3>
            <div className="mb-2 flex flex-wrap gap-1">
              {campaign.batchResults.map((b, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedBatch(i)}
                  className={cn(
                    'rounded-sm border px-2 py-1 text-xs',
                    i === selectedBatch
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-background',
                  )}
                >
                  Batch {b.batchIndex}
                </button>
              ))}
            </div>

            <div className="flex gap-1 border-b border-border">
              {(['gantt', 'streams', 'balance', 'contents'] as DrillTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setDrillTab(t)}
                  className={cn(
                    'border-b-2 px-3 py-1.5 text-sm font-medium',
                    drillTab === t
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary',
                  )}
                >
                  {t === 'gantt'
                    ? 'Gantt'
                    : t === 'streams'
                      ? 'Streams'
                      : t === 'balance'
                        ? 'Balance'
                        : 'Contents'}
                </button>
              ))}
            </div>

            {campaign.batchResults[selectedBatch] && (
              <div className="max-h-[40vh] overflow-auto">
                {drillTab === 'gantt' && <GanttChart result={campaign.batchResults[selectedBatch]} />}
                {drillTab === 'streams' && <StreamTable result={campaign.batchResults[selectedBatch]} />}
                {drillTab === 'balance' && (
                  <MaterialBalanceReport result={campaign.batchResults[selectedBatch]} />
                )}
                {drillTab === 'contents' && (
                  <EquipmentContentsReport result={campaign.batchResults[selectedBatch]} />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-xs uppercase text-text-secondary">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-text-primary">{value}</div>
    </div>
  )
}
