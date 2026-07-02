import { Tabs, TabsList, TabsTrigger } from '@/components/ui'
import { useStore } from '@/store'
import type { EditorTab } from '@/store'
import RecipeView from '@/views/RecipeView'
import MaterialsView from '@/views/MaterialsView'
import ReactionsView from '@/views/ReactionsView'
import EquipmentView from '@/views/EquipmentView'
import ProductionPlanEditor from '@/components/plan/ProductionPlanEditor'

/**
 * Central tabbed editor. The tab header is bound to uiSlice.activeEditorTab; the body renders the
 * matching view. The Plan tab is shown only when a production plan is selected.
 */
export default function MainEditor() {
  const activeEditorTab = useStore((s) => s.activeEditorTab)
  const setEditorTab = useStore((s) => s.setEditorTab)
  const planSelected = useStore((s) => s.selectedNodeType === 'plan')
  const hasProject = useStore((s) => s.project !== null)

  if (!hasProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 bg-panel text-center">
        <p className="text-sm font-medium text-text-secondary">No project loaded</p>
        <p className="text-xs text-muted">Use File → New Project or Open (.bpd) to begin.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-panel">
      <Tabs
        value={activeEditorTab}
        onValueChange={(v) => setEditorTab(v as EditorTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="px-2">
          <TabsTrigger value="recipe">Recipe</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="reactions">Reactions</TabsTrigger>
          {planSelected && <TabsTrigger value="plan">Plan</TabsTrigger>}
        </TabsList>

        <div className="min-h-0 flex-1 overflow-auto">
          {activeEditorTab === 'recipe' && <RecipeView />}
          {activeEditorTab === 'equipment' && <EquipmentView />}
          {activeEditorTab === 'materials' && <MaterialsView />}
          {activeEditorTab === 'reactions' && <ReactionsView />}
          {activeEditorTab === 'plan' && <ProductionPlanEditor />}
        </div>
      </Tabs>
    </div>
  )
}
