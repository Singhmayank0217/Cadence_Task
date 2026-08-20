import { cn } from '@/lib/cn'

export function PageHeader({ eyebrow, title, description, actions, className, children }) {
  return (
    <header className={cn('mb-5', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h1 className="text-xl font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[22px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
