import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Handshake } from 'lucide-react'
import DealTicket from '@/components/DealTicket'
import EmptyState from '@/components/EmptyState'
import {
  countryFlag,
  countryFreeTrader,
  dealTypeUi,
} from '@/components/admin/admin-utils'
import type { AdminDeal, AdminState } from '@/components/admin/admin-utils'
import { DEAL_TYPES } from '@/lib/game-ui'
import type { DealType } from '@/lib/game-ui'
import { useLang, useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { countryName, dealTypeName, powerName } from '@/lib/i18n/shared'
import { cn } from '@/lib/utils'

const TYPE_FILTERS: { ui: DealType; api: AdminDeal['dealType'] }[] = [
  { ui: 'military', api: 'military' },
  { ui: 'infrastructure', api: 'resources' },
  { ui: 'energy', api: 'energy' },
  { ui: 'technology', api: 'tech' },
]

export interface DealsMonitorProps {
  state: AdminState
  started: boolean
}

/** Deals monitor: pending offers first (teacher nudge list), then the full log. */
export default function DealsMonitor({ state, started }: DealsMonitorProps) {
  const { lang } = useLang()
  const t = useStrings(adminStrings).deals
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<AdminDeal['dealType'] | 'all'>('all')

  const blocOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of state.countries) map.set(c.country, c.bloc)
    return map
  }, [state.countries])

  const pointsFor = (d: AdminDeal): 2 | 3 => {
    if (d.status === 'accepted') {
      return d.initiatorPoints === 3 || d.targetPoints === 3 ? 3 : 2
    }
    const sameBloc = blocOf.get(d.initiatorCountry) === blocOf.get(d.targetCountry)
    const free = countryFreeTrader(d.initiatorCountry) || countryFreeTrader(d.targetCountry)
    return sameBloc || free ? 3 : 2
  }

  const present = (d: AdminDeal) => (
    <motion.div
      key={d.id}
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DealTicket
        dealType={dealTypeUi(d.dealType)}
        from={{ flag: countryFlag(d.initiatorCountry), name: countryName(d.initiatorCountry, lang) }}
        to={{ flag: countryFlag(d.targetCountry), name: countryName(d.targetCountry, lang) }}
        powerName={powerName(d.powerCard, lang)}
        note={d.note ?? undefined}
        pointsEach={pointsFor(d)}
        round={d.round}
        state={d.status === 'accepted' ? 'signed' : d.status === 'cancelled' ? 'cancelled' : 'pending'}
      />
      {d.status === 'pending' && (
        <div className="mt-1 pl-1 text-sm font-semibold text-ink-soft">
          {t.sentAgo(t.ago(d.createdAt), `${countryFlag(d.targetCountry)} ${countryName(d.targetCountry, lang)}`)}
        </div>
      )}
    </motion.div>
  )

  const pending = useMemo(
    () => [...state.pendingDeals].sort((a, b) => b.id - a.id),
    [state.pendingDeals],
  )

  const allFiltered = useMemo(() => {
    return [...state.allDeals]
      .sort((a, b) => b.id - a.id)
      .filter((d) => {
        if (countryFilter !== 'all' && d.initiatorCountry !== countryFilter && d.targetCountry !== countryFilter)
          return false
        if (typeFilter !== 'all' && d.dealType !== typeFilter) return false
        return true
      })
  }, [state.allDeals, countryFilter, typeFilter])

  if (!started) {
    return (
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold text-ink">{t.title}</h2>
        <EmptyState
          icon={Handshake}
          title={t.emptyTitle}
          body={t.emptyBody}
          className="py-8"
        />
      </section>
    )
  }

  const tabBtn = (key: 'pending' | 'all', label: string, count: number) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      aria-pressed={tab === key}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-colors',
        tab === key ? 'bg-ink text-paper' : 'bg-paper-deep text-ink-soft hover:text-ink',
      )}
    >
      {label}
      <span
        className={cn(
          'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-mono text-xs font-semibold',
          tab === key ? 'bg-gold text-ink' : 'bg-card text-ink-soft',
        )}
      >
        {count}
      </span>
    </button>
  )

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink">{t.title}</h2>
        <div className="flex gap-2">
          {tabBtn('pending', t.tabPending, pending.length)}
          {tabBtn('all', t.tabAll, state.allDeals.length)}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'pending' ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {pending.length === 0 ? (
              <EmptyState
                icon={Handshake}
                title={t.noStuckTitle}
                body={t.noStuckBody}
                className="py-8"
              />
            ) : (
              <>
                <p className="mb-3 text-sm font-semibold text-ink-soft">{t.nudge}</p>
                <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>{pending.map(present)}</AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                aria-label={t.filterCountry}
                className="rounded-lg border border-hairline bg-paper px-3 py-2 text-sm font-bold text-ink"
              >
                <option value="all">{t.allCountries}</option>
                {state.countries.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.flag} {c.country}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                aria-pressed={typeFilter === 'all'}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors',
                  typeFilter === 'all' ? 'bg-ink text-paper' : 'bg-paper-deep text-ink-soft',
                )}
              >
                {t.allTypes}
              </button>
              {TYPE_FILTERS.map((f) => {
                const meta = DEAL_TYPES[f.ui]
                const Icon = meta.icon
                const active = typeFilter === f.api
                return (
                  <button
                    key={f.api}
                    type="button"
                    onClick={() => setTypeFilter(active ? 'all' : f.api)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition-colors',
                      active ? 'text-paper' : 'bg-card',
                    )}
                    style={
                      active
                        ? { backgroundColor: meta.color, borderColor: meta.color }
                        : { borderColor: `${meta.color}66`, color: meta.color }
                    }
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {dealTypeName(f.api, lang)}
                  </button>
                )
              })}
            </div>
            {allFiltered.length === 0 ? (
              <EmptyState
                icon={Handshake}
                title={t.nothingMatches}
                body={t.noMatchBody}
                className="py-8"
              />
            ) : (
              <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>{allFiltered.map(present)}</AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
