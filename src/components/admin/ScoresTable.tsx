import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowUpDown, PenLine } from 'lucide-react'
import BlocBadge from '@/components/BlocBadge'
import ActionPips from '@/components/ActionPips'
import EmptyState from '@/components/EmptyState'
import ScoreAdjustSheet from '@/components/admin/ScoreAdjustSheet'
import { blocKeyFor } from '@/components/admin/admin-utils'
import type { AdminCountry } from '@/components/admin/admin-utils'
import { MAX_DEAL_ACTIONS_PER_ROUND } from '@contracts/game-data'
import { useLang, useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { blocName, countryName } from '@/lib/i18n/shared'
import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'

type SortKey = 'total' | 'dealPoints' | 'missionPoints' | 'adjustments' | 'country'

function CountUp({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value)
  const rounded = useTransform(mv, (v) => String(Math.round(v)))
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.7, ease: 'easeOut' })
    return () => controls.stop()
  }, [value, mv])
  return <motion.span className={className}>{rounded}</motion.span>
}

export interface ScoresTableProps {
  countries: AdminCountry[]
  customBlocs: string[]
  projector: boolean
  /** False before the game starts (friendly empty state instead). */
  started: boolean
}

/** Live sortable scores table — the projector centerpiece. */
export default function ScoresTable({ countries, customBlocs, projector, started }: ScoresTableProps) {
  const { lang } = useLang()
  const t = useStrings(adminStrings).scores
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [editing, setEditing] = useState<AdminCountry | null>(null)

  // Rank is always by total (gold rank chips for the top 3).
  const ranks = useMemo(() => {
    const byTotal = [...countries].sort(
      (a, b) => b.score.total - a.score.total || a.country.localeCompare(b.country),
    )
    const map = new Map<string, number>()
    byTotal.forEach((c, i) => map.set(c.country, i + 1))
    return map
  }, [countries])

  const rows = useMemo(() => {
    const sorted = [...countries].sort((a, b) => {
      let cmp: number
      if (sortKey === 'country') cmp = a.country.localeCompare(b.country)
      else if (sortKey === 'total') cmp = a.score.total - b.score.total
      else if (sortKey === 'dealPoints') cmp = a.score.dealPoints - b.score.dealPoints
      else if (sortKey === 'missionPoints') cmp = a.score.missionPoints - b.score.missionPoints
      else cmp = a.score.adjustments - b.score.adjustments
      return cmp * sortDir || a.country.localeCompare(b.country)
    })
    return sorted
  }, [countries, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1))
    else {
      setSortKey(key)
      setSortDir(key === 'country' ? 1 : -1)
    }
  }

  const headerBtn = (key: SortKey, label: string, className?: string) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className={cn(
        'inline-flex items-center gap-1 font-extrabold uppercase tracking-[0.08em]',
        sortKey === key ? 'text-ink' : 'text-ink-soft hover:text-ink',
        className,
      )}
    >
      {label}
      {sortKey === key ? (
        sortDir === -1 ? (
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
      )}
    </button>
  )

  if (!started) {
    return (
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold text-ink">{t.title}</h2>
        <EmptyState
          icon={Trophy}
          title={t.emptyTitle}
          body={t.emptyBody}
          className="py-10"
        />
      </section>
    )
  }

  const textSize = projector ? 'text-xl' : 'text-lg'
  const rowH = projector ? 'h-16' : 'h-14'

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4">
        <h2 className="font-display text-2xl font-semibold text-ink">{t.title}</h2>
        <span className="text-sm font-semibold text-ink-soft">{t.subtitle}</span>
      </div>
      <div className="max-h-[560px] overflow-auto rounded-xl border border-hairline">
        <table className="w-full min-w-[880px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-paper-deep text-left text-xs">
              <th className="w-12 px-3 py-3">#</th>
              <th className="px-3 py-3">{headerBtn('country', t.headers.country)}</th>
              <th className="px-3 py-3">{t.headers.bloc}</th>
              <th className="px-3 py-3 text-right">{headerBtn('dealPoints', t.headers.dealPts)}</th>
              <th className="px-3 py-3 text-right">{headerBtn('missionPoints', t.headers.missionPts)}</th>
              <th className="px-3 py-3 text-right">{headerBtn('adjustments', t.headers.adjust)}</th>
              <th className="px-3 py-3 text-right">{headerBtn('total', t.headers.total)}</th>
              <th className="hidden px-3 py-3 xl:table-cell">{t.headers.dealActions}</th>
              <th className="w-14 px-3 py-3">
                <span className="sr-only">{t.headers.editScore}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const rank = ranks.get(c.country) ?? 0
              const top3 = rank >= 1 && rank <= 3
              return (
                <motion.tr
                  key={c.country}
                  layout="position"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('border-t border-hairline bg-card', rowH, top3 && 'bg-gold-soft/30')}
                >
                  <td className="px-3 py-2">
                    {top3 ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft font-mono text-sm font-semibold text-gold-ink ring-1 ring-gold">
                        {rank}
                      </span>
                    ) : (
                      <span className="font-mono text-sm font-semibold text-ink-faint">{rank}</span>
                    )}
                  </td>
                  <td className={cn('px-3 py-2 font-extrabold text-ink', textSize)}>
                    <span className="mr-2" aria-hidden>
                      {c.flag}
                    </span>
                    {countryName(c.country, lang)}
                    {c.playerName && (
                      <span className="ml-2 text-sm font-semibold text-ink-soft">· {c.playerName}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <BlocBadge bloc={blocKeyFor(c.bloc, customBlocs)} name={blocName(c.bloc, lang)} size="sm" />
                  </td>
                  <td className={cn('px-3 py-2 text-right font-mono font-semibold text-ink', textSize)}>
                    {c.score.dealPoints}
                  </td>
                  <td className={cn('px-3 py-2 text-right font-mono font-semibold text-ink', textSize)}>
                    {c.score.missionPoints}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-mono font-semibold',
                      textSize,
                      c.score.adjustments > 0
                        ? 'text-status-completed'
                        : c.score.adjustments < 0
                          ? 'text-status-failed'
                          : 'text-ink-faint',
                    )}
                  >
                    {c.score.adjustments !== 0
                      ? `${c.score.adjustments > 0 ? '+' : ''}${c.score.adjustments}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <motion.span
                      key={c.score.total}
                      initial={{ backgroundColor: '#EADFBF' }}
                      animate={{ backgroundColor: 'rgba(234,223,191,0)' }}
                      transition={{ duration: 1.2 }}
                      className="inline-block rounded-lg px-2 py-0.5"
                    >
                      <CountUp
                        value={c.score.total}
                        className={cn(
                          'font-mono font-semibold text-ink',
                          projector ? 'text-3xl' : 'text-2xl',
                        )}
                      />
                    </motion.span>
                  </td>
                  <td className="hidden px-3 py-2 xl:table-cell">
                    <ActionPips
                      remaining={Math.max(0, MAX_DEAL_ACTIONS_PER_ROUND - c.actionsUsedThisRound)}
                      className="[&>span]:sr-only"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setEditing(c)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-paper text-ink-soft transition-colors hover:bg-gold-soft hover:text-gold-ink"
                      aria-label={t.adjustAria(countryName(c.country, lang))}
                      title={t.adjustAria(countryName(c.country, lang))}
                    >
                      <PenLine className="h-4 w-4" aria-hidden />
                    </motion.button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <ScoreAdjustSheet country={editing} onClose={() => setEditing(null)} />
    </section>
  )
}
