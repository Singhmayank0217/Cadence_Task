import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { priorityMeta } from '@/lib/constants'

/**
 * The cadence strip: a fortnight of due dates read as a ruled score.
 *
 * Each day is a column and each open task is one tick, stacked from the
 * baseline and coloured by priority - so the shape of the fortnight (where the
 * crunch is, and how heavy it is) is legible without reading a single number.
 * Overdue work sits in a gutter to the left of the staff, because it is not on
 * the schedule any more. Every column links into the task list filtered to
 * that day.
 */

const MAX_TICKS = 8
const ORDER = ['urgent', 'high', 'medium', 'low']
const TICK = 'h-[6px] rounded-[1px]'
const ROW = 9  // tick height + gap, in px


/** The list URL for a single day: everything still open, due that day. */
function dayHref(day) {
  const start = `${day}T00:00:00`
  const end = `${day}T23:59:59`
  return `/tasks?status=pending,in_progress,blocked&due_after=${start}&due_before=${end}&sort=priority:desc`
}

export function CadenceStrip({ buckets = [], overdue = 0 }) {
  const columns = buckets.map((bucket, index) => {
    const day = bucket.date?.slice(0, 10)
    const date = new Date(`${day}T12:00:00`)

    // Expand the per-day priority counts into one tick each, heaviest first,
    // so a day's colour reads as its worst work rather than its average.
    const ticks = []
    ORDER.forEach((priority) => {
      const count = bucket.priorities?.[priority] ?? 0
      for (let i = 0; i < count; i += 1) ticks.push(priorityMeta(priority).tick)
    })
    if (!ticks.length && bucket.count) {
      for (let i = 0; i < bucket.count; i += 1) ticks.push('bg-line-strong')
    }

    return {
      day,
      date,
      count: bucket.count ?? 0,
      weekend: [0, 6].includes(date.getDay()),
      isToday: index === 0,
      overflow: Math.max(0, ticks.length - MAX_TICKS),
      ticks: ticks.slice(0, MAX_TICKS),
    }
  })

  const busiest = Math.max(1, ...columns.map((column) => column.count))
  // The staff is only as tall as the busiest day needs, with a floor so a quiet
  // fortnight still reads as a chart rather than a row of dashes.
  const rows = Math.min(Math.max(busiest, 4), MAX_TICKS)

  return (
    <div className="px-4 pb-3 pt-4">
      <div className="flex items-stretch gap-3">
        {/* Overdue gutter - work that has fallen off the schedule. */}
        <Link
          to="/tasks?overdue=true&sort=due_date:asc"
          className={cn(
            'group flex w-[74px] shrink-0 flex-col justify-end rounded-md border px-2.5 pb-2 pt-2.5 transition-colors',
            overdue > 0
              ? 'border-flag/25 bg-flag-soft/70 hover:border-flag/45'
              : 'border-line bg-raised',
          )}
          title={`${overdue} task${overdue === 1 ? '' : 's'} past due`}
        >
          <span
            className={cn(
              'font-mono text-2xl font-medium leading-none tnum',
              overdue > 0 ? 'text-flag' : 'text-ink-faint',
            )}
          >
            {overdue}
          </span>
          <span
            className={cn(
              'mt-1.5 font-mono text-3xs uppercase leading-tight tracking-[0.08em]',
              overdue > 0 ? 'text-flag/80' : 'text-ink-faint',
            )}
          >
            Past
            <br />
            due
          </span>
        </Link>

        <div className="w-px shrink-0 bg-line" aria-hidden />

        {/* The staff itself. */}
        <div className="flex min-w-0 flex-1 items-end gap-[3px] sm:gap-1.5">
          {columns.map((column, index) => (
            <Link
              key={column.day}
              to={dayHref(column.day)}
              title={`${column.count} due ${column.date.toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}`}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-sm pt-1"
            >
              <span
                className={cn(
                  'font-mono text-2xs leading-none tnum transition-colors',
                  column.count === busiest && column.count > 0
                    ? 'font-semibold text-ink'
                    : column.count
                      ? 'text-ink-muted'
                      : 'text-transparent group-hover:text-ink-faint',
                )}
              >
                {column.count || 0}
              </span>

              {/* Ticks stack up from the baseline rule. */}
              <span
                className="flex w-full flex-col-reverse items-stretch gap-[3px]"
                style={{ minHeight: `${rows * ROW}px` }}
                aria-hidden
              >
                {column.ticks.map((tick, tickIndex) => (
                  <span
                    key={tickIndex}
                    className={cn(TICK, 'animate-tick-in', tick)}
                    style={{ animationDelay: `${index * 22 + tickIndex * 30}ms` }}
                  />
                ))}
                {column.overflow > 0 && (
                  <span className={cn(TICK, 'bg-line-strong opacity-60')} />
                )}
              </span>

              <span
                className={cn(
                  'h-[2px] w-full rounded-full transition-colors',
                  column.isToday
                    ? 'bg-ink'
                    : column.weekend
                      ? 'bg-line'
                      : 'bg-line-strong group-hover:bg-ink-faint',
                )}
              />

              <span
                className={cn(
                  'font-mono text-3xs uppercase leading-none',
                  column.isToday
                    ? 'font-semibold text-ink'
                    : column.weekend
                      ? 'text-ink-faint/60'
                      : 'text-ink-faint',
                )}
              >
                {column.isToday
                  ? 'Today'
                  : column.date.toLocaleDateString(undefined, { day: 'numeric' })}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-3 border-t border-line pt-2.5 text-xs text-ink-muted">
        One tick per open task, coloured by priority. Pick a day to see what is due.
      </p>
    </div>
  )
}
