import { X } from 'lucide-react'
import {
  PRIORITY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  priorityMeta,
  statusMeta,
} from '@/lib/constants'
import { formatDate } from '@/lib/date'
import { Button, SearchInput, Select } from '@/components/ui'

/**
 * Filters are controlled by the URL (see useTaskQuery), so a filtered view can
 * be bookmarked, shared, or restored on refresh. Anything set outside these
 * five controls - an overdue link from the dashboard, a single day from the
 * cadence strip - still shows up as a removable chip, so the list never
 * silently hides rows.
 */
export function TaskFilters({
  filters,
  searchInput,
  setSearchInput,
  setFilter,
  resetFilters,
  activeFilterCount,
  users = [],
  resultCount,
}) {
  const assigneeOptions = [
    { value: 'me', label: 'Assigned to me' },
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map((user) => ({ value: String(user.id), label: user.name })),
  ]

  const userName = (id) => users.find((user) => String(user.id) === String(id))?.name

  const chips = []
  if (filters.search) {
    chips.push({ key: 'search', label: `Search: ${filters.search}`, clear: () => setSearchInput('') })
  }
  if (filters.status) {
    chips.push({ key: 'status', label: statusMeta(filters.status).label })
  }
  if (filters.priority) {
    chips.push({ key: 'priority', label: `${priorityMeta(filters.priority).label} priority` })
  }
  if (filters.assignee) {
    const label =
      filters.assignee === 'me'
        ? 'Assigned to me'
        : filters.assignee === 'unassigned'
          ? 'Unassigned'
          : (userName(filters.assignee) ?? `User ${filters.assignee}`)
    chips.push({ key: 'assignee', label })
  }
  if (filters.overdue) {
    chips.push({ key: 'overdue', label: 'Overdue only' })
  }
  if (filters.due_after || filters.due_before) {
    chips.push({
      key: 'due_after',
      label: `Due ${formatDate(filters.due_after || filters.due_before)}`,
      clear: () => {
        setFilter('due_after', '')
        setFilter('due_before', '')
      },
    })
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-2.5 shadow-card">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_minmax(0,1.2fr)]">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onClear={() => setSearchInput('')}
          placeholder="Search title or description"
        />
        <Select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
          placeholder="Any status"
          options={STATUS_OPTIONS}
        />
        <Select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(event) => setFilter('priority', event.target.value)}
          placeholder="Any priority"
          options={PRIORITY_OPTIONS}
        />
        <Select
          aria-label="Filter by assignee"
          value={filters.assignee}
          onChange={(event) => setFilter('assignee', event.target.value)}
          placeholder="Anyone"
          options={assigneeOptions}
        />
        <Select
          aria-label="Sort tasks"
          value={filters.sort}
          onChange={(event) => setFilter('sort', event.target.value)}
          options={SORT_OPTIONS}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.clear ?? (() => setFilter(chip.key, ''))}
            className="group inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-1 text-xs text-accent transition-colors hover:bg-accent/15"
          >
            {chip.label}
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100" aria-hidden />
          </button>
        ))}

        <p className="ml-auto font-mono text-3xs uppercase tracking-[0.08em] text-ink-faint">
          {resultCount !== undefined
            ? `${resultCount} match${resultCount === 1 ? '' : 'es'}`
            : ''}
        </p>

        {activeFilterCount > 0 && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Clear all
          </Button>
        )}
      </div>
    </div>
  )
}
