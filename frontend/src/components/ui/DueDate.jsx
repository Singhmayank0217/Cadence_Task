import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { describeDueDate, formatDate } from '@/lib/date'

/**
 * Due dates carry urgency, so the label changes with the date rather than
 * relying on colour alone: "2 days late", "Due today", or a plain date.
 */
export function DueDate({ value, status, className, withIcon = false, showDate = false }) {
  const done = status === 'completed'
  const { label, tone } = describeDueDate(value)

  if (!value) {
    return <span className={cn('font-mono text-xs text-ink-faint', className)}>--</span>
  }

  const tones = {
    late: done ? 'text-ink-faint' : 'text-flag font-medium',
    soon: done ? 'text-ink-faint' : 'text-ochre font-medium',
    normal: 'text-ink-muted',
    none: 'text-ink-faint',
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-xs', tones[tone], className)}>
      {withIcon && <CalendarClock className="h-3.5 w-3.5" aria-hidden />}
      {done ? formatDate(value) : label}
      {showDate && !done && tone !== 'normal' && (
        <span className="text-ink-faint">({formatDate(value)})</span>
      )}
    </span>
  )
}
