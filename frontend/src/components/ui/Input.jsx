import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

const base =
  'w-full rounded-lg border bg-surface px-3 text-sm text-ink transition placeholder:text-ink-faint ' +
  'disabled:cursor-not-allowed disabled:bg-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20'

export const Input = forwardRef(function Input({ className, invalid, icon: Icon, ...props }, ref) {
  const field = (
    <input
      ref={ref}
      className={cn(
        base,
        'h-9',
        Icon && 'pl-9',
        invalid ? 'border-flag focus:border-flag focus:ring-flag/20' : 'border-line-strong',
        className,
      )}
      {...props}
    />
  )
  if (!Icon) return field
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
      {field}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        base,
        'resize-y py-2 leading-relaxed',
        invalid ? 'border-flag focus:border-flag focus:ring-flag/20' : 'border-line-strong',
        className,
      )}
      {...props}
    />
  )
})
