/**
 * .bpd persistence — the canonical save/load path.
 *
 * A .bpd file is a single JSON object shaped:
 *   { fileVersion, appVersion, createdAt, project }
 * Do NOT change this wrapper shape or the schema.
 */
import type { Project } from '@/types'
import { useStore } from '@/store'

export const BPD_FILE_VERSION = '1.0.0'
export const BPD_APP_VERSION = 'OpenBatch 1.0'

export interface BpdFile {
  fileVersion: string
  appVersion: string
  createdAt: string
  project: Project
}

/** Thrown when a .bpd payload has a bad wrapper or an unsupported fileVersion. */
export class BpdParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BpdParseError'
  }
}

/** Wrap a project in the .bpd envelope (fresh createdAt timestamp). */
export function serializeProject(project: Project): BpdFile {
  return {
    fileVersion: BPD_FILE_VERSION,
    appVersion: BPD_APP_VERSION,
    createdAt: new Date().toISOString(),
    project,
  }
}

function sanitizeFilename(name: string): string {
  const base = (name || 'project').trim().replace(/[\\/:*?"<>|]+/g, '_')
  return base.length ? base : 'project'
}

/** Serialize + trigger a browser download of `{projectName}.bpd`. */
export function downloadBpd(project: Project, filename?: string): void {
  const file = serializeProject(project)
  const text = JSON.stringify(file, null, 2)
  const name = filename ?? `${sanitizeFilename(project.name)}.bpd`
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

/**
 * Parse .bpd text, validating the wrapper shape and fileVersion.
 * Throws BpdParseError on any mismatch; never partially applies.
 */
export function parseBpd(text: string): { project: Project } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BpdParseError('File is not valid JSON.')
  }
  if (!isRecord(raw)) {
    throw new BpdParseError('Not a .bpd file: expected a JSON object.')
  }
  const { fileVersion, project } = raw as Record<string, unknown>
  if (typeof fileVersion !== 'string') {
    throw new BpdParseError('Not a .bpd file: missing "fileVersion".')
  }
  if (fileVersion !== BPD_FILE_VERSION) {
    throw new BpdParseError(
      `Unsupported .bpd fileVersion "${fileVersion}" (expected "${BPD_FILE_VERSION}").`,
    )
  }
  if (!isRecord(project)) {
    throw new BpdParseError('Not a .bpd file: missing "project" object.')
  }
  // Minimal structural sanity so we don't hydrate a garbage store.
  const p = project as Record<string, unknown>
  const requiredArrays = ['facilities', 'materials', 'reactions', 'processes', 'productionPlans']
  for (const key of requiredArrays) {
    if (!Array.isArray(p[key])) {
      throw new BpdParseError(`Malformed project: "${key}" must be an array.`)
    }
  }
  if (typeof p.id !== 'string' || typeof p.name !== 'string') {
    throw new BpdParseError('Malformed project: missing id/name.')
  }
  return { project: project as unknown as Project }
}

/**
 * Read a File, parse it, and hydrate the store (projectSlice + plans, which live on the Project).
 * Rejects (without mutating the store) if the file is malformed.
 */
export async function loadBpdIntoStore(file: File): Promise<Project> {
  const text = await file.text()
  const { project } = parseBpd(text)
  useStore.getState().loadProject(project)
  return project
}
