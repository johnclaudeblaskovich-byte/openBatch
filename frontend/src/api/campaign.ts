import type { Project } from '@/types'

export interface CampaignHandlers {
  onProgress?: (done: number, total: number, label: string) => void
  onComplete?: (result: unknown) => void
  onError?: (message: string) => void
}

/** Kick off a backend campaign simulation for a plan, streaming progress + result over WS. */
export async function runCampaign(
  project: Project,
  planId: string,
  handlers: CampaignHandlers,
): Promise<() => void> {
  const resp = await fetch('/api/simulate-campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, planId }),
  })
  if (!resp.ok) {
    handlers.onError?.(`campaign request failed (${resp.status})`)
    return () => {}
  }
  const { job_id: jobId } = (await resp.json()) as { job_id: string }

  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${window.location.host}/ws/solve/${jobId}`)

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string)
    switch (msg.type) {
      case 'progress':
        handlers.onProgress?.(msg.done, msg.total, msg.opId ?? '')
        break
      case 'complete':
        handlers.onComplete?.(msg.result)
        ws.close()
        break
      case 'error':
        handlers.onError?.(msg.message ?? 'campaign error')
        ws.close()
        break
      default:
        break
    }
  }
  ws.onerror = () => handlers.onError?.('websocket error')
  return () => ws.close()
}
