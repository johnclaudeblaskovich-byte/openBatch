import type { Project, StepSimulationResult } from '@/types'

export interface SimulationHandlers {
  onProgress?: (done: number, total: number, opId: string) => void
  onComplete?: (result: StepSimulationResult) => void
  onError?: (message: string) => void
}

/**
 * Kick off a backend simulation: POST the project+step, then stream progress/result over a
 * WebSocket. Returns a function that cancels (closes the socket) when called.
 */
export async function runSimulation(
  project: Project,
  stepId: string,
  handlers: SimulationHandlers,
): Promise<() => void> {
  const resp = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, stepId }),
  })
  if (!resp.ok) {
    handlers.onError?.(`simulate request failed (${resp.status})`)
    return () => {}
  }
  const { job_id: jobId } = (await resp.json()) as { job_id: string }

  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${proto}://${window.location.host}/ws/solve/${jobId}`

  let ws: WebSocket
  let settled = false // set once complete/error arrives — stop reconnecting
  let cancelled = false
  let attempt = 0
  const MAX_ATTEMPTS = 3

  const connect = () => {
    ws = new WebSocket(url)

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string)
      switch (msg.type) {
        case 'progress':
          handlers.onProgress?.(msg.done, msg.total, msg.opId)
          break
        case 'complete':
          settled = true
          handlers.onComplete?.(msg.result as StepSimulationResult)
          ws.close()
          break
        case 'error':
          settled = true
          handlers.onError?.(msg.message ?? 'simulation error')
          ws.close()
          break
        default:
          break
      }
    }

    // A socket that closes before the job settles = a dropped connection: reconnect with backoff.
    ws.onclose = () => {
      if (settled || cancelled) return
      if (attempt >= MAX_ATTEMPTS) {
        handlers.onError?.('lost connection to the simulation server')
        return
      }
      attempt += 1
      const backoffMs = 250 * 2 ** (attempt - 1) // 250ms, 500ms, 1000ms
      setTimeout(() => {
        if (!settled && !cancelled) connect()
      }, backoffMs)
    }
  }

  connect()

  return () => {
    cancelled = true
    ws.close()
  }
}
