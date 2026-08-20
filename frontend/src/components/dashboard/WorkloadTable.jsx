import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui'
import { WorkloadRail } from './WorkloadRail'

/**
 * Per-member load. Bar length is share of the busiest person's queue, so the
 * column reads as a ranking rather than four unrelated bars.
 */
export function WorkloadTable({ rows = [] }) {
  const busiest = Math.max(1, ...rows.map((row) => row.total))

  return (
    <ul className="divide-y divide-line">
      {rows.map((row) => {
        const open = row.pending + row.in_progress + row.blocked
        return (
          <li key={row.user_id} className="flex items-center gap-3 px-4 py-2.5 row-hover">
            <Avatar user={{ name: row.name, avatar_url: row.avatar_url }} size="sm" />

            <div className="min-w-0 w-[38%] shrink-0">
              <Link
                to={`/tasks?assignee=${row.user_id}`}
                className="block truncate text-[13px] font-medium text-ink hover:text-accent"
              >
                {row.name}
              </Link>
              <p className="truncate text-xs text-ink-faint">{row.job_title ?? 'Team member'}</p>
            </div>

            <div className="min-w-0 flex-1">
              <div style={{ width: `${Math.max((row.total / busiest) * 100, 6)}%` }}>
                <WorkloadRail
                  breakdown={row}
                  total={row.total}
                  showLegend={false}
                  height="h-1.5"
                />
              </div>
            </div>

            <div className="flex w-[92px] shrink-0 items-baseline justify-end gap-1.5">
              {row.overdue > 0 && (
                <span className="font-mono text-3xs uppercase tracking-[0.08em] text-flag">
                  {row.overdue} late
                </span>
              )}
              <span className="font-mono text-[13px] text-ink tnum">{open}</span>
              <span className="font-mono text-3xs uppercase tracking-[0.08em] text-ink-faint">
                open
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
