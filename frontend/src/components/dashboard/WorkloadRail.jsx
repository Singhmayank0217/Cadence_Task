import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { TASK_STATUS } from '@/lib/constants'

const ORDER = ['in_progress', 'pending', 'blocked', 'completed']

/**
 * The signature element: the whole team's work as one continuous rail.
 * Width is share of total, so the mix is readable in a single glance - and
 * each segment is a link into the matching filtered list.
 */
export function WorkloadRail({ breakdown, total, className, showLegend = true, height = 'h-3' }) {
  const segments = ORDER.map((key) => ({
    key,
    meta: TASK_STATUS[key],
    count: breakdown?.[key] ?? 0,
  })).filter((segment) => segment.count > 0)

  if (!total) {
    return (
      <div className={cn('rounded-full bg-line/70', height, className)} aria-hidden />
    )
  }

  return (
    <div className={className}>
      <div
        className={cn('flex w-full overflow-hidden rounded-full bg-line/60', height)}
        role="img"
        aria-label={segments.map((s) => `${s.meta.label}: ${s.count}`).join(', ')}
      >
        {segments.map((segment) => (
          <Link
            key={segment.key}
            to={`/tasks?status=${segment.key}`}
            title={`${segment.meta.label}: ${segment.count}`}
            style={{ flexGrow: segment.count }}
            className={cn(
              'rail-segment animate-grow hover:opacity-85',
              segment.meta.bar,
              'border-r border-surface last:border-r-0',
            )}
          />
        ))}
      </div>

      {showLegend && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {ORDER.map((key) => {
            const meta = TASK_STATUS[key]
            const count = breakdown?.[key] ?? 0
            const share = total ? Math.round((count / total) * 100) : 0
            return (
              <li key={key}>
                <Link
                  to={`/tasks?status=${key}`}
                  className="group flex items-center gap-2 text-xs text-ink-muted transition hover:text-ink"
                >
                  <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden />
                  <span>{meta.label}</span>
                  <span className="font-mono text-ink">{count}</span>
                  <span className="font-mono text-ink-faint">{share}%</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
