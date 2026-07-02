import { useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui'
import { useStore } from '@/store'
import { toast } from '@/lib/toast'
import { useSimulation } from '@/hooks/useSimulation'
import { resolveStep } from '@/lib/resolveStep'
import { downloadBpd, loadBpdIntoStore } from '@/io/bpd'

function MenuButton({ label }: { label: string }) {
  return (
    <DropdownMenuTrigger asChild>
      <button className="rounded px-2 py-1 text-text-secondary outline-none hover:bg-background data-[state=open]:bg-background data-[state=open]:text-text-primary">
        {label}
      </button>
    </DropdownMenuTrigger>
  )
}

export default function MenuBar() {
  const newProject = useStore((s) => s.newProject)
  const setEditorTab = useStore((s) => s.setEditorTab)
  const deleteOperation = useStore((s) => s.deleteOperation)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedNodeType = useStore((s) => s.selectedNodeType)
  const project = useStore((s) => s.project)
  const { simulate } = useSimulation()

  const [aboutOpen, setAboutOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canDeleteSelected = selectedNodeType === 'operation' && !!selectedNodeId

  function saveBpd() {
    if (!project) {
      toast('No project to save')
      return
    }
    downloadBpd(project)
    toast(`Saved ${project.name}.bpd`)
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-opening the same file
    if (!file) return
    try {
      const loaded = await loadBpdIntoStore(file)
      toast(`Opened ${loaded.name}`)
    } catch (err) {
      toast(`Could not open file: ${(err as Error).message}`)
    }
  }

  function simulateCurrentStep() {
    const step = resolveStep(project, selectedNodeId, selectedNodeType)
    if (!step) {
      toast('Select a step to simulate')
      return
    }
    void simulate(step.id)
  }

  return (
    <div className="flex h-9 items-center gap-1 border-b border-border bg-panel px-2 text-sm">
      <span className="px-2 font-semibold text-primary">OpenBatch</span>

      {/* File */}
      <DropdownMenu>
        <MenuButton label="File" />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => newProject()}>New Project</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
            Open (.bpd)…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => saveBpd()}>Save (.bpd)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit */}
      <DropdownMenu>
        <MenuButton label="Edit" />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => toast('Undo — coming soon')}>Undo</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast('Redo — coming soon')}>Redo</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canDeleteSelected}
            onSelect={() => {
              if (canDeleteSelected && selectedNodeId) deleteOperation(selectedNodeId)
            }}
          >
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Data */}
      <DropdownMenu>
        <MenuButton label="Data" />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setEditorTab('materials')}>
            Materials
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditorTab('reactions')}>
            Reactions
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditorTab('equipment')}>
            Equipment &amp; Facilities
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Run */}
      <DropdownMenu>
        <MenuButton label="Run" />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => simulateCurrentStep()}>
            Simulate Current Step
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast('Scale-Up — coming soon')}>
            Scale-Up…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Results */}
      <DropdownMenu>
        <MenuButton label="Results" />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => toast('Gantt — available after simulation (Phase 14)')}>
            Show/Hide Gantt
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast('Stream Table — available after simulation (Phase 14)')}>
            Stream Table
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast('Material Balance — available after simulation (Phase 14)')}>
            Material Balance
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Help */}
      <DropdownMenu>
        <MenuButton label="Help" />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
            About OpenBatch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".bpd,application/json"
        className="hidden"
        onChange={onFilePicked}
      />

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OpenBatch 1.0</DialogTitle>
            <DialogDescription>
              A web-based clone of Aspen Batch Process Developer (ABPD) — recipe-oriented
              batch-process modeling &amp; simulation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAboutOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
