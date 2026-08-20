import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * A stat is only useful if you can act on it, so every card links to the task
 * list already filtered to exactly what it counts.
 */
export function StatCard({ label, value, to, hint, tone = 'default', icon: Icon }) {
  const tones = {
    default: 'text-ink',
    accent: 'text-accent',
    ochre: 'text-ochre',
    flag: 'text-flag',
    moss: 'text-moss',
  }

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-ink-faint" aria-hidden />}
      </div>
      <p
        className={cn(
          'mt-2.5 font-mono text-[26px] font-medium leading-none tnum',
          tones[tone],
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-snug text-ink-faint">{hint}</p>}
    </>
  )

  const className = cn(
    'block rounded-lg border border-line bg-surface px-3.5 py-3 shadow-card transition-colors',
    to && 'hover:border-line-strong hover:bg-raised',
  )

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
