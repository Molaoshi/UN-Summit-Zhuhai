import { STATUSES } from '@/lib/game-ui'
import type { StatusKey } from '@/lib/game-ui'
import { cn } from '@/lib/utils'

export interface StatusChipProps {
  status: StatusKey
  className?: string
}

/** Colored dot + uppercase Micro label — status is never color alone. */
export default function StatusChip({ status, className }: StatusChipProps) {
  const meta = STATUSES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-[0.10em]',
        className,
      )}
      style={{ backgroundColor: meta.soft, color: meta.color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
      {meta.label}
    </span>
  )
}
