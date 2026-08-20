import { cn } from '@/lib/cn'

export function Panel({ className, children, ...props }) {
  return (
    <section className={cn('panel', className)} {...props}>
      {children}
    </section>
  )
}

export function PanelHeader({ eyebrow, title, meta, action, className }) {
  return (
    <header className={cn('panel-header', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
        <h2 className="text-[14px] font-semibold leading-snug text-ink">{title}</h2>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta && <span className="font-mono text-xs text-ink-faint">{meta}</span>}
        {action}
      </div>
    </header>
  )
}
