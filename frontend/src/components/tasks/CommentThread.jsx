import { useState } from 'react'
import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { timeAgo } from '@/lib/date'
import { taskService } from '@/services/taskService'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Avatar, Button, EmptyState, IconButton, Textarea } from '@/components/ui'

export function CommentThread({ taskId, comments = [], onChanged }) {
  const { user } = useAuth()
  const toast = useToast()
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setPosting(true)
    try {
      await taskService.addComment(taskId, text)
      setDraft('')
      toast.success('Note added')
      onChanged?.()
    } catch (error) {
      toast.error("Couldn't add the note", { description: error.message })
    } finally {
      setPosting(false)
    }
  }

  const remove = async (commentId) => {
    try {
      await taskService.deleteComment(taskId, commentId)
      toast.success('Note deleted')
      onChanged?.()
    } catch (error) {
      toast.error("Couldn't delete the note", { description: error.message })
    }
  }

  return (
    <div className="px-5 py-4">
      <form onSubmit={submit} className="flex gap-3">
        <Avatar user={user} size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <Textarea
            rows={draft ? 3 : 2}
            value={draft}
            placeholder="Add a note for the team..."
            aria-label="Add a note"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit(event)
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-3xs text-ink-faint">Cmd + Enter to post</span>
            <Button type="submit" size="sm" loading={posting} disabled={!draft.trim()}>
              Post note
            </Button>
          </div>
        </div>
      </form>

      {comments.length === 0 ? (
        <EmptyState
          className="py-8"
          icon={MessageSquarePlus}
          title="No notes yet"
          message="Decisions, blockers and hand-offs recorded here stay with the task."
        />
      ) : (
        <ul className="mt-5 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="group flex gap-3">
              <Avatar user={comment.author} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-ink">{comment.author?.name}</span>
                  <span className="font-mono text-3xs text-ink-faint">
                    {timeAgo(comment.created_at)}
                  </span>
                  {comment.author?.id === user?.id && (
                    <span className="ml-auto opacity-0 transition group-hover:opacity-100">
                      <IconButton
                        icon={Trash2}
                        label="Delete note"
                        onClick={() => remove(comment.id)}
                        className="h-7 w-7 hover:bg-flag-soft hover:text-flag"
                      />
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                  {comment.comment}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
