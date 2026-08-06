import { motion } from 'framer-motion'
import { Globe, Lock, Star } from 'lucide-react'
import StatusChip from '@/components/StatusChip'
import type { StatusKey } from '@/lib/game-ui'
import { cn } from '@/lib/utils'

export interface MissionCardProps {
  kind: 'public' | 'private' | 'bonus'
  text: string
  status: StatusKey
  /** e.g. "1 of 2 deals" */
  progressText?: string
  points?: number
  /** Show the CONFIDENTIAL watermark (only on the owner's screen). */
  showWatermark?: boolean
  className?: string
}

const KIND_META = {
  public: { eyebrow: 'PUBLIC MISSION · VISIBLE TO ALL', icon: Globe },
  private: { eyebrow: 'PRIVATE MISSION · ONLY YOU', icon: Lock },
  bonus: { eyebrow: 'BONUS MISSION · ONLY YOU', icon: Star },
} as const

/** Dossier card for a mission. */
export default function MissionCard({
  kind,
  text,
  status,
  progressText,
  points = 10,
  showWatermark,
  className,
}: MissionCardProps) {
  const meta = KIND_META[kind]
  const Icon = meta.icon
  const confidential = kind !== 'public'
  return (
    <motion.article
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-hairline p-5 shadow-card md:p-6',
        confidential ? 'bg-paper-deep' : 'bg-card',
        confidential && showWatermark && 'watermark-confidential',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {meta.eyebrow}
      </div>
      <p className="text-lg leading-[30px] text-ink">{text}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusChip status={status} />
        {progressText && <span className="text-sm font-semibold text-ink-soft">{progressText}</span>}
        <motion.span
          key={status}
          initial={status === 'completed' ? { rotateY: 90 } : false}
          animate={{ rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-soft text-[11px] font-extrabold text-gold-ink ring-1 ring-gold"
          title={`${points} points`}
        >
          +{points}
        </motion.span>
      </div>
    </motion.article>
  )
}
