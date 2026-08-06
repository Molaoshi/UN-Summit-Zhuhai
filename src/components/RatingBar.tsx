import { DEAL_TYPES } from '@/lib/game-ui'
import type { DealType } from '@/lib/game-ui'
import { cn } from '@/lib/utils'

export interface RatingBarProps {
  dealType: DealType
  /** 0–10 asset rating. */
  value: number
  className?: string
}

/** 10-segment asset rating bar with numeral. */
export default function RatingBar({ dealType, value, className }: RatingBarProps) {
  const meta = DEAL_TYPES[dealType]
  const v = Math.max(0, Math.min(10, Math.round(value)))
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="img"
      aria-label={`${meta.asset} rating ${v} of 10`}
    >
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="h-3 w-[3px] rounded-full"
            style={{ backgroundColor: i < v ? meta.color : '#E3DAC6' }}
          />
        ))}
      </div>
      <span className="font-mono text-sm font-semibold text-ink">{v}</span>
    </div>
  )
}
