import { useState } from 'react'
import { motion } from 'framer-motion'
import { Timer } from 'lucide-react'
import { formatClock, roundSummaries } from '@/components/admin/admin-utils'
import type { AdminState } from '@/components/admin/admin-utils'
import { useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { cn } from '@/lib/utils'

const PLAN_KEY = 'summit:plan-rounds'

/** Round pacing card: suggested pace track + per-round history. */
export default function PacingCard({ state }: { state: AdminState }) {
  const t = useStrings(adminStrings).pacing
  const [plan, setPlan] = useState<number>(() => {
    const raw = Number(localStorage.getItem(PLAN_KEY))
    return raw === 4 || raw === 5 || raw === 6 ? raw : 6
  })
  const summaries = roundSummaries(state)
  const { currentRound, status } = state.room

  const choosePlan = (n: number) => {
    setPlan(n)
    localStorage.setItem(PLAN_KEY, String(n))
  }

  // Suggested end time for the current round: round begin + (150 min / plan).
  const current = summaries.find((s) => s.round === currentRound)
  const perRoundMs = (2.5 * 60 * 60 * 1000) / plan
  const suggestion =
    status === 'playing' && current?.beganAt
      ? t.suggestEnd(currentRound, formatClock(new Date(current.beganAt.getTime() + perRoundMs)))
      : t.suggestPace

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <div className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
        {t.kicker}
      </div>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{t.title}</h2>

      {/* Round track dots */}
      <div className="mt-4 flex items-center gap-2.5" role="list" aria-label={t.roundTrack}>
        {Array.from({ length: 6 }, (_, i) => {
          const round = i + 1
          const done = status === 'ended' || round < currentRound
          const currentDot = status === 'playing' && round === currentRound
          return (
            <motion.span
              key={round}
              role="listitem"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22, delay: i * 0.05 }}
              className="relative flex h-9 w-9 items-center justify-center"
              title={t.roundState(round, done ? 'done' : currentDot ? 'current' : null)}
            >
              {currentDot && (
                <motion.span
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.25, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-gold"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-semibold',
                  done
                    ? 'bg-gold text-ink'
                    : currentDot
                      ? 'bg-gold-soft text-gold-ink ring-1 ring-gold'
                      : 'border border-hairline text-ink-faint',
                )}
              >
                {round}
              </span>
            </motion.span>
          )
        })}
        <label className="ml-auto flex items-center gap-2 text-sm font-bold text-ink-soft">
          {t.plan}
          <select
            value={plan}
            onChange={(e) => choosePlan(Number(e.target.value))}
            className="rounded-lg border border-hairline bg-paper px-2 py-1.5 font-mono text-sm font-semibold text-ink"
            aria-label={t.planAria}
          >
            {[4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {t.planOption(n)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-4 flex items-center gap-2 text-lg leading-7 text-ink">
        <Timer className="h-5 w-5 shrink-0 text-gold-ink" aria-hidden />
        {suggestion}
      </p>

      {/* Round history */}
      {summaries.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper-deep text-left text-xs font-extrabold uppercase tracking-[0.08em] text-ink-soft">
                <th className="px-3 py-2">{t.history.round}</th>
                <th className="px-3 py-2">{t.history.dealsSigned}</th>
                <th className="px-3 py-2">{t.history.duration}</th>
                <th className="px-3 py-2">{t.history.endedAt}</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.round} className="border-t border-hairline">
                  <td className="px-3 py-2 font-mono font-semibold text-ink">R{s.round}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-ink">{s.dealsSigned}</td>
                  <td className="px-3 py-2 text-ink-soft">
                    {s.beganAt && s.endedAt
                      ? t.duration(s.endedAt.getTime() - s.beganAt.getTime())
                      : s.round === currentRound && status === 'playing'
                        ? t.history.inProgress
                        : '—'}
                  </td>
                  <td className="px-3 py-2 font-mono text-ink-soft">
                    {s.endedAt ? formatClock(s.endedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
