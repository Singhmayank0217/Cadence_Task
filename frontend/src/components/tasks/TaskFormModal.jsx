import { useEffect, useState } from 'react'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/constants'
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/date'
import { taskService } from '@/services/taskService'
import { useToast } from '@/context/ToastContext'
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'

const EMPTY = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  assigned_to: '',
  due_date: '',
}

function validate(values) {
  const errors = {}
  if (!values.title.trim()) errors.title = 'Give the task a name.'
  else if (values.title.trim().length < 3) errors.title = 'Use at least 3 characters.'
  else if (values.title.length > 200) errors.title = 'Keep the name under 200 characters.'
  return errors
}

/**
 * One form for both create and edit. `task` present means edit.
 * Server-side validation errors are surfaced on the matching field.
 */
export function TaskFormModal({ open, onClose, task, users = [], onSaved }) {
  const isEdit = Boolean(task)
  const toast = useToast()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setValues(
      task
        ? {
            title: task.title ?? '',
            description: task.description ?? '',
            status: task.status,
            priority: task.priority,
            assigned_to: task.assignee?.id ? String(task.assignee.id) : '',
            due_date: toDateTimeLocal(task.due_date),
          }
        : EMPTY,
    )
  }, [open, task])

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (event) => {
    event?.preventDefault()
    const nextErrors = validate(values)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      status: values.status,
      priority: values.priority,
      assigned_to: values.assigned_to ? Number(values.assigned_to) : null,
      due_date: fromDateTimeLocal(values.due_date),
    }

    setSaving(true)
    try {
      const saved = isEdit
        ? await taskService.update(task.id, payload)
        : await taskService.create(payload)
      toast.success(isEdit ? 'Task updated' : 'Task created', { description: saved.title })
      onSaved?.(saved)
      onClose()
    } catch (error) {
      // FastAPI validation details point at the offending field.
      const field = Array.isArray(error.details)
        ? error.details[0]?.loc?.slice(-1)[0]
        : error.code === 'validation_error'
          ? 'assigned_to'
          : null
      if (field) setErrors({ [field]: error.message })
      toast.error(isEdit ? "Couldn't update the task" : "Couldn't create the task", {
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const assigneeOptions = users.map((user) => ({ value: String(user.id), label: user.name }))

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? `Edit ${task?.reference ?? 'task'}` : 'New task'}
      description={
        isEdit ? 'Changes are recorded in the task history.' : 'Add work for the team to pick up.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Task name" htmlFor="title" error={errors.title} required>
          <Input
            id="title"
            data-autofocus
            value={values.title}
            invalid={Boolean(errors.title)}
            placeholder="e.g. Migrate Shopify order sync to webhooks"
            onChange={(event) => setValue('title', event.target.value)}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          hint="What does done look like? Add context the assignee will need."
          error={errors.description}
        >
          <Textarea
            id="description"
            rows={4}
            value={values.description}
            placeholder="Add the detail here..."
            onChange={(event) => setValue('description', event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="status">
            <Select
              id="status"
              value={values.status}
              options={STATUS_OPTIONS}
              onChange={(event) => setValue('status', event.target.value)}
            />
          </Field>

          <Field label="Priority" htmlFor="priority">
            <Select
              id="priority"
              value={values.priority}
              options={PRIORITY_OPTIONS}
              onChange={(event) => setValue('priority', event.target.value)}
            />
          </Field>

          <Field label="Assignee" htmlFor="assignee" error={errors.assigned_to}>
            <Select
              id="assignee"
              value={values.assigned_to}
              placeholder="Leave unassigned"
              options={assigneeOptions}
              invalid={Boolean(errors.assigned_to)}
              onChange={(event) => setValue('assigned_to', event.target.value)}
            />
          </Field>

          <Field label="Due date" htmlFor="due_date" error={errors.due_date}>
            <Input
              id="due_date"
              type="datetime-local"
              value={values.due_date}
              onChange={(event) => setValue('due_date', event.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
