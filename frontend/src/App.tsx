import { useEffect } from 'react'
import { TooltipProvider } from '@/components/ui'
import AppShell from '@/views/AppShell'
import Toaster from '@/components/Toaster'
import OperationDialog from '@/components/dialogs/OperationDialog'
import { useStore } from '@/store'
import { ASPIRIN_SAMPLE } from '@/store'

export default function App() {
  const hasProject = useStore((s) => s.project !== null)
  const loadProject = useStore((s) => s.loadProject)

  useEffect(() => {
    if (!hasProject) loadProject(ASPIRIN_SAMPLE)
  }, [hasProject, loadProject])

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell />
      <OperationDialog />
      <Toaster />
    </TooltipProvider>
  )
}
