import { Link } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/cn'
import { priorityMeta } from '@/lib/constants'
import { DueDate, PriorityBadge, StatusBadge, Avatar } from '@/components/ui'

/**
 * Compact task card used on the dashboard and on mobile, where a table would
 * force horizontal scrolling. The left tick encodes priority without adding
 * another coloured chip.
 */
export function TaskCard({ task, showAssignee = true, className }) {
  const meta = priorityMeta(task.priority)

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        'group relative flex gap-3 overflow-hidden rounded-lg border border-line bg-surface p-3.5 shadow-card transition hover:border-line-strong hover:shadow-pop',
        className,
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', meta.tick)} aria-hidden />

      <div className="min-w-0 flex-1 pl-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-accent">
            {task.title}
          </p>
          <span className="shrink-0 font-mono text-3xs text-ink-faint">{task.reference}</span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge status={task.status} size="sm" />
          <PriorityBadge priority={task.priority} showLabel={false} />
          <DueDate value={task.due_date} status={task.status} />
          {task.comment_count > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-3xs text-ink-faint">
              <MessageSquare className="h-3 w-3" aria-hidden />
              {task.comment_count}
            </span>
          )}
          {showAssignee && task.assignee && (
            <span className="ml-auto">
              <Avatar user={task.assignee} size="xs" />
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
