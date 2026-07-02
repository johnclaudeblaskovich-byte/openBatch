import { describe, it, expect } from 'vitest'
import { makeTicks, makeTimeScale, pickTickStep } from './ganttScale'

describe('ganttScale', () => {
  it('maps minutes to pixels linearly across the domain', () => {
    const scale = makeTimeScale(100, 400)
    expect(scale.toPx(0)).toBe(0)
    expect(scale.toPx(50)).toBe(200)
    expect(scale.toPx(100)).toBe(400)
  })

  it('guards a zero/negative domain (no divide-by-zero)', () => {
    const scale = makeTimeScale(0, 400)
    expect(Number.isFinite(scale.toPx(0))).toBe(true)
    expect(scale.domainMax).toBe(1)
  })

  it('picks a tick step giving roughly 4–12 ticks', () => {
    expect(pickTickStep(80)).toBe(10) // 80/8 = 10
    expect(pickTickStep(240)).toBe(30) // 240/8 = 30
    const ticks = makeTicks(80)
    expect(ticks[0]).toBe(0)
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(80)
    expect(ticks.length).toBeGreaterThanOrEqual(4)
    expect(ticks.length).toBeLessThanOrEqual(13)
  })
})
