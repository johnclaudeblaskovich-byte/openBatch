/** Linear time scale (minutes → px) and tick-step selection for the Gantt chart. */

export interface TimeScale {
  domainMax: number
  pixelWidth: number
  toPx: (minutes: number) => number
}

export function makeTimeScale(domainMax: number, pixelWidth: number): TimeScale {
  const max = domainMax > 0 ? domainMax : 1
  return {
    domainMax: max,
    pixelWidth,
    toPx: (minutes: number) => (minutes / max) * pixelWidth,
  }
}

/** Pick a sensible tick step (5/10/15/30/60/… min) so the axis shows ~4–12 ticks. */
export function pickTickStep(domainMax: number): number {
  const steps = [5, 10, 15, 30, 60, 120, 240, 480, 720, 1440]
  const target = domainMax / 8
  for (const s of steps) {
    if (s >= target) return s
  }
  return steps[steps.length - 1]
}

/** Generate tick values from 0 to domainMax (inclusive) at the chosen step. */
export function makeTicks(domainMax: number): number[] {
  const step = pickTickStep(domainMax)
  const ticks: number[] = []
  for (let t = 0; t <= domainMax + 1e-6; t += step) ticks.push(Math.round(t))
  return ticks
}
