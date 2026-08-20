import { Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function Spinner({ className }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin text-ink-faint', className)} aria-hidden />
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-line/70', className)} aria-hidden />
}

export function TableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className="divide-y divide-line" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn('h-4', columnIndex === 0 ? 'flex-[3]' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-paper text-ink-faint ring-1 ring-line">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      )}
      <h3 className="font-sans text-base font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Errors say what happened and offer the one action that fixes it. */
export function ErrorState({ error, onRetry, className, compact = false }) {
  const message = error?.message ?? 'Something went wrong.'
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-flag/20 bg-flag-soft/60 px-4 py-3.5',
        compact ? '' : 'sm:px-5 sm:py-4',
        className,
      )}
      role="alert"
    >
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-flag" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{message}</p>
        {error?.code && (
          <p className="mt-0.5 font-mono text-3xs uppercase tracking-[0.08em] text-ink-faint">
            {error.code}
            {error.status ? ` - ${error.status}` : ''}
          </p>
        )}
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
