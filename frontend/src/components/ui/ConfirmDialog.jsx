import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

/** Every destructive action goes through this - no silent deletes. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'flag',
}) {
  const [working, setWorking] = useState(false)

  const handleConfirm = async () => {
    setWorking(true)
    try {
      await onConfirm?.()
      onClose?.()
    } finally {
      setWorking(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={working ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={working}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'flag' ? 'flag' : 'primary'}
            onClick={handleConfirm}
            loading={working}
            data-autofocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flag-soft text-flag">
          <TriangleAlert className="h-5 w-5" aria-hidden />
        </span>
        <p className="pt-1.5 text-sm leading-relaxed text-ink-muted">{message}</p>
      </div>
    </Modal>
  )
}
