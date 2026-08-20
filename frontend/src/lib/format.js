export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function pluralise(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`
}

export function truncate(text = '', max = 120) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text
}

/** "assigned_to" -> "Assignee" for the activity feed. */
export function fieldLabel(field) {
  return (
    {
      assigned_to: 'Assignee',
      due_date: 'Due date',
      status: 'Status',
      priority: 'Priority',
      title: 'Title',
      description: 'Description',
    }[field] ?? field
  )
}
