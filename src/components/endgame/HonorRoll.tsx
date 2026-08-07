import { motion } from 'framer-motion'
import { Globe, Lock, Star } from 'lucide-react'
import { useLang, useStrings } from '@/lib/i18n'
import { endgameStrings } from '@/lib/i18n/endgame'
import { countryName } from '@/lib/i18n/shared'
import type { FinalMission, ScoreRow } from './types'

const SLOTS: { slot: FinalMission['slot']; icon: typeof Globe }[] = [
  { slot: 'public', icon: Globe },
  { slot: 'private', icon: Lock },
  { slot: 'bonus', icon: Star },
]

const R = 26
const CIRC = 2 * Math.PI * R

/** Section 3 — mission honor roll: who completed what, per mission slot. */
export default function HonorRoll({ scoreboard }: { scoreboard: ScoreRow[] }) {
  const { lang } = useLang()
  const t = useStrings(endgameStrings).honorRoll
  return (
    <section
      aria-labelledby="honor-roll-title"
      className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-7"
    >
      <h2 id="honor-roll-title" className="font-display text-[26px] leading-8 font-semibold text-ink">
        {t.title}
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
        {SLOTS.map(({ slot, icon: Icon }) => {
          const completers = scoreboard.filter(
            (r) => r.missions.find((m) => m.slot === slot)?.status === 'completed',
          )
          const total = scoreboard.length
          const frac = total > 0 ? completers.length / total : 0
          return (
            <div key={slot} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0">
                  <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                    <circle cx="32" cy="32" r={R} fill="none" stroke="#E3DAC6" strokeWidth="6" />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r={R}
                      fill="none"
                      stroke="#C49A33"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                      initial={{ strokeDashoffset: CIRC }}
                      whileInView={{ strokeDashoffset: CIRC * (1 - frac) }}
                      viewport={{ amount: 0.3, once: true }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-ink">
                    {completers.length}/{total}
                  </span>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-base font-extrabold text-ink">
                    <Icon className="h-4 w-4 text-ink-soft" aria-hidden />
                    {t.slots[slot]}
                  </p>
                  <p className="text-sm font-semibold text-ink-soft">
                    {t.completed(completers.length, total)}
                  </p>
                </div>
              </div>
              {completers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {completers.map((r, i) => (
                    <motion.span
                      key={r.country}
                      initial={{ scale: 0.6, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ amount: 0.3, once: true }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.2 + i * 0.03 }}
                      title={countryName(r.country, lang)}
                      className="inline-flex items-center gap-1 rounded-full border border-hairline bg-paper px-2 py-1 text-xs font-bold text-ink"
                    >
                      <span aria-hidden>{r.flag}</span>
                      {countryName(r.country, lang)}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold text-ink-faint">{t.none}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
