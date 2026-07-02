export interface GanttTooltipData {
  label: string
  equipmentName: string
  startMin: number
  endMin: number
  x: number
  y: number
}

/** Cursor-following tooltip for a hovered Gantt bar. */
export default function GanttTooltip({ data }: { data: GanttTooltipData }) {
  const duration = data.endMin - data.startMin
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-md border border-border bg-text-primary px-2.5 py-1.5 text-xs text-panel shadow-lg"
      style={{ left: data.x + 12, top: data.y + 12 }}
    >
      <div className="font-semibold">{data.label}</div>
      <div className="text-panel/80">{data.equipmentName}</div>
      <div className="font-mono text-panel/80">
        {Math.round(data.startMin)}–{Math.round(data.endMin)} min ({Math.round(duration)} min)
      </div>
    </div>
  )
}
