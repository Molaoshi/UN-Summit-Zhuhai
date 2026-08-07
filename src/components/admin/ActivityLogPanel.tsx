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
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { formatClock } from '@/components/admin/admin-utils'
import type { AdminLogEntry } from '@/components/admin/admin-utils'
import { cn } from '@/lib/utils'

function iconFor(entry: AdminLogEntry): LucideIcon {
  const msg = entry.message.toLowerCase()
  switch (entry.kind) {
    case 'deal':
      if (msg.includes('signed')) return Check
      if (msg.includes('rejected') || msg.includes('cancelled')) return X
      return Send
    case 'lobby':
    case 'room':
      return Flag
    case 'game':
      if (msg.includes('ended')) return Crown
      return RefreshCw
    case 'admin':
      return PenLine
    case 'espionage':
      return Eye
    case 'bloc':
      return Users
    default:
      return ScrollText
  }
}

const PAGE = 100

export interface ActivityLogPanelProps {
  /** Chronological log (as returned by the API). */
  log: AdminLogEntry[]
  projector: boolean
}

/** Auditable reverse-chronological activity log; manual edits highlighted gold. */
export default function ActivityLogPanel({ log, projector }: ActivityLogPanelProps) {
  const [shown, setShown] = useState(PAGE)

  const newestFirst = useMemo(() => [...log].reverse(), [log])
  const visible = newestFirst.slice(0, shown)

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Activity log</h2>
        <span className="text-sm font-semibold text-ink-soft">
          Every action is recorded — gold rows are your own overrides.
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nothing yet"
          body="Claims, offers, signatures, round changes and score edits appear here."
          className="py-8"
        />
      ) : (
        <>
          <ol className="max-h-[560px] space-y-1 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {visible.map((entry) => {
                const Icon = iconFor(entry)
                const manual = entry.kind === 'admin'
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
                      {entry.message}
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
              Show more ({newestFirst.length - shown} older)
            </button>
          )}
        </>
      )}
    </section>
  )
}
