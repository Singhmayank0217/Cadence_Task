import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, ListX, Plus, SearchX } from 'lucide-react'
import { useTaskQuery } from '@/hooks/useTaskQuery'
import { useAsync } from '@/hooks/useAsync'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { userService } from '@/services/userService'
import { taskService } from '@/services/taskService'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
  Panel,
  TableSkeleton,
} from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'

export function TasksPage() {
  useDocumentTitle('Tasks')
  const toast = useToast()
  const query = useTaskQuery()
  const { data: usersPage } = useAsync(() => userService.list(), [])
  const form = useDisclosure()
  const confirm = useDisclosure()
  const [exporting, setExporting] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortBy, sortDir] = query.filters.sort.split(':')

  // `?new=1` opens the create form, so the N shortcut and the command palette
  // can land here from anywhere in the app.
  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    form.open()
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, form])

  const handleExport = async () => {
    setExporting(true)
    try {
      const filename = await taskService.exportCsv({
        search: query.filters.search || undefined,
        status: query.filters.status || undefined,
        priority: query.filters.priority || undefined,
        assignee: query.filters.assignee || undefined,
        overdue: query.filters.overdue || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      })
      toast.success('Export ready', { description: filename })
    } catch (error) {
      toast.error("Couldn't export these tasks", { description: error.message })
    } finally {
      setExporting(false)
    }
  }

  const handleSort = (key) => {
    const nextDir = sortBy === key && sortDir === 'desc' ? 'asc' : 'desc'
    query.setFilter('sort', `${key}:${nextDir}`)
  }

  const handleDelete = async () => {
    const task = confirm.payload
    try {
      await taskService.remove(task.id)
      toast.success('Task deleted', { description: `${task.reference} - ${task.title}` })
      query.refetch()
    } catch (error) {
      toast.error("Couldn't delete the task", { description: error.message })
    }
  }

  const noResults = !query.loading && !query.error && query.tasks.length === 0
  const filtered = query.activeFilterCount > 0

  const emptyState = filtered ? (
    <EmptyState
      icon={SearchX}
      title="No tasks match these filters"
      message="Try a different status, priority or assignee, or clear the filters to see everything."
      action={
        <Button variant="secondary" onClick={query.resetFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={ListX}
      title="No tasks yet"
      message="Create the first task and it will show up here for the whole team."
      action={
        <Button icon={Plus} onClick={() => form.open()}>
          New task
        </Button>
      }
    />
  )

  return (
    <>
      <PageHeader
        eyebrow="Task management"
        title="Tasks"
        description="Search, filter and sort the full backlog. Every query runs against the API, so this stays fast as the list grows."
        actions={
          <>
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExport}
              loading={exporting}
              disabled={!query.meta?.total}
            >
              Export CSV
            </Button>
            <Button icon={Plus} onClick={() => form.open()}>
              New task
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <TaskFilters
          filters={query.filters}
          searchInput={query.searchInput}
          setSearchInput={query.setSearchInput}
          setFilter={query.setFilter}
          resetFilters={query.resetFilters}
          activeFilterCount={query.activeFilterCount}
          users={usersPage?.items ?? []}
          resultCount={query.meta?.total}
        />
      </div>

      {query.error ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : (
        <Panel className="overflow-hidden">
          {query.loading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : noResults ? (
            emptyState
          ) : (
            <>
              {/* Table on desktop, cards on small screens */}
              <div className="hidden md:block">
                <TaskTable
                  tasks={query.tasks}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  onEdit={(task) => form.open(task)}
                  onDelete={(task) => confirm.open(task)}
                />
              </div>
              <div className="space-y-2 p-3 md:hidden">
                {query.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </>
          )}

          <Pagination
            meta={query.meta}
            onPageChange={(page) => query.setFilter('page', page)}
            onLimitChange={(limit) => query.setFilter('limit', limit)}
          />
        </Panel>
      )}

      <TaskFormModal
        open={form.isOpen}
        onClose={form.close}
        task={form.payload}
        users={usersPage?.items ?? []}
        onSaved={query.refetch}
      />

      <ConfirmDialog
        open={confirm.isOpen}
        onClose={confirm.close}
        onConfirm={handleDelete}
        title="Delete this task?"
        message={
          confirm.payload
            ? `"${confirm.payload.title}" and all of its notes and history will be removed. This can't be undone.`
            : ''
        }
        confirmLabel="Delete task"
      />
    </>
  )
}
