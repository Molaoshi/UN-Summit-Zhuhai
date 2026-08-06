import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { DEAL_TYPES } from '@/lib/game-ui'
import type { DealType } from '@/lib/game-ui'
import { cn } from '@/lib/utils'

export interface PowerChipProps {
  /** Power card name, e.g. "Nuclear", "High-Speed Rail", or "Espionage". */
  name: string
  dealType?: DealType
  /** Espionage cards get a dashed gold border. */
  espionage?: boolean
  selectable?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
}

/** Chip representing one power card. */
export default function PowerChip({
  name,
  dealType = 'energy',
  espionage = false,
  selectable = false,
  selected = false,
  onClick,
  className,
}: PowerChipProps) {
  const meta = DEAL_TYPES[dealType]
  const Icon = espionage ? Eye : meta.icon
  const color = espionage ? '#C49A33' : meta.color
  return (
    <motion.span
      whileHover={selectable ? { y: -2 } : undefined}
      whileTap={selectable ? { scale: 0.97 } : undefined}
      onClick={selectable ? onClick : undefined}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={selectable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 overflow-hidden rounded-xl border bg-card py-1 pl-[3px] pr-3 text-sm font-bold text-ink',
        selectable && 'cursor-pointer',
        selected && 'bg-gold-soft ring-2 ring-ink',
        className,
      )}
      style={{
        borderColor: espionage ? '#C49A33' : `${color}66`,
        borderStyle: espionage ? 'dashed' : 'solid',
      }}
    >
      <span
        className="flex h-6 w-[18px] items-center justify-center rounded-l-[9px]"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        <Icon className="h-3.5 w-3.5 text-paper" />
      </span>
      {name}
    </motion.span>
  )
}
