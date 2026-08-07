import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import { cn } from '@/lib/utils'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  /** Short sentence under the title. */
  body?: string
  /** Bullet list of what will happen. */
  effects?: string[]
  confirmLabel: string
  tone?: 'primary' | 'danger'
  icon?: LucideIcon
  loading?: boolean
  onConfirm: () => void
}

/** Two-step confirm (button → this dialog) for every destructive admin action. */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  body,
  effects,
  confirmLabel,
  tone = 'primary',
  icon: Icon,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const danger = tone === 'danger'
  const HeaderIcon = Icon ?? (danger ? AlertTriangle : undefined)
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div
        className={cn(
          '-mx-5 mb-4 -mt-2 border-b px-5 pb-4 lg:-mx-7 lg:px-7',
          danger ? 'border-status-failed/30 bg-status-failed-soft/60' : 'border-hairline',
        )}
      >
        {HeaderIcon && (
          <div
            className={cn(
              'mb-2 inline-flex h-11 w-11 items-center justify-center rounded-full',
              danger ? 'bg-status-failed-soft text-status-failed' : 'bg-gold-soft text-gold-ink',
            )}
          >
            <HeaderIcon className="h-5 w-5" aria-hidden />
          </div>
        )}
        {body && <p className="text-lg leading-7 text-ink">{body}</p>}
      </div>
      {effects && effects.length > 0 && (
        <ul className="mb-5 space-y-2">
          {effects.map((effect) => (
            <li key={effect} className="flex items-start gap-2 text-base text-ink-soft">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
              {effect}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-hairline bg-paper px-5 py-3 text-base font-bold text-ink transition-colors hover:bg-paper-deep"
        >
          Cancel
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={cn(
            'rounded-xl px-5 py-3 text-base font-extrabold shadow-card transition-colors disabled:opacity-60',
            danger
              ? 'bg-status-failed text-paper hover:bg-status-failed/90'
              : 'bg-ink text-paper hover:bg-ink/90',
          )}
        >
          {loading ? 'Working…' : confirmLabel}
        </motion.button>
      </div>
    </BottomSheet>
  )
}
