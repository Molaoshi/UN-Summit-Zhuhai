import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ActionPipsProps {
  /** Deal actions remaining this round. */
  remaining: number
  total?: number
  className?: string
}

/** Three circles showing deal actions left, always with a text label. */
export default function ActionPips({ remaining, total = 3, className }: ActionPipsProps) {
  const left = Math.max(0, Math.min(total, remaining))
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: i * 0.08 }}
            className={cn('h-3 w-3 rounded-full border', i < left ? 'border-gold bg-gold' : 'border-hairline bg-transparent')}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-ink-soft">
        Deal actions left: {left}/{total}
      </span>
    </div>
  )
}
