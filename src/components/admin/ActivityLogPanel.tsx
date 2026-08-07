import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Crown,
  Eye,
  Flag,
  PenLine,
  RefreshCw,
  ScrollText,
  Send,
  TimerOff,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { formatClock } from '@/components/admin/admin-utils'
import type { AdminLogEntry } from '@/components/admin/admin-utils'
import { useLang, useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { activityMessage } from '@/lib/i18n/shared'
import { cn } from '@/lib/utils'

function iconFor(entry: AdminLogEntry): LucideIcon {
  switch (entry.kind) {
    case 'deal_sent':
      return Send
    case 'deal_accepted':
      return Check
    case 'deal_cancelled':
      return X
    case 'game_ended':
      return Crown
    case 'game_started':
    case 'round_started':
    case 'round_closed':
      return RefreshCw
    case 'offers_expired':
      return TimerOff
    case 'adjust_score':
    case 'override_mission':
      return PenLine
    case 'espionage_peek':
    case 'assistant_set':
      return Eye
    case 'bloc_chosen':
      return Users
    case 'room_created':
    case 'player_joined':
    case 'seat_claimed':
    case 'seat_released':
    case 'countries_updated':
      return Flag
    default:
      return ScrollText
  }
}

/** Teacher's own manual actions — highlighted gold in the feed. */
const MANUAL_KINDS = new Set(['adjust_score', 'override_mission', 'seat_released', 'countries_updated', 'assistant_set'])

const PAGE = 100

export interface ActivityLogPanelProps {
  /** Chronological log (as returned by the API). */
  log: AdminLogEntry[]
  projector: boolean
}

/** Auditable reverse-chronological activity log; manual edits highlighted gold. */
export default function ActivityLogPanel({ log, projector }: ActivityLogPanelProps) {
  const { lang } = useLang()
  const t = useStrings(adminStrings).activity
  const [shown, setShown] = useState(PAGE)

  const newestFirst = useMemo(() => [...log].reverse(), [log])
  const visible = newestFirst.slice(0, shown)

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4">
        <h2 className="font-display text-2xl font-semibold text-ink">{t.title}</h2>
        <span className="text-sm font-semibold text-ink-soft">{t.subtitle}</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={t.emptyTitle}
          body={t.emptyBody}
          className="py-8"
        />
      ) : (
        <>
          <ol className="max-h-[560px] space-y-1 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {visible.map((entry) => {
                const Icon = iconFor(entry)
                const manual = MANUAL_KINDS.has(entry.kind)
                return (
                  <motion.li
                    key={entry.id}
                    layout="position"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2',
                      manual ? 'border-gold/50 bg-gold-soft/60' : 'border-transparent',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        manual ? 'bg-gold-soft text-gold-ink ring-1 ring-gold' : 'bg-paper-deep text-ink-soft',
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span
                      className={cn(
                        'flex-1 leading-6 text-ink',
                        projector ? 'text-lg' : 'text-base',
                        manual && 'font-bold',
                      )}
                    >
                      {activityMessage(entry.kind, entry.params, lang) ?? entry.message}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-semibold text-ink-faint">
                      R{entry.round} · {formatClock(entry.createdAt)}
                    </span>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ol>
          {newestFirst.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="mt-3 w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm font-extrabold text-ink transition-colors hover:bg-paper-deep"
            >
              {t.showMore(newestFirst.length - shown)}
            </button>
          )}
        </>
      )}
    </section>
  )
}
