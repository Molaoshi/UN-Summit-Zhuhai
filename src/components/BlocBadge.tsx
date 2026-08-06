import { AnimatePresence, motion } from 'framer-motion'
import { BLOCS } from '@/lib/game-ui'
import type { BlocKey } from '@/lib/game-ui'
import { cn } from '@/lib/utils'

export interface BlocBadgeProps {
  bloc: BlocKey
  /** Override label (e.g. player-founded custom bloc name). */
  name?: string
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

/** Pill: 8px colored dot + bloc name on the bloc's soft fill. */
export default function BlocBadge({ bloc, name, size = 'md', showIcon = false, className }: BlocBadgeProps) {
  const meta = BLOCS[bloc]
  const label = name ?? meta.label
  const Icon = meta.icon
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={`${bloc}-${label}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-bold',
          size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-sm',
          className,
        )}
        style={{ backgroundColor: meta.soft, color: meta.color }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
        {showIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />}
        {label}
      </motion.span>
    </AnimatePresence>
  )
}
