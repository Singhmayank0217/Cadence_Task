import { useNavigate } from 'react-router-dom'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/date'
import {
  AvatarLabel,
  DueDate,
  IconButton,
  PriorityBadge,
  StatusBadge,
  Table,
} from '@/components/ui'

export function TaskTable({ tasks, sortBy, sortDir, onSort, onEdit, onDelete, emptyState }) {
  const navigate = useNavigate()

  const columns = [
    {
      key: 'title',
      header: 'Task',
      sortKey: 'title',
      render: (task) => (
        <div className="min-w-0 max-w-[420px]">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-ink group-hover:text-accent">{task.title}</span>
            {task.comment_count > 0 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 font-mono text-3xs text-ink-faint">
                <MessageSquare className="h-3 w-3" aria-hidden />
                {task.comment_count}
              </span>
            )}
          </div>
          <span className="mt-0.5 block font-mono text-3xs text-ink-faint">{task.reference}</span>
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      width: '190px',
      render: (task) => <AvatarLabel user={task.assignee} size="xs" />,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortKey: 'priority',
      width: '130px',
      render: (task) => <PriorityBadge priority={task.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      width: '140px',
      render: (task) => <StatusBadge status={task.status} />,
    },
    {
      key: 'due_date',
      header: 'Due',
      sortKey: 'due_date',
      width: '140px',
      render: (task) => <DueDate value={task.due_date} status={task.status} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortKey: 'created_at',
      width: '110px',
      render: (task) => (
        <span className="font-mono text-xs text-ink-faint">{formatDate(task.created_at)}</span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortKey: 'updated_at',
      width: '130px',
      render: (task) => (
        <span className="font-mono text-xs text-ink-faint">{timeAgo(task.updated_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '84px',
      align: 'right',
      render: (task) => (
        <div
          className="flex justify-end gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <IconButton icon={Pencil} label={`Edit ${task.reference}`} onClick={() => onEdit(task)} />
          <IconButton
            icon={Trash2}
            label={`Delete ${task.reference}`}
            onClick={() => onDelete(task)}
            className="hover:bg-flag-soft hover:text-flag"
          />
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      rows={tasks}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={onSort}
      onRowClick={(task) => navigate(`/tasks/${task.id}`)}
      emptyState={emptyState}
    />
  )
}
