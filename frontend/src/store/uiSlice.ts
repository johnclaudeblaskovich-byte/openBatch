import type { SliceCreator } from './types'

export type SelectedNodeType =
  | 'process'
  | 'step'
  | 'unitProcedure'
  | 'operation'
  | 'plan'
  | null

export type EditorTab = 'recipe' | 'equipment' | 'materials' | 'reactions' | 'plan'

export type ResultsTab = 'gantt' | 'streams' | 'balance' | 'contents' | 'warnings'

export interface ActiveDialog {
  kind: string
  opId: string
}

export interface UiSlice {
  selectedNodeId: string | null
  selectedNodeType: SelectedNodeType
  activeEditorTab: EditorTab
  activeResultsTab: ResultsTab
  activeDialog: ActiveDialog | null

  select: (id: string, type: SelectedNodeType) => void
  setEditorTab: (tab: EditorTab) => void
  setActiveResultsTab: (tab: ResultsTab) => void
  openDialog: (kind: string, opId: string) => void
  closeDialog: () => void
}

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  selectedNodeId: null,
  selectedNodeType: null,
  activeEditorTab: 'recipe',
  activeResultsTab: 'gantt',
  activeDialog: null,

  select: (id, type) =>
    set((state) => {
      state.selectedNodeId = id
      state.selectedNodeType = type
    }),

  setEditorTab: (tab) =>
    set((state) => {
      state.activeEditorTab = tab
    }),

  setActiveResultsTab: (tab) =>
    set((state) => {
      state.activeResultsTab = tab
    }),

  openDialog: (kind, opId) =>
    set((state) => {
      state.activeDialog = { kind, opId }
    }),

  closeDialog: () =>
    set((state) => {
      state.activeDialog = null
    }),
})
