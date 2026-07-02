import type {
  AnyOperation,
  EquipmentUnit,
  Facility,
  Material,
  Project,
  ReactionDataSet,
  Step,
  Utility,
} from '@/types'
import type { SliceCreator } from './types'
import { genId } from './types'
import { ASPIRIN_SAMPLE } from './sampleProject'

export interface ProjectSlice {
  project: Project | null

  loadProject: (project: Project) => void
  newProject: () => void
  updateProjectMeta: (patch: Partial<Project>) => void

  addProcess: () => void
  addStep: (processId: string) => void
  addUnitProcedure: (stepId: string) => void
  deleteUnitProcedure: (unitProcedureId: string) => void
  addOperation: (unitProcedureId: string, op: AnyOperation) => void
  updateOperation: (opId: string, patch: Partial<AnyOperation>) => void
  deleteOperation: (opId: string) => void
  reorderOperation: (unitProcedureId: string, from: number, to: number) => void

  /** Replace a step's unit procedures (e.g. with scaled operations) and record the cumulative factor. */
  replaceStepOperations: (stepId: string, scaledStep: Step, appliedFactor: number) => void
  /** Reassign every reference to oldEquipId → newEquipId within a step (UP primary + op fields). */
  replaceEquipmentInStep: (stepId: string, oldEquipId: string, newEquipId: string) => void

  upsertMaterial: (material: Material) => void
  upsertReactionSet: (set: ReactionDataSet) => void
  upsertFacility: (facility: Facility) => void
  upsertEquipment: (facilityId: string, equipment: EquipmentUnit) => void
  deleteEquipment: (facilityId: string, equipmentId: string) => void
  upsertUtility: (utility: Utility) => void
  deleteUtility: (utilityId: string) => void
}

export const createProjectSlice: SliceCreator<ProjectSlice> = (set) => ({
  project: null,

  loadProject: (project) =>
    set((state) => {
      state.project = structuredClone(project)
    }),

  // Seed new projects from the sample so the UI always has data to render.
  newProject: () =>
    set((state) => {
      state.project = structuredClone(ASPIRIN_SAMPLE)
    }),

  updateProjectMeta: (patch) =>
    set((state) => {
      if (!state.project) return
      Object.assign(state.project, patch)
      state.project.modifiedAt = new Date().toISOString()
    }),

  addProcess: () =>
    set((state) => {
      if (!state.project) return
      state.project.processes.push({
        id: genId('proc'),
        name: `Process ${state.project.processes.length + 1}`,
        description: '',
        keyProduct: '',
        steps: [],
      })
    }),

  addStep: (processId) =>
    set((state) => {
      const proc = state.project?.processes.find((p) => p.id === processId)
      if (!proc || !state.project) return
      proc.steps.push({
        id: genId('step'),
        name: `Step ${proc.steps.length + 1}`,
        description: '',
        facilityId: state.project.facilities[0]?.id ?? '',
        uom: { ...state.project.uom },
        unitProcedures: [],
      })
    }),

  addUnitProcedure: (stepId) =>
    set((state) => {
      if (!state.project) return
      for (const proc of state.project.processes) {
        const step = proc.steps.find((s) => s.id === stepId)
        if (step) {
          step.unitProcedures.push({
            id: genId('up'),
            name: `Unit Procedure ${step.unitProcedures.length + 1}`,
            primaryEquipmentId: '',
            operations: [],
          })
          return
        }
      }
    }),

  deleteUnitProcedure: (unitProcedureId) =>
    set((state) => {
      if (!state.project) return
      for (const proc of state.project.processes) {
        for (const step of proc.steps) {
          const idx = step.unitProcedures.findIndex((u) => u.id === unitProcedureId)
          if (idx !== -1) {
            step.unitProcedures.splice(idx, 1)
            return
          }
        }
      }
    }),

  addOperation: (unitProcedureId, op) =>
    set((state) => {
      if (!state.project) return
      for (const proc of state.project.processes) {
        for (const step of proc.steps) {
          const up = step.unitProcedures.find((u) => u.id === unitProcedureId)
          if (up) {
            up.operations.push(op)
            return
          }
        }
      }
    }),

  updateOperation: (opId, patch) =>
    set((state) => {
      if (!state.project) return
      for (const proc of state.project.processes) {
        for (const step of proc.steps) {
          for (const up of step.unitProcedures) {
            const op = up.operations.find((o) => o.id === opId)
            if (op) {
              Object.assign(op, patch)
              return
            }
          }
        }
      }
    }),

  deleteOperation: (opId) =>
    set((state) => {
      if (!state.project) return
      for (const proc of state.project.processes) {
        for (const step of proc.steps) {
          for (const up of step.unitProcedures) {
            const idx = up.operations.findIndex((o) => o.id === opId)
            if (idx !== -1) {
              up.operations.splice(idx, 1)
              return
            }
          }
        }
      }
    }),

  reorderOperation: (unitProcedureId, from, to) =>
    set((state) => {
      if (!state.project) return
      for (const proc of state.project.processes) {
        for (const step of proc.steps) {
          const up = step.unitProcedures.find((u) => u.id === unitProcedureId)
          if (!up) continue
          const ops = up.operations
          if (from < 0 || from >= ops.length || to < 0 || to >= ops.length) return
          const [moved] = ops.splice(from, 1)
          ops.splice(to, 0, moved)
          return
        }
      }
    }),

  replaceStepOperations: (stepId, scaledStep, appliedFactor) =>
    set((state) => {
      if (!state.project) return
      for (const proc of state.project.processes) {
        const step = proc.steps.find((s) => s.id === stepId)
        if (step) {
          step.unitProcedures = scaledStep.unitProcedures
          step.currentScaleFactor = (step.currentScaleFactor ?? 1) * appliedFactor
          return
        }
      }
    }),

  replaceEquipmentInStep: (stepId, oldEquipId, newEquipId) =>
    set((state) => {
      if (!state.project) return
      for (const proc of state.project.processes) {
        const step = proc.steps.find((s) => s.id === stepId)
        if (!step) continue
        for (const up of step.unitProcedures) {
          if (up.primaryEquipmentId === oldEquipId) up.primaryEquipmentId = newEquipId
          for (const op of up.operations) {
            const rec = op as unknown as Record<string, unknown>
            for (const key of Object.keys(rec)) {
              const lower = key.toLowerCase()
              if ((key === 'equipmentId' || lower.endsWith('equipmentid')) && rec[key] === oldEquipId) {
                rec[key] = newEquipId
              }
            }
          }
        }
        return
      }
    }),

  upsertMaterial: (material) =>
    set((state) => {
      if (!state.project) return
      const idx = state.project.materials.findIndex((m) => m.id === material.id)
      if (idx === -1) state.project.materials.push(material)
      else state.project.materials[idx] = material
    }),

  upsertReactionSet: (rxnSet) =>
    set((state) => {
      if (!state.project) return
      const idx = state.project.reactions.findIndex((r) => r.id === rxnSet.id)
      if (idx === -1) state.project.reactions.push(rxnSet)
      else state.project.reactions[idx] = rxnSet
    }),

  upsertFacility: (facility) =>
    set((state) => {
      if (!state.project) return
      const idx = state.project.facilities.findIndex((f) => f.id === facility.id)
      if (idx === -1) state.project.facilities.push(facility)
      else state.project.facilities[idx] = facility
    }),

  upsertEquipment: (facilityId, equipment) =>
    set((state) => {
      const facility = state.project?.facilities.find((f) => f.id === facilityId)
      if (!facility) return
      const idx = facility.equipmentUnits.findIndex((e) => e.id === equipment.id)
      if (idx === -1) facility.equipmentUnits.push(equipment)
      else facility.equipmentUnits[idx] = equipment
    }),

  deleteEquipment: (facilityId, equipmentId) =>
    set((state) => {
      const facility = state.project?.facilities.find((f) => f.id === facilityId)
      if (!facility) return
      const idx = facility.equipmentUnits.findIndex((e) => e.id === equipmentId)
      if (idx !== -1) facility.equipmentUnits.splice(idx, 1)
    }),

  upsertUtility: (utility) =>
    set((state) => {
      if (!state.project) return
      const idx = state.project.utilities.findIndex((u) => u.id === utility.id)
      if (idx === -1) state.project.utilities.push(utility)
      else state.project.utilities[idx] = utility
    }),

  deleteUtility: (utilityId) =>
    set((state) => {
      if (!state.project) return
      const idx = state.project.utilities.findIndex((u) => u.id === utilityId)
      if (idx !== -1) state.project.utilities.splice(idx, 1)
    }),
})
