import { cn } from '@/lib/cn'
import { priorityMeta, statusMeta } from '@/lib/constants'

export function Badge({ children, className, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-ink/[0.05] text-ink-muted ring-ink/10',
    accent: 'bg-accent-soft text-accent ring-accent/25',
    ochre: 'bg-ochre-soft text-ochre ring-ochre/25',
    moss: 'bg-moss-soft text-moss ring-moss/25',
    flag: 'bg-flag-soft text-flag ring-flag/20',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Status is the most-scanned field in the table, so it gets a dot + label. */
export function StatusBadge({ status, className, size = 'md' }) {
  const meta = statusMeta(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        meta.chip,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
}

/**
 * Priority reads as a rank, so it is drawn as filled ticks rather than another
 * coloured pill - two pills side by side would be hard to scan.
 */
export function PriorityBadge({ priority, className, showLabel = true }) {
  const meta = priorityMeta(priority)
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} title={`${meta.label} priority`}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              'w-[3px] rounded-sm transition-colors',
              step === 1 && 'h-[6px]',
              step === 2 && 'h-[9px]',
              step === 3 && 'h-[12px]',
              step === 4 && 'h-[15px]',
              step <= meta.rank ? meta.tick : 'bg-line-strong',
            )}
          />
        ))}
      </span>
      {showLabel && <span className={cn('text-xs font-medium', meta.text)}>{meta.label}</span>}
    </span>
  )
}
