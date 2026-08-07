import { motion } from 'framer-motion'
import { Crown, Sparkles } from 'lucide-react'
import { COUNTRY_BY_NAME } from '@contracts/game-data'
import CountryChip from '@/components/CountryChip'
import { blocKeyFor, customBlocNames, STARTING_BLOC_META } from '@/components/lobby/bloc-meta'
import { BLOCS } from '@/lib/game-ui'
import { cn } from '@/lib/utils'
import type { FinalBloc } from './types'

const SPRING = { type: 'spring', stiffness: 380, damping: 22 } as const
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** Word-by-word typewriter fade for the bloc shift note. */
function ShiftNote({ bloc, delay }: { bloc: FinalBloc; delay: number }) {
  const isStarting = STARTING_BLOC_META.some((b) => b.name === bloc.name)
  const memberSet = new Set(bloc.members)
  const gained = bloc.members.filter((m) => COUNTRY_BY_NAME[m]?.startingBloc !== bloc.name)
  const lost = isStarting
    ? Object.values(COUNTRY_BY_NAME)
        .filter((c) => c.startingBloc === bloc.name && !memberSet.has(c.name))
        .map((c) => c.name)
    : []
  const flags = (names: string[]) => names.map((n) => COUNTRY_BY_NAME[n]?.flag ?? n).join(' ')
  const text = isStarting
    ? `Started as: ${bloc.name}${gained.length ? ` · Gained: ${flags(gained)}` : ''}${lost.length ? ` · Lost: ${flags(lost)}` : ''}`
    : `Founded during the summit${gained.length ? ` · Members: ${flags(gained)}` : ''}`
  const words = text.split(' ')
  return (
    <p className="mt-3 text-sm font-semibold text-ink-soft">
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: delay + i * 0.04 }}
          className="inline-block"
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </p>
  )
}

export interface FinalBlocsProps {
  blocs: FinalBloc[]
  rounds: number
}

/** Section 1 — "The New World Order": final blocs, biggest first. */
export default function FinalBlocs({ blocs, rounds }: FinalBlocsProps) {
  const customs = customBlocNames(blocs.map((b) => b.name))
  return (
    <section aria-labelledby="final-blocs-title">
      <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink">
        Final blocs · Round {rounds}
      </p>
      <h2 id="final-blocs-title" className="mt-1 font-display text-[26px] leading-8 font-semibold text-ink md:text-3xl">
        Where the alliances ended
      </h2>

      <div className="mt-5 flex flex-col gap-5">
        {blocs.map((bloc, bi) => {
          const key = blocKeyFor(bloc.name, customs)
          const isCustom = customs.includes(bloc.name)
          const base = bi * 0.35
          return (
            <motion.article
              key={bloc.name}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: base }}
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card md:p-6',
                bloc.isBiggest ? 'border-[3px] border-gold' : 'border-hairline',
              )}
            >
              {bloc.isBiggest && (
                <motion.img
                  src="/laurel-badge.svg"
                  alt=""
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.2 }}
                  transition={{ duration: 0.6, ease: EASE, delay: base + 0.5 }}
                  className="pointer-events-none absolute -right-6 -top-6 h-40 w-40"
                  aria-hidden
                />
              )}

              <div className="relative flex flex-wrap items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: BLOCS[key].color }}
                  aria-hidden
                />
                <h3 className="font-display text-2xl font-semibold text-ink md:text-3xl">{bloc.name}</h3>
                {isCustom && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-gold-ink">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Founded by a delegate
                  </span>
                )}
                {bloc.isBiggest && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...SPRING, delay: base + 0.45 }}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink"
                  >
                    <Crown className="h-4 w-4" aria-hidden />
                    Biggest bloc — {bloc.size} members
                  </motion.span>
                )}
              </div>

              <div className="relative mt-4 flex flex-wrap gap-2">
                {bloc.members.map((m, mi) => (
                  <motion.span
                    key={m}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...SPRING, delay: base + 0.25 + mi * 0.06 }}
                  >
                    <CountryChip
                      flag={COUNTRY_BY_NAME[m]?.flag ?? '🏳️'}
                      name={m}
                      className="min-h-12 px-4 text-base"
                    />
                  </motion.span>
                ))}
              </div>

              <ShiftNote bloc={bloc} delay={base + 0.3 + bloc.members.length * 0.06} />
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
