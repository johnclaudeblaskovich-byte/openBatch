import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  dismiss: (id: string) => void
  push: (message: string) => void
}

/** Minimal toast store — a hand-rolled alternative to a toast dependency. */
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  push: (message) => {
    const id = `toast_${Math.random().toString(36).slice(2, 8)}`
    set((s) => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
}))

/** Imperative helper usable from anywhere (menu handlers, etc.). */
export function toast(message: string): void {
  useToasts.getState().push(message)
}
