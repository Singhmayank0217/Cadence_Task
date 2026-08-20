import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Users } from 'lucide-react'
import { userService } from '@/services/userService'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useToast } from '@/context/ToastContext'
import { ROLE_OPTIONS } from '@/lib/constants'
import { formatDate } from '@/lib/date'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Panel,
  SearchInput,
  Select,
  Skeleton,
} from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'

function AddMemberModal({ open, onClose, onSaved }) {
  const toast = useToast()
  const [values, setValues] = useState({ name: '', email: '', role: 'member', job_title: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (values.name.trim().length < 2) nextErrors.name = 'Enter their full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Enter a valid work email.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      const user = await userService.create({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
        job_title: values.job_title.trim() || null,
      })
      toast.success('Team member added', { description: `${user.name} can now be assigned work.` })
      setValues({ name: '', email: '', role: 'member', job_title: '' })
      onSaved?.()
      onClose()
    } catch (error) {
      if (error.code === 'conflict') setErrors({ email: error.message })
      toast.error("Couldn't add the member", { description: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Add a team member"
      description="They can be assigned tasks straight away. The default password is password123."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Add member
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Full name" htmlFor="member-name" error={errors.name} required>
          <Input
            id="member-name"
            data-autofocus
            value={values.name}
            invalid={Boolean(errors.name)}
            onChange={(event) => setValue('name', event.target.value)}
          />
        </Field>
        <Field label="Work email" htmlFor="member-email" error={errors.email} required>
          <Input
            id="member-email"
            type="email"
            value={values.email}
            invalid={Boolean(errors.email)}
            onChange={(event) => setValue('email', event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" htmlFor="member-role">
            <Select
              id="member-role"
              value={values.role}
              options={ROLE_OPTIONS}
              onChange={(event) => setValue('role', event.target.value)}
            />
          </Field>
          <Field label="Job title" htmlFor="member-title">
            <Input
              id="member-title"
              placeholder="Backend Engineer"
              value={values.job_title}
              onChange={(event) => setValue('job_title', event.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}

export function TeamPage() {
  useDocumentTitle('Team')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const addMember = useDisclosure()

  const { data, loading, error, refetch } = useAsync(
    () => userService.list({ search: debouncedSearch || undefined, role: role || undefined }),
    [debouncedSearch, role],
  )

  const members = data?.items ?? []

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Team"
        description="Who is on the team, what they are carrying, and how much of it is late."
        actions={
          <Button icon={UserPlus} onClick={addMember.open}>
            Add member
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput
          className="sm:w-80"
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search name, email or title"
        />
        <Select
          className="sm:w-48"
          aria-label="Filter by role"
          value={role}
          placeholder="Any role"
          options={ROLE_OPTIONS}
          onChange={(event) => setRole(event.target.value)}
        />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[168px] rounded-lg" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Users}
            title="No matching team members"
            message="Try a different search, or add someone new to the team."
            action={
              <Button variant="secondary" onClick={addMember.open}>
                Add member
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <article
              key={member.id}
              className="rounded-lg border border-line bg-surface p-4 shadow-card transition hover:border-line-strong"
            >
              <div className="flex items-start gap-3">
                <Avatar user={member} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-sans text-[15px] font-semibold text-ink">
                    {member.name}
                  </h3>
                  <p className="truncate text-xs text-ink-muted">{member.job_title ?? 'Team member'}</p>
                  <p className="mt-0.5 truncate font-mono text-3xs text-ink-faint">{member.email}</p>
                </div>
                <Badge tone={member.role === 'admin' ? 'accent' : 'neutral'}>{member.role}</Badge>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">
                <div>
                  <dt className="eyebrow">Open</dt>
                  <dd className="mt-0.5 font-mono text-lg text-ink">{member.open_tasks}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Done</dt>
                  <dd className="mt-0.5 font-mono text-lg text-accent">{member.completed_tasks}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Late</dt>
                  <dd
                    className={`mt-0.5 font-mono text-lg ${
                      member.overdue_tasks ? 'text-flag' : 'text-ink-faint'
                    }`}
                  >
                    {member.overdue_tasks}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-3xs text-ink-faint">
                  Joined {formatDate(member.created_at)}
                </span>
                <Link to={`/tasks?assignee=${member.id}`} className="link text-xs">
                  View their tasks
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <AddMemberModal open={addMember.isOpen} onClose={addMember.close} onSaved={refetch} />
    </>
  )
}
