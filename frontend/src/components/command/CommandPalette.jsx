import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CircleDot,
  Flag,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { taskRef } from '@/lib/constants'
import { taskService } from '@/services/taskService'
import { useAuth } from '@/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'

/**
 * Cmd/Ctrl-K palette.
 *
 * Two kinds of result: fixed commands (navigate, filter, create) matched
 * locally, and live task search hitting the same API the list page uses. Tasks
 * come second because a command is a known destination and a search result is
 * a guess.
 */

const COMMANDS = [
  { id: 'new', label: 'Create a task', hint: 'N', icon: Plus, action: 'new-task' },
  { id: 'dash', label: 'Go to dashboard', icon: LayoutDashboard, to: '/' },
  { id: 'tasks', label: 'Go to tasks', icon: ListChecks, to: '/tasks' },
  { id: 'team', label: 'Go to team', icon: Users, to: '/team' },
  { id: 'dir', label: 'Go to partner directory', icon: Building2, to: '/directory' },
  { id: 'mine', label: 'Show my open work', icon: CircleDot, to: '/tasks?assignee=me' },
  { id: 'late', label: 'Show overdue tasks', icon: Flag, to: '/tasks?overdue=true&sort=due_date:asc' },
  {
    id: 'blocked',
    label: 'Show blocked tasks',
    icon: CircleDot,
    to: '/tasks?status=blocked',
  },
  { id: 'out', label: 'Sign out', icon: LogOut, action: 'logout' },
]

export function CommandPalette({ open, onClose, onNewTask }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [query, setQuery] = useState('')
  const [tasks, setTasks] = useState([])
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounced = useDebounce(query, 200)

  const commands = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return COMMANDS
    return COMMANDS.filter((command) => command.label.toLowerCase().includes(term))
  }, [query])

  const results = useMemo(
    () => [
      ...commands.map((command) => ({ type: 'command', ...command })),
      ...tasks.map((task) => ({ type: 'task', ...task })),
    ],
    [commands, tasks],
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      setTasks([])
      setCursor(0)
      return
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open || debounced.trim().length < 2) {
      setTasks([])
      return
    }
    let cancelled = false
    taskService
      .list({ search: debounced.trim(), limit: 6 })
      .then((page) => {
        if (!cancelled) setTasks(page.items ?? [])
      })
      .catch(() => {
        if (!cancelled) setTasks([])
      })
    return () => {
      cancelled = true
    }
  }, [debounced, open])

  useEffect(() => setCursor(0), [results.length])

  const run = useCallback(
    (item) => {
      if (!item) return
      onClose()
      if (item.type === 'task') {
        navigate(`/tasks/${item.id}`)
        return
      }
      if (item.action === 'new-task') onNewTask?.()
      else if (item.action === 'logout') logout()
      else if (item.to) navigate(item.to)
    },
    [logout, navigate, onClose, onNewTask],
  )

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((index) => (index + 1) % Math.max(results.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((index) => (index - 1 + results.length) % Math.max(results.length, 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      run(results[cursor])
    } else if (event.key === 'Escape') {
      onClose()
    }
  }

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl animate-slide-up overflow-hidden rounded-lg border border-line bg-surface shadow-modal"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tasks or run a command..."
            className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-3xs text-ink-faint sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1.5">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
              Nothing matches "{query}". Try a task title or a reference like TSK-0004.
            </p>
          )}

          {commands.length > 0 && <p className="eyebrow px-3.5 pb-1 pt-2">Commands</p>}
          {results.map((item, index) => {
            const active = index === cursor
            const isFirstTask =
              item.type === 'task' && (index === 0 || results[index - 1]?.type === 'command')
            const Icon = item.icon
            return (
              <div key={`${item.type}-${item.id}`}>
                {isFirstTask && <p className="eyebrow px-3.5 pb-1 pt-3">Tasks</p>}
                <button
                  type="button"
                  data-active={active}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => run(item)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors',
                    active ? 'bg-accent-soft' : 'hover:bg-raised',
                  )}
                >
                  {item.type === 'command' ? (
                    <Icon
                      className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-ink-faint')}
                      aria-hidden
                    />
                  ) : (
                    <span
                      className={cn(
                        'shrink-0 font-mono text-3xs',
                        active ? 'text-accent' : 'text-ink-faint',
                      )}
                    >
                      {taskRef(item.id)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                    {item.type === 'command' ? item.label : item.title}
                  </span>
                  {item.hint && (
                    <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-3xs text-ink-faint">
                      {item.hint}
                    </kbd>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-line bg-raised px-3.5 py-2 font-mono text-3xs text-ink-faint">
          <span>UP DOWN to move</span>
          <span>ENTER to open</span>
        </div>
      </div>
    </div>
  )
}
