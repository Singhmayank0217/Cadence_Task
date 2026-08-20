/** Date helpers. The API always sends UTC ISO strings; we render local time. */

const MS_PER_DAY = 86_400_000

export function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value, options) {
  const date = parseDate(value)
  if (!date) return '--'
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    ...options,
  })
}

export function formatDateTime(value) {
  const date = parseDate(value)
  if (!date) return '--'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Whole days between today and the given date (negative = in the past). */
export function daysUntil(value) {
  const date = parseDate(value)
  if (!date) return null
  const today = new Date()
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const b = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((b - a) / MS_PER_DAY)
}

/** "Due today", "2 days late", "in 3 days" - the phrasing used across the UI. */
export function describeDueDate(value) {
  const days = daysUntil(value)
  if (days === null) return { label: 'No due date', tone: 'none' }
  if (days === 0) return { label: 'Due today', tone: 'soon' }
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' }
  if (days === -1) return { label: '1 day late', tone: 'late' }
  if (days < 0) return { label: `${Math.abs(days)} days late`, tone: 'late' }
  if (days <= 3) return { label: `Due in ${days} days`, tone: 'soon' }
  return { label: formatDate(value), tone: 'normal' }
}

export function timeAgo(value) {
  const date = parseDate(value)
  if (!date) return '--'
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const units = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['week', 604800],
    ['month', 2592000],
    ['year', 31536000],
  ]
  let label = 'year'
  let divisor = 31536000
  for (let i = 0; i < units.length; i += 1) {
    const [name, size] = units[i]
    const next = units[i + 1]
    if (!next || seconds < next[1]) {
      label = name
      divisor = size
      break
    }
  }
  const count = Math.floor(seconds / divisor)
  return `${count} ${label}${count === 1 ? '' : 's'} ago`
}

/** Turns an ISO string into the value a <input type="datetime-local"> expects. */
export function toDateTimeLocal(value) {
  const date = parseDate(value)
  if (!date) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function fromDateTimeLocal(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
