import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, ChevronDown, Crown, Users } from 'lucide-react'
import BlocBadge from '@/components/BlocBadge'
import EmptyState from '@/components/EmptyState'
import {
  blocKeyFor,
  blocMembershipAtRound,
  countryFlag,
  countryStartingBloc,
} from '@/components/admin/admin-utils'
import type { AdminState } from '@/components/admin/admin-utils'
import { cn } from '@/lib/utils'

export interface BlocMonitorProps {
  state: AdminState
  customBlocs: string[]
  started: boolean
}

/** Live bloc monitor: current blocs, biggest-bloc crown, defection marks, history. */
export default function BlocMonitor({ state, customBlocs, started }: BlocMonitorProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [openRound, setOpenRound] = useState<number | null>(null)

  const groups = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const c of state.countries) {
      map.set(c.bloc, [...(map.get(c.bloc) ?? []), c.country])
    }
    return [...map.entries()]
      .map(([name, members]) => ({ name, members: members.sort() }))
      .sort((a, b) => b.members.length - a.members.length || a.name.localeCompare(b.name))
  }, [state.countries])

  const biggestSize = groups[0]?.members.length ?? 0

  const historyRounds = useMemo(() => {
    const rounds = [...new Set(state.blocHistory.map((r) => r.round))].sort((a, b) => b - a)
    return rounds.map((round) => {
      const atRound = blocMembershipAtRound(state.blocHistory, round)
      const blocs = [...atRound.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      return { round, blocs }
    })
  }, [state.blocHistory])

  if (!started) {
    return (
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold text-ink">Blocs</h2>
        <EmptyState
          icon={Users}
          title="Starting blocs"
          body="Countries begin in their three starting blocs. Alliance shifts appear here at each round end."
          className="py-8"
        />
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <h2 className="mb-4 font-display text-2xl font-semibold text-ink">Blocs</h2>
      <div className="space-y-4">
        {groups.map((g) => {
          const isBiggest = g.members.length === biggestSize && groups.length > 1
          return (
            <motion.div
              key={g.name}
              layout="position"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'rounded-xl border p-4',
                isBiggest ? 'border-gold bg-gold-soft/40' : 'border-hairline bg-paper',
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <BlocBadge bloc={blocKeyFor(g.name, customBlocs)} name={g.name} size="md" showIcon />
                <span className="text-lg font-extrabold text-ink">
                  {g.members.length} {g.members.length === 1 ? 'member' : 'members'}
                </span>
                {isBiggest && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-extrabold text-gold-ink ring-1 ring-gold"
                  >
                    <Crown className="h-3.5 w-3.5" aria-hidden />
                    Biggest bloc
                  </motion.span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.members.map((country) => {
                  const defected = countryStartingBloc(country) !== g.name
                  return (
                    <motion.span
                      key={country}
                      layoutId={`bloc-chip-${country}`}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-sm font-bold text-ink"
                    >
                      <span aria-hidden>{countryFlag(country)}</span>
                      {country}
                      {defected && (
                        <span title={`Started in ${countryStartingBloc(country)}`}>
                          <ArrowLeftRight className="h-3.5 w-3.5 text-gold-ink" aria-hidden />
                        </span>
                      )}
                    </motion.span>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bloc history accordion */}
      {historyRounds.length > 0 && (
        <div className="mt-5 border-t border-hairline pt-4">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
            className="flex w-full items-center justify-between text-sm font-extrabold uppercase tracking-[0.10em] text-ink-soft transition-colors hover:text-ink"
          >
            Bloc history ({historyRounds.length} {historyRounds.length === 1 ? 'round' : 'rounds'})
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', historyOpen && 'rotate-180')}
              aria-hidden
            />
          </button>
          {historyOpen && (
            <div className="mt-3 space-y-2">
              {historyRounds.map(({ round, blocs }) => (
                <div key={round} className="rounded-xl border border-hairline">
                  <button
                    type="button"
                    onClick={() => setOpenRound((r) => (r === round ? null : round))}
                    aria-expanded={openRound === round}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-bold text-ink hover:bg-paper-deep/60"
                  >
                    Round {round} → {blocs.length} blocs · {blocs.map(([, m]) => m.length).join('/')}
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', openRound === round && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                  {openRound === round && (
                    <div className="space-y-2 border-t border-hairline px-3 py-2.5">
                      {blocs.map(([name, members]) => (
                        <div key={name} className="flex flex-wrap items-center gap-2">
                          <BlocBadge bloc={blocKeyFor(name, customBlocs)} name={name} size="sm" />
                          <span className="text-sm text-ink-soft">
                            {members
                              .map((m) => `${countryFlag(m)} ${m}`)
                              .join(' · ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
