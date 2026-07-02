import type { CampaignResult, ProductionPlan, ProductionPlanEntry } from '@/types'
import type { SliceCreator } from './types'
import { genId } from './types'

export interface PlanSlice {
  /** Campaign results keyed by plan id (read-only, written by the campaign hook). */
  campaignResultByPlan: Record<string, CampaignResult>

  /** Selector: production plans live on the Project; returns [] when no project is loaded. */
  getPlans: () => ProductionPlan[]

  upsertPlan: (plan: ProductionPlan) => void
  addPlan: (name: string, earliestStartMin?: number) => string
  renamePlan: (planId: string, name: string) => void
  deletePlan: (planId: string) => void

  addEntry: (planId: string, entry: ProductionPlanEntry) => void
  updateEntry: (planId: string, entryId: string, patch: Partial<ProductionPlanEntry>) => void
  removeEntry: (planId: string, entryId: string) => void
  reorderEntries: (planId: string, from: number, to: number) => void

  setCampaignResult: (planId: string, result: CampaignResult) => void
}

export const createPlanSlice: SliceCreator<PlanSlice> = (set, get) => ({
  campaignResultByPlan: {},

  getPlans: () => get().project?.productionPlans ?? [],

  upsertPlan: (plan) =>
    set((state) => {
      if (!state.project) return
      const idx = state.project.productionPlans.findIndex((p) => p.id === plan.id)
      if (idx === -1) state.project.productionPlans.push(plan)
      else state.project.productionPlans[idx] = plan
    }),

  addPlan: (name, earliestStartMin) => {
    const id = genId('plan')
    set((state) => {
      if (!state.project) return
      state.project.productionPlans.push({
        id,
        name,
        description: '',
        earliestStartMin,
        entries: [],
      })
    })
    return id
  },

  renamePlan: (planId, name) =>
    set((state) => {
      const plan = state.project?.productionPlans.find((p) => p.id === planId)
      if (plan) plan.name = name
    }),

  deletePlan: (planId) =>
    set((state) => {
      if (!state.project) return
      const idx = state.project.productionPlans.findIndex((p) => p.id === planId)
      if (idx !== -1) state.project.productionPlans.splice(idx, 1)
      delete state.campaignResultByPlan[planId]
    }),

  addEntry: (planId, entry) =>
    set((state) => {
      const plan = state.project?.productionPlans.find((p) => p.id === planId)
      if (plan) plan.entries.push(entry)
    }),

  updateEntry: (planId, entryId, patch) =>
    set((state) => {
      const plan = state.project?.productionPlans.find((p) => p.id === planId)
      const entry = plan?.entries.find((e) => e.id === entryId)
      if (entry) Object.assign(entry, patch)
    }),

  removeEntry: (planId, entryId) =>
    set((state) => {
      const plan = state.project?.productionPlans.find((p) => p.id === planId)
      if (!plan) return
      const idx = plan.entries.findIndex((e) => e.id === entryId)
      if (idx !== -1) plan.entries.splice(idx, 1)
    }),

  reorderEntries: (planId, from, to) =>
    set((state) => {
      const plan = state.project?.productionPlans.find((p) => p.id === planId)
      if (!plan) return
      const entries = plan.entries
      if (from < 0 || from >= entries.length || to < 0 || to >= entries.length) return
      const [moved] = entries.splice(from, 1)
      entries.splice(to, 0, moved)
    }),

  setCampaignResult: (planId, result) =>
    set((state) => {
      state.campaignResultByPlan[planId] = result
    }),
})
