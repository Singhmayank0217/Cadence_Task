import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Config-driven table. Pass `columns` and `rows` and every list in the app
 * looks and behaves the same: sticky header, sortable headers, row click,
 * and a horizontal scroll container on small screens.
 */
export function Table({
  columns,
  rows,
  rowKey = (row) => row.id,
  onRowClick,
  sortBy,
  sortDir,
  onSort,
  className,
  emptyState,
}) {
  if (!rows?.length && emptyState) return emptyState

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-raised">
            {columns.map((column) => {
              const isSorted = sortBy === column.sortKey
              const SortIcon = !isSorted ? ChevronsUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'col-head',
                    column.align === 'right' && 'text-right',
                    column.className,
                  )}
                >
                  {column.sortKey && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey)}
                      className={cn(
                        // Preflight sets `text-transform: none` on buttons, so
                        // the casing from .col-head has to be reapplied here or
                        // sortable headers read differently to fixed ones.
                        'inline-flex items-center gap-1 rounded uppercase tracking-[0.08em] transition-colors hover:text-ink',
                        isSorted && 'text-ink',
                      )}
                    >
                      {column.header}
                      <SortIcon className="h-3 w-3" aria-hidden />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === 'Enter') onRowClick(row)
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                'group bg-surface transition-colors',
                onRowClick && 'cursor-pointer hover:bg-raised focus:bg-raised focus:outline-none',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('data-cell', column.align === 'right' && 'text-right', column.cellClassName)}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
