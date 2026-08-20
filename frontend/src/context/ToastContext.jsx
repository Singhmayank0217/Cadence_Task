import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/cn'

const ToastContext = createContext(null)

const TONES = {
  success: { icon: CheckCircle2, accent: 'text-accent', ring: 'ring-accent/20' },
  error: { icon: TriangleAlert, accent: 'text-flag', ring: 'ring-flag/20' },
  info: { icon: Info, accent: 'text-ink-muted', ring: 'ring-ink/10' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message, { tone = 'success', description, duration = 4000 } = {}) => {
      const id = crypto.randomUUID?.() ?? String(Date.now() + Math.random())
      setToasts((current) => [...current, { id, message, tone, description }])
      if (duration) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      notify,
      success: (message, options) => notify(message, { ...options, tone: 'success' }),
      error: (message, options) => notify(message, { ...options, tone: 'error' }),
      info: (message, options) => notify(message, { ...options, tone: 'info' }),
      dismiss,
    }),
    [notify, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] ?? TONES.info
          const Icon = tone.icon
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex animate-slide-in items-start gap-3 rounded-lg bg-ink px-4 py-3 text-sm text-white shadow-pop ring-1',
                tone.ring,
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone.accent)} />
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{toast.message}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs leading-snug text-white/60">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded p-0.5 text-white/50 transition hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
