import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { taskService } from '@/services/taskService'
import { userService } from '@/services/userService'
import { useAsync } from '@/hooks/useAsync'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useToast } from '@/context/ToastContext'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/constants'
import { formatDateTime, timeAgo } from '@/lib/date'
import {
  AvatarLabel,
  Badge,
  Button,
  ConfirmDialog,
  DueDate,
  ErrorState,
  Panel,
  PanelHeader,
  Select,
  Skeleton,
  StatusBadge,
} from '@/components/ui'
import { CommentThread } from '@/components/tasks/CommentThread'
import { ActivityFeed } from '@/components/tasks/ActivityFeed'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <span className="eyebrow">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  )
}

export function TaskDetailPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const form = useDisclosure()
  const confirm = useDisclosure()
  const [saving, setSaving] = useState(null)

  const { data: task, loading, error, refetch, setData } = useAsync(
    () => taskService.get(taskId),
    [taskId],
  )
  const { data: usersPage } = useAsync(() => userService.list(), [])
  useDocumentTitle(task ? `${task.reference} - ${task.title}` : 'Task')

  const patch = async (field, value) => {
    setSaving(field)
    try {
      const updated = await taskService.update(task.id, { [field]: value })
      setData(updated)
      toast.success('Task updated', { description: `${updated.reference} - ${field.replace('_', ' ')}` })
    } catch (err) {
      toast.error("Couldn't update the task", { description: err.message })
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async () => {
    try {
      await taskService.remove(task.id)
      toast.success('Task deleted', { description: task.title })
      navigate('/tasks')
    } catch (err) {
      toast.error("Couldn't delete the task", { description: err.message })
    }
  }

  if (loading && !task) {
    return (
      <div className="space-y-5" aria-busy="true">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error && !task) {
    return (
      <>
        <Link to="/tasks" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to tasks
        </Link>
        <ErrorState error={error} onRetry={refetch} />
      </>
    )
  }

  const users = usersPage?.items ?? []

  return (
    <>
      <Link
        to="/tasks"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to tasks
      </Link>

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-faint">{task.reference}</span>
            <StatusBadge status={task.status} />
            {task.is_overdue && <Badge tone="flag">Past due</Badge>}
          </div>
          <h1 className="text-xl font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[24px]">
            {task.title}
          </h1>
          <p className="mt-2 font-mono text-xs text-ink-faint">
            Created {formatDateTime(task.created_at)}
            {task.creator ? ` by ${task.creator.name}` : ''} &middot; updated {timeAgo(task.updated_at)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" icon={Pencil} onClick={() => form.open(task)}>
            Edit
          </Button>
          <Button variant="flag-quiet" icon={Trash2} onClick={confirm.open}>
            Delete
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div className="space-y-4">
          <Panel>
            <PanelHeader eyebrow="Detail" title="Description" />
            <div className="px-4 py-3.5">
              {task.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm text-ink-faint">
                  No description yet. Use Edit to add the context the assignee needs.
                </p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Discussion"
              title="Notes"
              meta={`${task.comments?.length ?? 0} total`}
            />
            <CommentThread taskId={task.id} comments={task.comments} onChanged={refetch} />
          </Panel>
        </div>

        <div className="space-y-4">
          {/* Update the task without leaving the page */}
          <Panel>
            <PanelHeader eyebrow="Update" title="Task settings" />
            <div className="flex flex-col gap-2.5 px-4 py-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">Status</span>
                <Select
                  value={task.status}
                  options={STATUS_OPTIONS}
                  disabled={saving === 'status'}
                  onChange={(event) => patch('status', event.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">Priority</span>
                <Select
                  value={task.priority}
                  options={PRIORITY_OPTIONS}
                  disabled={saving === 'priority'}
                  onChange={(event) => patch('priority', event.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">Assignee</span>
                <Select
                  value={task.assignee?.id ? String(task.assignee.id) : ''}
                  placeholder="Unassigned"
                  disabled={saving === 'assigned_to'}
                  options={users.map((user) => ({ value: String(user.id), label: user.name }))}
                  onChange={(event) =>
                    patch('assigned_to', event.target.value ? Number(event.target.value) : null)
                  }
                />
              </label>
            </div>
          </Panel>

          <Panel>
            <PanelHeader eyebrow="At a glance" title="Details" />
            <div className="divide-y divide-line">
              <DetailRow label="Due">
                <DueDate value={task.due_date} status={task.status} showDate />
              </DetailRow>
              <DetailRow label="Created">
                <span className="font-mono text-xs text-ink-muted">
                  {formatDateTime(task.created_at)}
                </span>
              </DetailRow>
              <DetailRow label="Updated">
                <span className="font-mono text-xs text-ink-muted">
                  {formatDateTime(task.updated_at)}
                </span>
              </DetailRow>
              {task.completed_at && (
                <DetailRow label="Completed">
                  <span className="font-mono text-xs text-moss">
                    {formatDateTime(task.completed_at)}
                  </span>
                </DetailRow>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader eyebrow="Audit trail" title="History" />
            <ActivityFeed items={task.activities} />
          </Panel>
        </div>
      </div>

      <TaskFormModal
        open={form.isOpen}
        onClose={form.close}
        task={form.payload}
        users={users}
        onSaved={(saved) => setData(saved)}
      />

      <ConfirmDialog
        open={confirm.isOpen}
        onClose={confirm.close}
        onConfirm={handleDelete}
        title="Delete this task?"
        message={`"${task.title}" and all of its notes and history will be removed. This can't be undone.`}
        confirmLabel="Delete task"
      />
    </>
  )
}
