import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PAGE_SIZES } from '@/lib/constants'

function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export function Pagination({ meta, onPageChange, onLimitChange, className }) {
  if (!meta || meta.total === 0) return null

  const { page, pages, total, limit } = meta
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <p className="font-mono text-xs text-ink-faint">
          {from}-{to} of {total}
        </p>
        {onLimitChange && (
          <label className="flex items-center gap-1.5 text-xs text-ink-faint">
            <span className="sr-only sm:not-sr-only">Rows</span>
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-7 rounded-md border border-line-strong bg-surface px-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.has_prev}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-ink-muted transition hover:bg-ink/5 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {pageWindow(page, pages).map((entry, index) =>
          entry === '...' ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-ink-faint">
              ...
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 font-mono text-xs transition',
                entry === page
                  ? 'bg-ink text-white'
                  : 'text-ink-muted hover:bg-ink/5 hover:text-ink',
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.has_next}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-ink-muted transition hover:bg-ink/5 disabled:pointer-events-none disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </div>
  )
}
