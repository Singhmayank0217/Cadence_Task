import { ArrowRight, CircleDot, MessageSquare, Plus, UserCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/date'
import { fieldLabel } from '@/lib/format'

const ICONS = {
  created: Plus,
  assigned: UserCheck,
  commented: MessageSquare,
  status_changed: CircleDot,
  priority_changed: CircleDot,
  updated: ArrowRight,
}

function describe(item) {
  const actor = item.actor?.name ?? 'Someone'
  switch (item.action) {
    case 'created':
      return `${actor} created this task`
    case 'assigned':
      return `${actor} assigned it to ${item.new_value ?? 'nobody'}`
    case 'commented':
      return `${actor} added a note`
    case 'status_changed':
    case 'priority_changed':
      return `${actor} moved ${fieldLabel(item.field).toLowerCase()} to ${item.new_value}`
    default:
      return `${actor} updated ${fieldLabel(item.field ?? 'the task').toLowerCase()}`
  }
}

/** Append-only history so nobody has to ask "who changed this?". */
export function ActivityFeed({ items = [] }) {
  if (!items.length) {
    return <p className="px-5 py-6 text-sm text-ink-faint">No changes recorded yet.</p>
  }

  return (
    <ol className="relative px-5 py-4">
      <span className="absolute bottom-6 left-[30px] top-7 w-px bg-line" aria-hidden />
      {items.map((item) => {
        const Icon = ICONS[item.action] ?? ArrowRight
        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            <span
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-surface',
                item.action === 'created' ? 'bg-accent-soft text-accent' : 'bg-paper text-ink-faint',
              )}
            >
              <Icon className="h-3 w-3" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] leading-snug text-ink-muted">{describe(item)}</p>
              <p className="mt-0.5 font-mono text-3xs text-ink-faint">{timeAgo(item.created_at)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
