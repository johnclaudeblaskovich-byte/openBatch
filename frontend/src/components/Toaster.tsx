import { useToasts } from '@/lib/toast'

/** Renders active toasts in the bottom-right corner. */
export default function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto max-w-sm rounded-md border border-border bg-panel px-4 py-2 text-left text-sm text-text-primary shadow-lg"
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
