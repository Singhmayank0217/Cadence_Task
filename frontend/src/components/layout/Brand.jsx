import { cn } from '@/lib/cn'

/**
 * Three bars of different heights: the same shape as a column on the cadence
 * strip. The mark is the product's core idea - how work stacks up on a day.
 */
export function Brand({ className, tone = 'dark', showWordmark = true }) {
  const dark = tone === 'dark'
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex h-6 w-6 items-end justify-center gap-[2px] rounded pb-1.5',
          dark ? 'bg-white/[0.07]' : 'bg-ink',
        )}
      >
        <span className="h-[7px] w-[2px] rounded-full bg-ink-faint" />
        <span className="h-[13px] w-[2px] rounded-full bg-accent" />
        <span className="h-[10px] w-[2px] rounded-full bg-flag" />
      </span>
      {showWordmark && (
        <span
          className={cn(
            'text-[15px] font-semibold tracking-[-0.01em]',
            dark ? 'text-white' : 'text-ink',
          )}
        >
          Cadence
        </span>
      )}
    </span>
  )
}
