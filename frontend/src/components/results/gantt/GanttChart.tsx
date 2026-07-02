import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/store'
import { makeTicks, makeTimeScale } from './ganttScale'
import { upColor } from './ganttColors'
import GanttTooltip, { type GanttTooltipData } from './GanttTooltip'
import type { StepResultView } from '../resultTypes'

const GUTTER = 130
const AXIS_H = 24
const ROW_H = 28
const BAR_PAD = 4

interface Bar {
  opId: string
  label: string
  unitProcedureId: string | null | undefined
  equipmentId: string
  startMin: number
  endMin: number
}

export default function GanttChart({ result }: { result: StepResultView }) {
  const project = useStore((s) => s.project)
  const select = useStore((s) => s.select)
  const [tip, setTip] = useState<GanttTooltipData | null>(null)

  const equipName = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of project?.facilities ?? []) for (const e of f.equipmentUnits) m.set(e.id, e.name)
    return m
  }, [project])

  const { bars, rows, batchTime } = useMemo(() => {
    const bars: Bar[] = []
    const rowSet: string[] = []
    let maxEnd = 0
    for (const r of result.operationResults) {
      const start = r.scheduledStartMin ?? 0
      const end = r.scheduledEndMin ?? start
      maxEnd = Math.max(maxEnd, end)
      for (const eq of r.equipmentIds) {
        if (!rowSet.includes(eq)) rowSet.push(eq)
        bars.push({
          opId: r.operationId,
          label: r.operationName,
          unitProcedureId: r.unitProcedureId,
          equipmentId: eq,
          startMin: start,
          endMin: end,
        })
      }
    }
    return { bars, rows: rowSet, batchTime: result.batchTimeMin || maxEnd }
  }, [result])

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  if (bars.length === 0) {
    return <div className="p-3 text-sm text-muted">No scheduled operations to chart.</div>
  }

  const chartWidth = Math.max(width - GUTTER - 8, 80)
  const scale = makeTimeScale(batchTime, chartWidth)
  const ticks = makeTicks(batchTime)
  const height = AXIS_H + rows.length * ROW_H + 8

  return (
    <div ref={containerRef} className="w-full overflow-x-auto p-2">
      <svg width={width} height={height} role="img" aria-label="Equipment occupancy Gantt chart">
        {/* Gridlines + axis ticks */}
        {ticks.map((t) => {
          const x = GUTTER + scale.toPx(t)
          return (
            <g key={t}>
              <line x1={x} y1={AXIS_H} x2={x} y2={height} stroke="#E2E8F0" strokeWidth={1} />
              <text x={x} y={16} fill="#64748B" fontSize={10} textAnchor="middle">
                {t}
              </text>
            </g>
          )
        })}

        {/* Equipment rows + labels */}
        {rows.map((eq, i) => {
          const y = AXIS_H + i * ROW_H
          return (
            <g key={eq}>
              <line x1={0} y1={y} x2={width} y2={y} stroke="#E2E8F0" strokeWidth={1} />
              <text x={8} y={y + ROW_H / 2 + 4} fill="#0F172A" fontSize={11}>
                {equipName.get(eq) ?? eq}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {bars.map((b, i) => {
          const rowIndex = rows.indexOf(b.equipmentId)
          const x = GUTTER + scale.toPx(b.startMin)
          const w = Math.max(scale.toPx(b.endMin - b.startMin), 1)
          const y = AXIS_H + rowIndex * ROW_H + BAR_PAD
          const barH = ROW_H - BAR_PAD * 2
          const clipId = `bar-clip-${i}`
          return (
            <g key={`${b.opId}-${b.equipmentId}-${i}`}>
              <defs>
                <clipPath id={clipId}>
                  <rect x={x} y={y} width={w} height={barH} rx={2} />
                </clipPath>
              </defs>
              <rect
                x={x}
                y={y}
                width={w}
                height={barH}
                rx={2}
                fill={upColor(b.unitProcedureId)}
                className="cursor-pointer opacity-85 hover:opacity-100"
                onClick={() => select(b.opId, 'operation')}
                onMouseMove={(e) =>
                  setTip({
                    label: b.label,
                    equipmentName: equipName.get(b.equipmentId) ?? b.equipmentId,
                    startMin: b.startMin,
                    endMin: b.endMin,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
                onMouseLeave={() => setTip(null)}
              />
              {w > 28 && (
                <text
                  x={x + 4}
                  y={y + barH / 2 + 3}
                  fill="#FFFFFF"
                  fontSize={10}
                  clipPath={`url(#${clipId})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {b.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Batch-time marker */}
        {batchTime > 0 && (
          <g>
            <line
              x1={GUTTER + scale.toPx(batchTime)}
              y1={AXIS_H}
              x2={GUTTER + scale.toPx(batchTime)}
              y2={height}
              stroke="#2563EB"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={GUTTER + scale.toPx(batchTime) - 4}
              y={AXIS_H + 12}
              fill="#2563EB"
              fontSize={10}
              textAnchor="end"
            >
              Batch time: {Math.round(batchTime)} min
            </text>
          </g>
        )}
      </svg>

      {tip && <GanttTooltip data={tip} />}
    </div>
  )
}
