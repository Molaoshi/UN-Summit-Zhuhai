import { useStrings } from '@/lib/i18n'
import { sharedStrings } from '@/lib/i18n/shared'
import { STATUSES } from '@/lib/game-ui'
import type { StatusKey } from '@/lib/game-ui'
import { cn } from '@/lib/utils'

export interface StatusChipProps {
  status: StatusKey
  className?: string
}

const SHARED_KEY: Record<StatusKey, keyof typeof sharedStrings.en.status> = {
  completed: 'completed',
  ontrack: 'on_track',
  atrisk: 'at_risk',
  failed: 'failed',
  pending: 'pending',
}

/** Bilingual StatusChip: shared colors/dot, label from sharedStrings. */
export default function StatusChip({ status, className }: StatusChipProps) {
  const t = useStrings(sharedStrings)
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
      {t.status[SHARED_KEY[status]]}
    </span>
  )
}
