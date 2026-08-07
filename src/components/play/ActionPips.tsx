import { motion } from 'framer-motion'
import { useStrings } from '@/lib/i18n'
import { playStrings } from '@/lib/i18n/play'
import { cn } from '@/lib/utils'

export interface ActionPipsProps {
  /** Deal actions remaining this round. */
  remaining: number
  total?: number
  className?: string
}

/** Bilingual copy of the shared ActionPips (label follows the language toggle). */
export default function ActionPips({ remaining, total = 3, className }: ActionPipsProps) {
  const s = useStrings(playStrings)
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
        {s.actionsLeft(left, total)}
      </span>
    </div>
  )
}
