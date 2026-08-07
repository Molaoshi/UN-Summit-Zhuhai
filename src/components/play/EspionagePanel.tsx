import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Eye, Lock, Search } from 'lucide-react'
import BlocBadge from '@/components/BlocBadge'
import PowerChip from '@/components/PowerChip'
import RatingBar from '@/components/RatingBar'
import { useLang, useStrings } from '@/lib/i18n'
import { blocName, countryName, powerName } from '@/lib/i18n/shared'
import { playStrings } from '@/lib/i18n/play'
import { cn } from '@/lib/utils'
import type { AssetKey } from '@contracts/game-data'
import {
  ASSET_ORDER,
  blocKeyFor,
  flagOf,
  toUiDealType,
} from './helpers'
import type { EspionagePayload } from './helpers'

export interface EspionagePanelProps {
  espionage: EspionagePayload
  myCountryName: string
  blocs: Record<string, string>
  allBlocNames: string[]
  peeking: boolean
  onPeek: (country: string) => void
}

/** Espionage panel (🇸🇪 🇯🇵 🇩🇪 🇧🇷): spy dossiers + one-time private-mission peek. */
export default function EspionagePanel({
  espionage,
  myCountryName,
  blocs,
  allBlocNames,
  peeking,
  onPeek,
}: EspionagePanelProps) {
  const [openCountry, setOpenCountry] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [confirmCountry, setConfirmCountry] = useState<string | null>(null)
  const { lang } = useLang()
  const s = useStrings(playStrings)

  const { peek } = espionage
  const others = espionage.allPowerCards.filter(
    (c) => c.country !== myCountryName,
  )
  const q = query.trim().toLowerCase()
  const pickerTargets = q
    ? others.filter(
        (c) =>
          c.country.toLowerCase().includes(q) ||
          countryName(c.country, lang).toLowerCase().includes(q),
      )
    : others

  return (
    <motion.section
      aria-label="Espionage panel"
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0% 0)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border-2 border-dashed border-gold bg-card p-5 shadow-card md:p-6"
    >
      <div className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink">
        <Eye className="h-3.5 w-3.5" aria-hidden />
        {s.espionageClassified}
      </div>
      <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
        {s.spyDossiers}
      </h2>

      {/* All other countries' power cards, one open at a time */}
      <ul className="space-y-2">
        {others.map((c) => {
          const isOpen = openCountry === c.country
          const blocNameOf = blocs[c.country] ?? ''
          return (
            <li
              key={c.country}
              className="overflow-hidden rounded-xl border border-hairline bg-paper"
            >
              <button
                type="button"
                onClick={() => setOpenCountry(isOpen ? null : c.country)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
              >
                <span aria-hidden className="text-xl">
                  {c.flag}
                </span>
                <span className="flex-1 text-base font-extrabold text-ink">
                  {countryName(c.country, lang)}
                </span>
                {blocNameOf && (
                  <BlocBadge
                    bloc={blocKeyFor(blocNameOf, allBlocNames)}
                    name={blocName(blocNameOf, lang)}
                    size="sm"
                  />
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-ink-faint transition-transform duration-300',
                    isOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 border-t border-hairline px-3.5 py-3">
                      {ASSET_ORDER.map((asset: AssetKey) => (
                        <div key={asset}>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                              {s.assetLabels[asset]}
                            </span>
                            <RatingBar
                              dealType={toUiDealType(asset)}
                              value={c.assets[asset].rating}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {c.assets[asset].powers.map((p) => (
                              <PowerChip
                                key={p}
                                name={powerName(p, lang)}
                                dealType={toUiDealType(asset)}
                                espionage={p === 'Espionage'}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>

      {/* One-time private mission peek */}
      <div className="mt-6 border-t border-hairline pt-4">
        <h3 className="mb-2 text-lg font-extrabold text-ink">
          {s.privateMissionPeek}
        </h3>

        {peek.used ? (
          <div className="opacity-100">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-faint">
              <Lock className="h-4 w-4" aria-hidden />
              {s.peekUsed}
            </p>
            {peek.peekedCountry && peek.peekedPrivateMission && (
              <motion.div
                initial={{ filter: 'blur(8px)', opacity: 0.4 }}
                animate={{ filter: 'blur(0px)', opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="relative overflow-hidden rounded-2xl border border-status-failed/40 bg-paper-deep p-5"
              >
                <motion.span
                  initial={{ scale: 2.4, rotate: -14, opacity: 0 }}
                  animate={{ scale: 1, rotate: -8, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="pointer-events-none absolute right-4 top-4 rounded border-2 border-status-failed px-2.5 py-1 text-sm font-extrabold uppercase tracking-[0.12em] text-status-failed"
                  aria-hidden
                >
                  {s.topSecret}
                </motion.span>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                  {flagOf(peek.peekedCountry)}{' '}
                  {s.privateMissionOf(countryName(peek.peekedCountry, lang))}
                </p>
                <p className="pr-24 text-lg leading-[30px] text-ink">
                  {lang === 'zh'
                    ? (peek.peekedPrivateMissionZh ?? peek.peekedPrivateMission)
                    : peek.peekedPrivateMission}
                </p>
                <p className="mt-3 text-sm font-bold text-ink-faint">
                  {s.onlyYouSee}
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm font-semibold text-ink-soft">
              {s.peekInstructions}
            </p>
            {!pickerOpen ? (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold text-base font-extrabold text-gold-ink transition-colors hover:bg-gold-soft/50"
              >
                <Eye className="h-5 w-5" aria-hidden />
                {s.chooseSpyTarget}
              </button>
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-input bg-paper px-3">
                  <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setConfirmCountry(null)
                    }}
                    placeholder={s.searchCountries}
                    className="h-11 w-full bg-transparent text-base font-semibold text-ink outline-none placeholder:text-ink-faint"
                  />
                </div>
                <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {pickerTargets.map((c) => (
                    <li key={c.country}>
                      {confirmCountry === c.country ? (
                        <div className="rounded-xl border-2 border-status-failed bg-status-failed-soft px-4 py-3">
                          <p className="mb-2 text-sm font-extrabold text-status-failed">
                            {c.flag} {s.confirmPeek(countryName(c.country, lang))}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={peeking}
                              onClick={() => onPeek(c.country)}
                              className="flex h-10 flex-1 items-center justify-center rounded-lg bg-status-failed text-sm font-extrabold text-paper disabled:opacity-60"
                            >
                              {peeking ? s.revealing : s.yesReveal}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCountry(null)}
                              className="flex h-10 flex-1 items-center justify-center rounded-lg border border-hairline bg-card text-sm font-extrabold text-ink"
                            >
                              {s.goBack}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCountry(c.country)}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-hairline bg-paper px-3.5 py-2.5 text-left transition-colors hover:bg-paper-deep"
                        >
                          <span aria-hidden className="text-lg">
                            {c.flag}
                          </span>
                          <span className="flex-1 text-sm font-extrabold text-ink">
                            {countryName(c.country, lang)}
                          </span>
                          <span className="text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink">
                            {s.reveal}
                          </span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  )
}
