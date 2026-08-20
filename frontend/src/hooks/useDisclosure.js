import { useCallback, useState } from 'react'

/** Open/close state for modals, drawers and confirm dialogs. */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)
  const [payload, setPayload] = useState(null)

  const open = useCallback((value = null) => {
    setPayload(value)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setPayload(null)
  }, [])

  return { isOpen, payload, open, close, toggle: () => setIsOpen((v) => !v) }
}
