import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Tree, type NodeRendererProps } from 'react-arborist'
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react'
import { useStore } from '@/store'
import { opColor } from '@/lib/opColor'
import { createOperation } from '@/lib/makeOperation'
import type { OperationType, Project } from '@/types'
import { cn } from '@/lib/cn'

type NodeKind = 'process' | 'step' | 'unitProcedure' | 'operation'

interface TreeNode {
  id: string
  name: string
  kind: NodeKind
  opType?: OperationType
  children?: TreeNode[]
}

function buildTree(project: Project | null): TreeNode[] {
  if (!project) return []
  return project.processes.map((proc) => ({
    id: proc.id,
    name: proc.name,
    kind: 'process',
    children: proc.steps.map((step) => ({
      id: step.id,
      name: step.name,
      kind: 'step',
      children: step.unitProcedures.map((up, ui) => ({
        id: up.id,
        name: up.name,
        kind: 'unitProcedure',
        children: up.operations.map((op, oi) => ({
          id: op.id,
          name: `${ui + 1}.${oi + 1} ${op.displayName}`,
          kind: 'operation',
          opType: op.type,
        })),
      })),
    })),
  }))
}

interface ContextMenuState {
  x: number
  y: number
  node: TreeNode
}

export default function ProcessExplorer() {
  const project = useStore((s) => s.project)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const select = useStore((s) => s.select)
  const setEditorTab = useStore((s) => s.setEditorTab)
  const addStep = useStore((s) => s.addStep)
  const addUnitProcedure = useStore((s) => s.addUnitProcedure)
  const addOperation = useStore((s) => s.addOperation)
  const deleteOperation = useStore((s) => s.deleteOperation)

  const data = useMemo(() => buildTree(project), [project])

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 280, height: 400 })
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null)
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [ctxMenu])

  function Node({ node, style }: NodeRendererProps<TreeNode>) {
    const d = node.data
    const isSelected = d.id === selectedNodeId
    return (
      <div
        style={style}
        className={cn(
          'flex h-full cursor-pointer select-none items-center gap-1.5 pr-2 text-sm',
          isSelected ? 'bg-primary/10 text-text-primary' : 'text-text-primary hover:bg-background',
        )}
        onClick={() => {
          if (node.isInternal) node.toggle()
          select(d.id, d.kind)
          if (d.kind === 'step') setEditorTab('recipe')
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          select(d.id, d.kind)
          setCtxMenu({ x: e.clientX, y: e.clientY, node: d })
        }}
      >
        <span className="flex w-4 justify-center text-muted">
          {node.isInternal ? (
            node.isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : null}
        </span>
        <NodeIcon kind={d.kind} opType={d.opType} />
        <span className={cn('truncate', d.kind === 'process' && 'font-semibold')}>{d.name}</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {data.length > 0 ? (
        <Tree<TreeNode>
          data={data}
          openByDefault
          width={size.width}
          height={size.height}
          indent={16}
          rowHeight={26}
          disableDrag
          disableDrop
        >
          {Node}
        </Tree>
      ) : (
        <div className="p-3 text-sm text-muted">No processes.</div>
      )}

      {ctxMenu && (
        <ContextMenu
          state={ctxMenu}
          onAddStep={(id) => addStep(id)}
          onAddUnitProcedure={(id) => addUnitProcedure(id)}
          onAddOperation={(id) => addOperation(id, createOperation('Charge'))}
          onDeleteOperation={(id) => deleteOperation(id)}
        />
      )}
    </div>
  )
}

function NodeIcon({ kind, opType }: { kind: NodeKind; opType?: OperationType }) {
  if (kind === 'process') return <Folder className="h-4 w-4 text-text-secondary" />
  if (kind === 'step') return <FileText className="h-4 w-4 text-text-secondary" />
  if (kind === 'unitProcedure')
    return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
  return (
    <span
      className="h-2.5 w-2.5 rounded-[2px]"
      style={{ backgroundColor: opType ? opColor(opType) : '#84CC16' }}
    />
  )
}

function ContextMenu({
  state,
  onAddStep,
  onAddUnitProcedure,
  onAddOperation,
  onDeleteOperation,
}: {
  state: ContextMenuState
  onAddStep: (processId: string) => void
  onAddUnitProcedure: (stepId: string) => void
  onAddOperation: (upId: string) => void
  onDeleteOperation: (opId: string) => void
}) {
  const { node } = state
  const items: { label: string; action: () => void }[] = []
  if (node.kind === 'process') items.push({ label: 'Add Step', action: () => onAddStep(node.id) })
  if (node.kind === 'step')
    items.push({ label: 'Add Unit Procedure', action: () => onAddUnitProcedure(node.id) })
  if (node.kind === 'unitProcedure')
    items.push({ label: 'Add Operation', action: () => onAddOperation(node.id) })
  if (node.kind === 'operation')
    items.push({ label: 'Delete', action: () => onDeleteOperation(node.id) })

  return (
    <div
      className="fixed z-50 min-w-[10rem] rounded-md border border-border bg-panel p-1 text-sm shadow-lg"
      style={{ left: state.x, top: state.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.length === 0 ? (
        <div className="px-2 py-1.5 text-muted">No actions</div>
      ) : (
        items.map((it) => (
          <button
            key={it.label}
            className="block w-full rounded-sm px-2 py-1.5 text-left hover:bg-background"
            onClick={() => it.action()}
          >
            {it.label}
          </button>
        ))
      )}
    </div>
  )
}
