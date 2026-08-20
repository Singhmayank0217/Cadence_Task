import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  CircleDashed,
  CircleDot,
  Inbox,
  ListChecks,
  Plus,
  RotateCw,
  TriangleAlert,
} from 'lucide-react'
import { dashboardService } from '@/services/dashboardService'
import { userService } from '@/services/userService'
import { useAsync } from '@/hooks/useAsync'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime } from '@/lib/date'
import { Button, EmptyState, ErrorState, Panel, PanelHeader, Skeleton } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { WorkloadRail } from '@/components/dashboard/WorkloadRail'
import { WorkloadTable } from '@/components/dashboard/WorkloadTable'
import { CadenceStrip } from '@/components/dashboard/CadenceStrip'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'

function LoadingDashboard() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-[168px] w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-[92px] rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const [reloadKey, setReloadKey] = useState(0)
  const form = useDisclosure()

  const { data, loading, error, refetch } = useAsync(() => dashboardService.load(), [reloadKey])
  const { data: usersPage } = useAsync(() => userService.list(), [])

  if (loading && !data) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Dashboard" />
        <LoadingDashboard />
      </>
    )
  }

  if (error && !data) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Dashboard" />
        <ErrorState error={error} onRetry={refetch} />
      </>
    )
  }

  const { stats, status_breakdown: breakdown, workload, due_timeline: timeline } = data
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <>
      <PageHeader
        eyebrow={`Team overview · updated ${formatDateTime(data.generated_at)}`}
        title={`Good to see you, ${firstName}`}
        description="Where the team's work stands right now, and what needs a decision today."
        actions={
          <>
            <Button variant="secondary" icon={RotateCw} onClick={refetch}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => form.open()}>
              New task
            </Button>
          </>
        }
      />

      {/* Signature: the fortnight ahead, read as a score. */}
      <Panel className="mb-4">
        <PanelHeader
          eyebrow="Next 14 days"
          title="The fortnight ahead"
          meta={`${stats.due_today} due today · ${stats.due_this_week} this week`}
        />
        <CadenceStrip buckets={timeline} overdue={stats.overdue_tasks} />
      </Panel>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total"
          value={stats.total_tasks}
          icon={ListChecks}
          to="/tasks"
          hint={`${stats.completion_rate}% complete`}
        />
        <StatCard
          label="Pending"
          value={stats.pending_tasks}
          icon={CircleDashed}
          to="/tasks?status=pending"
          hint="Waiting to be picked up"
        />
        <StatCard
          label="In progress"
          value={stats.in_progress_tasks}
          icon={CircleDot}
          tone="accent"
          to="/tasks?status=in_progress"
          hint="Actively being worked on"
        />
        <StatCard
          label="Blocked"
          value={stats.blocked_tasks}
          icon={TriangleAlert}
          tone={stats.blocked_tasks ? 'flag' : 'default'}
          to="/tasks?status=blocked"
          hint={stats.blocked_tasks ? 'Needs a decision to move' : 'Nothing stuck'}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue_tasks}
          icon={CalendarClock}
          tone={stats.overdue_tasks ? 'flag' : 'moss'}
          to="/tasks?overdue=true&sort=due_date:asc"
          hint={stats.overdue_tasks ? 'Past their due date' : 'Nothing past due'}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <PanelHeader
              eyebrow="Mix"
              title="Everything in flight"
              meta={`${stats.total_tasks} tracked`}
            />
            <div className="px-4 py-4">
              <WorkloadRail breakdown={breakdown} total={stats.total_tasks} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Capacity"
              title="Workload by team member"
              action={
                <Link to="/team" className="link text-xs">
                  View team
                </Link>
              }
            />
            {workload.length ? (
              <WorkloadTable rows={workload} />
            ) : (
              <EmptyState
                icon={Inbox}
                title="No team members yet"
                message="Add people to the team and their workload will show up here."
              />
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              eyebrow={`${stats.my_open_tasks} open`}
              title="Your queue"
              meta={stats.my_overdue_tasks ? `${stats.my_overdue_tasks} late` : undefined}
              action={
                <Link to="/tasks?assignee=me" className="link text-xs">
                  See all
                </Link>
              }
            />
            {data.my_focus.length ? (
              <div className="space-y-2 p-3">
                {data.my_focus.map((task) => (
                  <TaskCard key={task.id} task={task} showAssignee={false} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="Your queue is clear"
                message="Nothing is assigned to you right now. Pick up an unassigned task to get started."
                action={
                  <Button size="sm" variant="secondary" onClick={() => form.open()}>
                    Create a task
                  </Button>
                }
              />
            )}
          </Panel>

          <Panel>
            <PanelHeader eyebrow="Latest changes" title="Recently updated" />
            <div className="space-y-2 p-3">
              {data.recently_updated.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <TaskFormModal
        open={form.isOpen}
        onClose={form.close}
        users={usersPage?.items ?? []}
        onSaved={() => setReloadKey((key) => key + 1)}
      />
    </>
  )
}
