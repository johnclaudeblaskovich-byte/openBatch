import type { Project, Step } from '@/types'

export type ScaleUpMode =
  | 'MaxBatchCurrentEquipment'
  | 'MaxBatchSpecificEquipment'
  | 'TargetBatchSize'
  | 'MultipleOfCurrent'
  | 'ReturnToOriginal'

export interface ScaleUpParams {
  targetMassKg?: number
  multiplier?: number
  equipmentId?: string
  currentScaleFactor?: number
}

async function post(path: string, body: unknown) {
  const resp = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error(`scaleup ${path} failed (${resp.status})`)
  return resp.json()
}

/** Preview the computed scale factor + predicted output without mutating the project. */
export async function previewScaleUp(
  project: Project,
  stepId: string,
  mode: ScaleUpMode,
  params: ScaleUpParams,
): Promise<{ factor: number; predictedOutputKg: number }> {
  return post('/scaleup/preview', { project, stepId, mode, params })
}

/** Apply the scale factor and return the scaled Step JSON + factor. */
export async function applyScaleUp(
  project: Project,
  stepId: string,
  mode: ScaleUpMode,
  params: ScaleUpParams,
): Promise<{ factor: number; scaledStep: Step }> {
  return post('/scaleup/apply', { project, stepId, mode, params })
}
