import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('collapses conflicting Tailwind classes (last wins)', () => {
    const cond = true
    expect(cn('p-2', cond && 'p-4')).toBe('p-4')
  })

  it('drops falsy conditional classes', () => {
    const cond = false
    expect(cn('p-2', cond && 'p-4')).toBe('p-2')
  })

  it('merges unrelated classes', () => {
    expect(cn('bg-primary', 'text-panel')).toBe('bg-primary text-panel')
  })
})
