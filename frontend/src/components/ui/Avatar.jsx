import { useState } from 'react'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-11 w-11 text-sm',
}

/**
 * Six muted tints, picked from the person's name so the same face is always the
 * same colour. Initials rather than a generated-avatar service keeps the app
 * working offline and stops it looking like a demo.
 */
const TINTS = [
  'bg-[#DDE0F5] text-[#2B36C4]',
  'bg-[#E2EDE7] text-[#2C6149]',
  'bg-[#F4E5E2] text-[#B23A2E]',
  'bg-[#F2E9D9] text-[#96650B]',
  'bg-[#E3E5E8] text-[#3F4650]',
  'bg-[#E7E3EE] text-[#59468C]',
]

function tintFor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997
  return TINTS[hash % TINTS.length]
}

export function Avatar({ user, size = 'sm', className }) {
  const [failed, setFailed] = useState(false)
  const name = user?.name ?? 'Unassigned'
  const showImage = user?.avatar_url && !failed

  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold',
        showImage ? 'bg-paper ring-1 ring-line-strong' : tintFor(name),
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={user.avatar_url}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        initials(name) || '?'
      )}
    </span>
  )
}

export function AvatarLabel({ user, size = 'sm', subtitle, className }) {
  if (!user) {
    return (
      <span className={cn('inline-flex items-center gap-2 text-[13px] text-ink-faint', className)}>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full border border-dashed border-line-strong',
            SIZES[size],
          )}
        >
          <span className="text-[9px]">--</span>
        </span>
        Unassigned
      </span>
    )
  }
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <Avatar user={user} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] text-ink">{user.name}</span>
        {subtitle && <span className="block truncate text-xs text-ink-faint">{subtitle}</span>}
      </span>
    </span>
  )
}
