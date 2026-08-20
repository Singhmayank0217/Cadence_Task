import { cn } from '@/lib/cn'

/** Label + hint + error wrapper shared by every form control. */
export function Field({ label, htmlFor, hint, error, required, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-flag">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-flag">{error}</p>
      ) : (
        hint && <p className="text-xs text-ink-faint">{hint}</p>
      )}
    </div>
  )
}
