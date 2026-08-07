import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Globe, Lock, Star } from 'lucide-react'
import BlocBadge from '@/components/BlocBadge'
import { blocKeyFor, customBlocNames } from '@/components/lobby/bloc-meta'
import { useLang, useStrings } from '@/lib/i18n'
import { endgameStrings } from '@/lib/i18n/endgame'
import type { EndgameStrings } from '@/lib/i18n/endgame'
import { blocName, countryName } from '@/lib/i18n/shared'
import { cn } from '@/lib/utils'
import CountUp from './CountUp'
import type { FinalDeal, FinalMission, FinalResults, ScoreRow } from './types'

const SPRING = { type: 'spring', stiffness: 380, damping: 22 } as const
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

type S = EndgameStrings['scoreboard']

const SLOT_ICONS: Record<FinalMission['slot'], typeof Globe> = {
  public: Globe,
  private: Lock,
  bonus: Star,
}

/** "6 deals signed — 4 in-bloc (+3 each), 2 cross-bloc (+2 each)" */
function dealSummary(country: string, deals: FinalDeal[], t: S): string {
  const mine = deals.filter(
    (d) => d.status === 'accepted' && (d.initiatorCountry === country || d.targetCountry === country),
  )
  const pointsOf = (d: FinalDeal) =>
    d.initiatorCountry === country ? (d.initiatorPoints ?? 0) : (d.targetPoints ?? 0)
  const inBloc = mine.filter((d) => pointsOf(d) >= 3).length
  const cross = mine.length - inBloc
  if (mine.length === 0) return t.dealSummary.none
  return t.dealSummary.summary(mine.length, inBloc, cross)
}

/** Expandable per-country breakdown: missions, deal summary, adjustments. */
function Breakdown({ row, deals, t }: { row: ScoreRow; deals: FinalDeal[]; t: S }) {
  return (
    <div className="flex flex-col gap-2 px-4 pb-4 pt-1 md:px-6">
      {row.missions.map((m, i) => {
        const Icon = SLOT_ICONS[m.slot]
        const done = m.status === 'completed'
        return (
          <motion.div
            key={m.slot}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-xl bg-paper-deep/60 p-3"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                {t.slots[m.slot]}
                {m.overridden && <span className="ml-2 normal-case tracking-normal">· {t.teacherOverride}</span>}
              </p>
              <p className="text-base leading-6 text-ink">{m.text}</p>
              <p className="text-sm leading-5 text-ink-soft">{m.textZh}</p>
            </div>
            <span
              className={cn(
                'mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-[0.10em]',
                done ? 'bg-status-completed-soft text-status-completed' : 'bg-status-failed-soft text-status-failed',
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: done ? '#4F7A52' : '#A94438' }}
                aria-hidden
              />
              {done ? t.completed : t.failed}
            </span>
          </motion.div>
        )
      })}
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="text-sm font-semibold text-ink-soft"
      >
        {dealSummary(row.country, deals, t)}
        {row.adjustments !== 0 && <span className="ml-2">· {t.adjustments(row.adjustments)}</span>}
      </motion.p>
    </div>
  )
}

function YouChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.10em] text-gold">
      {label}
    </span>
  )
}

interface PodiumCardProps {
  row: ScoreRow
  place: 1 | 2 | 3
  deals: FinalDeal[]
  active: boolean
  isYou: boolean
  delay: number
  expanded: boolean
  onToggle: () => void
  t: S
  lang: 'en' | 'zh'
  className?: string
}

function PodiumCard({ row, place, deals, active, isYou, delay, expanded, onToggle, t, lang, className }: PodiumCardProps) {
  const seal = place === 1 ? '#C49A33' : place === 2 ? '#8B8F82' : '#B45A3C'
  return (
    <motion.article
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={
        place === 1
          ? { type: 'spring', stiffness: 320, damping: 20, delay }
          : { duration: 0.5, ease: EASE, delay }
      }
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card shadow-card',
        place === 1 ? 'border-[3px] border-gold lg:scale-[1.08]' : 'border-hairline',
        isYou && 'ring-2 ring-gold',
        className,
      )}
    >
      <div className="relative flex flex-col items-center gap-2 p-5 text-center">
        {place === 1 && (
          <img
            src="/laurel-badge.svg"
            alt=""
            className="pointer-events-none absolute left-1/2 top-2 h-36 w-36 -translate-x-1/2 opacity-[0.35]"
            aria-hidden
          />
        )}
        <span
          className="relative flex h-11 w-11 items-center justify-center rounded-full font-display text-xl font-bold text-paper"
          style={{ backgroundColor: seal }}
          aria-label={t.rankAria(place)}
        >
          {place}
        </span>
        <span className={cn('relative leading-none', place === 1 ? 'text-6xl' : 'text-5xl')} aria-hidden>
          {row.flag}
        </span>
        <h3 className="relative font-display text-2xl font-semibold text-ink">
          {countryName(row.country, lang)}
          {isYou && <span className="ml-2 align-middle"><YouChip label={t.you} /></span>}
        </h3>
        <p className="relative font-mono text-[40px] font-semibold leading-10 text-ink">
          <CountUp value={row.total} active={active} />
          <span className="ml-1 text-base font-semibold text-ink-soft">{t.pts}</span>
        </p>
        {place === 1 && (
          <motion.span
            initial={{ scale: 2.4, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            transition={{ ...SPRING, delay: delay + 0.4 }}
            className="relative rounded border-2 border-gold-ink px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink"
          >
            {t.champion}
          </motion.span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="relative mt-1 inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-ink-soft transition-colors hover:text-ink"
        >
          {t.details}
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden border-t border-hairline"
          >
            <Breakdown row={row} deals={deals} t={t} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export interface ScoreboardProps {
  results: FinalResults
  /** Animate entrances + count-ups (false = static revealed state). */
  active: boolean
  myCountry: string | null
  /** Base delay before the podium starts rising. */
  baseDelay?: number
}

/** Section 2 — podium + ranked scoreboard with expandable breakdowns. */
export default function Scoreboard({ results, active, myCountry, baseDelay = 0 }: ScoreboardProps) {
  const { lang } = useLang()
  const t = useStrings(endgameStrings).scoreboard
  const [openCountry, setOpenCountry] = useState<string | null>(null)
  const { scoreboard, deals } = results
  const podium = scoreboard.slice(0, 3)
  const rest = scoreboard.slice(3)
  const toggle = (c: string) => setOpenCountry((cur) => (cur === c ? null : c))

  // Podium entrance: 3rd, 2nd, then 1st.
  const podiumDelay = (place: number) => baseDelay + (place === 3 ? 0 : place === 2 ? 0.25 : 0.5)
  const tableBase = baseDelay + 0.9

  // Final bloc of each country, for row badges.
  const blocOf = new Map<string, string>()
  for (const b of results.blocs) for (const m of b.members) blocOf.set(m, b.name)
  const customNames = customBlocNames(results.blocs.map((b) => b.name))

  return (
    <section aria-labelledby="scoreboard-title">
      <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink">{t.kicker}</p>
      <h2 id="scoreboard-title" className="mt-1 font-display text-[26px] leading-8 font-semibold text-ink md:text-3xl">
        {t.title}
      </h2>

      {/* Podium: 2nd–1st–3rd on desktop, 1st first on mobile */}
      <div className="mt-6 flex flex-col items-stretch gap-5 lg:flex-row lg:items-center lg:justify-center">
        {podium.map((row) => {
          const place = row.rank as 1 | 2 | 3
          const orderCls =
            place === 1 ? 'order-1 lg:order-2' : place === 2 ? 'order-2 lg:order-1' : 'order-3 lg:order-3'
          return (
            <PodiumCard
              key={row.country}
              row={row}
              place={place}
              deals={deals}
              active={active}
              isYou={myCountry === row.country}
              delay={active ? podiumDelay(place) : 0}
              expanded={openCountry === row.country}
              onToggle={() => toggle(row.country)}
              t={t}
              lang={lang}
              className={cn('lg:w-64', orderCls)}
            />
          )
        })}
      </div>

      {/* Full table, ranks 4–15 */}
      {rest.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
          <div className="hidden grid-cols-[3rem_1fr_9rem_4.5rem_4.5rem_4.5rem_5rem_2.5rem] items-center gap-2 border-b border-hairline bg-paper-deep px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft md:grid">
            <span>{t.rank}</span>
            <span>{t.headers.country}</span>
            <span>{t.headers.bloc}</span>
            <span className="text-right">{t.headers.deals}</span>
            <span className="text-right">{t.headers.missions}</span>
            <span className="text-right">{t.headers.adjust}</span>
            <span className="text-right">{t.headers.total}</span>
            <span />
          </div>
          <ul>
            {rest.map((row, i) => {
              const isYou = myCountry === row.country
              const expanded = openCountry === row.country
              const blocName_ = blocOf.get(row.country)
              return (
                <motion.li
                  key={row.country}
                  initial={{ y: 20, opacity: 0, backgroundColor: '#FDFAF3' }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    // Own row pulses gold twice when it appears.
                    backgroundColor: isYou ? ['#FDFAF3', '#EADFBF', '#F3EAD0', '#EADFBF'] : '#FDFAF3',
                  }}
                  transition={{
                    duration: 0.4,
                    ease: EASE,
                    delay: active ? tableBase + i * 0.05 : 0,
                    backgroundColor: { duration: 1.4, times: [0, 0.3, 0.65, 1], delay: active ? tableBase + i * 0.05 : 0 },
                  }}
                  className="border-b border-hairline last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => toggle(row.country)}
                    aria-expanded={expanded}
                    className="grid min-h-[60px] w-full grid-cols-[2.5rem_1fr_4rem_2rem] items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-paper-deep/50 md:grid-cols-[3rem_1fr_9rem_4.5rem_4.5rem_4.5rem_5rem_2.5rem]"
                  >
                    <span className="font-mono text-lg font-semibold text-ink-soft">{row.rank}</span>
                    <span className="flex min-w-0 items-center gap-2 text-base font-bold text-ink">
                      <span aria-hidden className="text-xl">{row.flag}</span>
                      <span className="truncate">{countryName(row.country, lang)}</span>
                      {isYou && <YouChip label={t.you} />}
                    </span>
                    <span className="hidden md:block">
                      {blocName_ && (
                        <BlocBadge bloc={blocKeyFor(blocName_, customNames)} name={blocName(blocName_, lang)} size="sm" />
                      )}
                    </span>
                    <span className="hidden text-right font-mono text-sm font-semibold text-ink md:block">
                      {row.dealPoints}
                    </span>
                    <span className="hidden text-right font-mono text-sm font-semibold text-ink md:block">
                      {row.missionPoints}
                    </span>
                    <span className="hidden text-right font-mono text-sm font-semibold text-ink md:block">
                      {row.adjustments > 0 ? `+${row.adjustments}` : row.adjustments}
                    </span>
                    <span className="text-right font-mono text-2xl font-semibold text-ink">
                      <CountUp value={row.total} active={active} duration={900} />
                    </span>
                    <ChevronDown
                      className={cn('h-5 w-5 justify-self-end text-ink-soft transition-transform', expanded && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="overflow-hidden border-t border-hairline"
                      >
                        <Breakdown row={row} deals={deals} t={t} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
