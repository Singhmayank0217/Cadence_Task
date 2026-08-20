import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui'
import { CommandPalette } from '@/components/command/CommandPalette'
import { Brand } from './Brand'
import { Sidebar } from './Sidebar'

export function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Cmd/Ctrl-K anywhere, and a bare "n" to start a task when not typing.
  useEffect(() => {
    const onKeyDown = (event) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      } else if (event.key === 'n' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        navigate('/tasks?new=1')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  const newTask = useCallback(() => navigate('/tasks?new=1'), [navigate])

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[212px] lg:block">
        <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[248px] animate-slide-in shadow-modal">
            <Sidebar
              onNavigate={() => setMobileOpen(false)}
              onOpenPalette={() => {
                setMobileOpen(false)
                setPaletteOpen(true)
              }}
            />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-line bg-surface px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-ink/5"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Brand tone="light" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-ink/5"
          >
            <Search className="h-4 w-4" />
          </button>
          <Avatar user={user} size="sm" />
        </div>
      </header>

      <main className="lg:pl-[212px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
          {children}
        </div>
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewTask={newTask}
      />
    </div>
  )
}
