import { NavLink } from 'react-router-dom'
import { Building2, LayoutDashboard, ListChecks, LogOut, Users } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui'
import { Brand } from './Brand'

/**
 * Nav is grouped by what the item is about: the work itself, then the people
 * around it. Two groups is enough structure to be useful and little enough to
 * stay out of the way.
 */
const NAV = [
  {
    label: 'Work',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/tasks', label: 'Tasks', icon: ListChecks },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/team', label: 'Team', icon: Users },
      { to: '/directory', label: 'Partner directory', icon: Building2 },
    ],
  },
]

export function Sidebar({ onNavigate, onOpenPalette }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full flex-col bg-ink">
      <div className="px-4 pb-4 pt-4">
        <Brand />
      </div>

      {/* The palette is the fastest way around, so it sits above the nav. */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex w-full items-center justify-between gap-2 rounded-md bg-white/[0.06] px-2.5 py-1.5 text-left text-[13px] text-white/45 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          Search or jump to
          <kbd className="rounded border border-white/15 px-1 py-px font-mono text-3xs text-white/40">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-5 px-3" aria-label="Main">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 pb-1.5 font-mono text-3xs uppercase tracking-[0.1em] text-white/25">
              {group.label}
            </p>
            <div className="space-y-px">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                      isActive
                        ? 'bg-white/[0.09] font-medium text-white'
                        : 'text-white/50 hover:bg-white/[0.05] hover:text-white/85',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'absolute -left-3 h-4 w-[2px] rounded-r-full bg-accent transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                        aria-hidden
                      />
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-line p-2.5">
        <div className="flex items-center gap-2 rounded-md px-1.5 py-1.5">
          <Avatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-white">{user?.name}</p>
            <p className="truncate font-mono text-3xs uppercase tracking-[0.08em] text-white/35">
              {user?.role}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1.5 text-white/35 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
