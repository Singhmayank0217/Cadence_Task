import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'

const WIDTHS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

/**
 * Accessible dialog: closes on Escape and backdrop click, locks body scroll,
 * moves focus inside on open and keeps Tab within the dialog.
 */
export function Modal({ open, onClose, title, description, size = 'md', footer, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previouslyFocused = document.activeElement

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const timer = setTimeout(() => {
      const target = panelRef.current?.querySelector('[data-autofocus]') ?? panelRef.current
      target?.focus?.()
    }, 40)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      clearTimeout(timer)
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6">
      <div
        className="fixed inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex w-full animate-slide-up flex-col rounded-t-2xl bg-surface shadow-modal sm:rounded-lg',
          'max-h-[92vh] sm:max-h-[85vh]',
          WIDTHS[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-sans text-lg font-semibold leading-tight text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line bg-raised px-5 py-3.5 sm:rounded-b-2xl">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
