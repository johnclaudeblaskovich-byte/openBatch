import MenuBar from '@/components/shell/MenuBar'
import ExplorerPanel from '@/components/shell/ExplorerPanel'
import MainEditor from '@/components/shell/MainEditor'
import { ResultsPanel } from '@/components/results'
import StatusBar from '@/components/shell/StatusBar'
import { useStore } from '@/store'

/**
 * Desktop-app chrome: menu bar on top, a fixed 280px explorer on the left, a tabbed main editor
 * with a collapsible results panel below it, and a status bar at the bottom. Uses named CSS-grid
 * areas so the menu bar and status bar stay full-width and the explorer stays at 280px.
 */
export default function AppShell() {
  const hasResults = useStore((s) => Object.keys(s.resultsByStepId).length > 0)

  return (
    <div
      className="h-screen w-screen bg-background text-text-primary"
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gridTemplateRows: '36px 1fr 28px',
        gridTemplateAreas:
          '"menubar menubar" "explorer main" "statusbar statusbar"',
      }}
    >
      <div style={{ gridArea: 'menubar' }}>
        <MenuBar />
      </div>

      <div
        style={{ gridArea: 'explorer' }}
        className="w-[280px] overflow-hidden border-r border-border"
      >
        <ExplorerPanel />
      </div>

      <div style={{ gridArea: 'main' }} className="flex min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden">
          <MainEditor />
        </div>
        <div className={hasResults ? 'h-[40%] min-h-0' : 'shrink-0'}>
          <ResultsPanel />
        </div>
      </div>

      <div style={{ gridArea: 'statusbar' }}>
        <StatusBar />
      </div>
    </div>
  )
}
