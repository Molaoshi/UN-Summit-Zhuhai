import { motion } from 'framer-motion'
import { Globe, Lock, Star } from 'lucide-react'
import StatusChip from '@/components/play/StatusChip'
import { useStrings } from '@/lib/i18n'
import { playStrings } from '@/lib/i18n/play'
import type { StatusKey } from '@/lib/game-ui'
import { cn } from '@/lib/utils'

export interface MissionCardProps {
  kind: 'public' | 'private' | 'bonus'
  /** English mission text (always shown, primary). */
  text: string
  /** Simplified Chinese mission text (always shown below, ink-soft). */
  textZh?: string
  status: StatusKey
  /** e.g. "1 of 2 deals" / "已完成 1/2 个协议" */
  progressText?: string
  points?: number
  /** Show the CONFIDENTIAL watermark (only on the owner's screen). */
  showWatermark?: boolean
  className?: string
}

const KIND_ICONS = { public: Globe, private: Lock, bonus: Star } as const

/**
 * Player-dashboard mission card. Mission text is ALWAYS bilingual (English
 * primary, Chinese below); eyebrow / status / progress follow the toggle.
 */
export default function MissionCard({
  kind,
  text,
  textZh,
  status,
  progressText,
  points = 10,
  showWatermark,
  className,
}: MissionCardProps) {
  const s = useStrings(playStrings)
  const Icon = KIND_ICONS[kind]
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
        {s.missionEyebrows[kind]}
      </div>
      <p className="text-lg leading-[30px] text-ink">{text}</p>
      {textZh && textZh !== text && (
        <p className="mt-1 text-base leading-[26px] text-ink-soft">{textZh}</p>
      )}
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
