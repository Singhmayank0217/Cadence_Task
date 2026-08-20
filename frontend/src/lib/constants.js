/**
 * The single source of truth for status/priority vocabulary.
 * Keys match the API enums exactly, so badges, filters, forms and charts all
 * read from here instead of hard-coding labels or colours.
 */

export const TASK_STATUS = {
  pending: {
    value: 'pending',
    label: 'Pending',
    dot: 'bg-status-pending',
    bar: 'bg-status-pending',
    chip: 'bg-ink/[0.05] text-ink-muted ring-1 ring-inset ring-ink/10',
  },
  in_progress: {
    value: 'in_progress',
    label: 'In progress',
    dot: 'bg-status-progress',
    bar: 'bg-status-progress',
    chip: 'bg-accent-soft text-accent ring-1 ring-inset ring-accent/20',
  },
  completed: {
    value: 'completed',
    label: 'Completed',
    dot: 'bg-status-completed',
    bar: 'bg-status-completed',
    chip: 'bg-moss-soft text-moss ring-1 ring-inset ring-moss/20',
  },
  blocked: {
    value: 'blocked',
    label: 'Blocked',
    dot: 'bg-status-blocked',
    bar: 'bg-status-blocked',
    chip: 'bg-flag-soft text-flag ring-1 ring-inset ring-flag/20',
  },
}

/**
 * `rank` drives the tick meter on the priority badge: one filled bar for low,
 * four for urgent, so priority is legible without reading the word.
 */
export const TASK_PRIORITY = {
  low: {
    value: 'low', label: 'Low', rank: 1,
    text: 'text-priority-low', tick: 'bg-priority-low',
  },
  medium: {
    value: 'medium', label: 'Medium', rank: 2,
    text: 'text-priority-medium', tick: 'bg-priority-medium',
  },
  high: {
    value: 'high', label: 'High', rank: 3,
    text: 'text-priority-high', tick: 'bg-priority-high',
  },
  urgent: {
    value: 'urgent', label: 'Urgent', rank: 4,
    text: 'text-priority-urgent', tick: 'bg-priority-urgent',
  },
}

export const USER_ROLES = {
  admin: { value: 'admin', label: 'Admin' },
  manager: { value: 'manager', label: 'Manager' },
  member: { value: 'member', label: 'Member' },
}

export const STATUS_OPTIONS = Object.values(TASK_STATUS).map((s) => ({
  value: s.value,
  label: s.label,
}))

export const PRIORITY_OPTIONS = Object.values(TASK_PRIORITY).map((p) => ({
  value: p.value,
  label: p.label,
}))

export const ROLE_OPTIONS = Object.values(USER_ROLES).map((r) => ({
  value: r.value,
  label: r.label,
}))

export const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'due_date:asc', label: 'Due soonest' },
  { value: 'due_date:desc', label: 'Due latest' },
  { value: 'priority:desc', label: 'Priority: high to low' },
  { value: 'priority:asc', label: 'Priority: low to high' },
  { value: 'updated_at:desc', label: 'Recently updated' },
  { value: 'title:asc', label: 'Title A-Z' },
]

export const PAGE_SIZES = [10, 20, 50]

/** Every task shows a stable reference so people can quote one in Slack. */
export const taskRef = (id) => `TSK-${String(id).padStart(4, '0')}`

export const statusMeta = (value) => TASK_STATUS[value] ?? TASK_STATUS.pending
export const priorityMeta = (value) => TASK_PRIORITY[value] ?? TASK_PRIORITY.medium
