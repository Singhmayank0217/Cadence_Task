import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Native select on purpose: it is keyboard accessible, works on mobile and
 * never traps focus. The chevron is ours so it matches the rest of the kit.
 */
export const Select = forwardRef(function Select(
  { options = [], placeholder, className, size = 'md', invalid, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-lg border bg-surface pl-3 pr-8 text-sm text-ink transition',
          'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-paper',
          size === 'sm' ? 'h-8 text-[13px]' : 'h-9',
          invalid ? 'border-flag' : 'border-line-strong',
          !props.value && placeholder && 'text-ink-faint',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
    </div>
  )
})
