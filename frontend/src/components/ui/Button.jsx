import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-ink-soft disabled:bg-ink/40',
  accent: 'bg-accent text-white hover:bg-accent-hover disabled:bg-accent/40',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-raised',
  ghost: 'text-ink-muted hover:bg-ink/5 hover:text-ink',
  flag: 'bg-flag text-white hover:bg-flag-hover',
  'flag-quiet': 'text-flag ring-1 ring-inset ring-flag/25 hover:bg-flag-soft',
}

const SIZES = {
  sm: 'h-7 px-2.5 text-[12px] gap-1.5',
  md: 'h-8 px-3 text-[13px] gap-1.5',
  lg: 'h-10 px-4 text-sm gap-2',
}

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      {children}
      {IconRight && !loading && <IconRight className="h-3.5 w-3.5 shrink-0" aria-hidden />}
    </button>
  )
})

export function IconButton({ icon: Icon, label, className, variant = 'ghost', size = 'md', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors duration-150',
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  )
}
