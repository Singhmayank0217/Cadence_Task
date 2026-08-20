import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { taskService } from '@/services/taskService'
import { useDebounce } from './useDebounce'

const DEFAULTS = {
  search: '',
  status: '',
  priority: '',
  assignee: '',
  overdue: '',
  due_after: '',
  due_before: '',
  sort: 'created_at:desc',
  page: 1,
  limit: 20,
}

/**
 * Owns the task list query: keeps filters in the URL (so a filtered view can be
 * shared or reloaded), debounces the search box, resets to page 1 whenever a
 * filter changes, and refetches from the API on every change.
 */
export function useTaskQuery() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') ?? DEFAULTS.search,
      status: searchParams.get('status') ?? DEFAULTS.status,
      priority: searchParams.get('priority') ?? DEFAULTS.priority,
      assignee: searchParams.get('assignee') ?? DEFAULTS.assignee,
      overdue: searchParams.get('overdue') ?? DEFAULTS.overdue,
      due_after: searchParams.get('due_after') ?? DEFAULTS.due_after,
      due_before: searchParams.get('due_before') ?? DEFAULTS.due_before,
      sort: searchParams.get('sort') ?? DEFAULTS.sort,
      page: Number(searchParams.get('page') ?? DEFAULTS.page),
      limit: Number(searchParams.get('limit') ?? DEFAULTS.limit),
    }),
    [searchParams],
  )

  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebounce(searchInput, 350)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Push the debounced search term into the URL (and back to page 1).
  useEffect(() => {
    if (debouncedSearch === filters.search) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debouncedSearch) next.set('search', debouncedSearch)
        else next.delete('search')
        next.set('page', '1')
        return next
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value === '' || value === null || value === undefined) next.delete(key)
        else next.set(key, String(value))
        if (key !== 'page') next.set('page', '1')
        return next
      })
    },
    [setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchInput('')
    setSearchParams({})
  }, [setSearchParams])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [sortBy, sortDir] = filters.sort.split(':')
    try {
      const result = await taskService.list({
        search: filters.search || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        assignee: filters.assignee || undefined,
        overdue: filters.overdue || undefined,
        due_after: filters.due_after || undefined,
        due_before: filters.due_before || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page: filters.page,
        limit: filters.limit,
      })
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const activeFilterCount = [
    'status',
    'priority',
    'assignee',
    'search',
    'overdue',
    'due_after',
  ].filter((key) => filters[key]).length

  return {
    filters,
    searchInput,
    setSearchInput,
    setFilter,
    resetFilters,
    activeFilterCount,
    tasks: data?.items ?? [],
    meta: data?.meta,
    loading,
    error,
    refetch: fetchTasks,
  }
}
