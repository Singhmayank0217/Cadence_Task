import { Search, X } from 'lucide-react'
import { Input } from './Input'

export function SearchInput({ value, onChange, onClear, placeholder = 'Search', className }) {
  return (
    <div className={className}>
      <div className="relative">
        <Input
          icon={Search}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint transition hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
