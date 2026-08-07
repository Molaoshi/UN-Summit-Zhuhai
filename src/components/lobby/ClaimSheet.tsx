import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Eye, Handshake, Megaphone } from 'lucide-react'
import type { CountryData } from '@contracts/game-data'
import BottomSheet from '@/components/BottomSheet'
import PowerChip from '@/components/PowerChip'
import RatingBar from '@/components/RatingBar'
import type { DealType } from '@/lib/game-ui'

const ASSET_TO_DEAL: Record<string, DealType> = {
  military: 'military',
  resources: 'infrastructure',
  energy: 'energy',
  tech: 'technology',
}

const ASSET_ORDER: { key: keyof CountryData['assets']; label: string }[] = [
  { key: 'military', label: 'Military' },
  { key: 'resources', label: 'Resources' },
  { key: 'energy', label: 'Energy' },
  { key: 'tech', label: 'Technology' },
]

export interface ClaimSheetProps {
  open: boolean
  country: CountryData | null
  /** Set when the seat was grabbed by someone else mid-claim. */
  conflictName: string | null
  claiming: boolean
  alreadySeated: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Bottom-sheet claim flow: dossier preview → confirm, with race-condition state. */
export default function ClaimSheet({
  open,
  country,
  conflictName,
  claiming,
  alreadySeated,
  onConfirm,
  onClose,
}: ClaimSheetProps) {
  const publicMission = country?.missions.find((m) => m.slot === 'public')
  return (
    <BottomSheet open={open} onClose={onClose} title={country ? `Claim ${country.name}` : 'Claim seat'}>
      <AnimatePresence mode="wait" initial={false}>
        {conflictName ? (
          <motion.div
            key="conflict"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-3 py-4 text-center"
          >
            <AlertTriangle className="h-10 w-10 text-status-atrisk" aria-hidden />
            <h3 className="font-display text-2xl font-semibold text-ink">
              Too slow — {conflictName} just took this seat.
            </h3>
            <p className="text-base text-ink-soft">Pick another country!</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 min-h-12 w-full rounded-xl bg-ink text-base font-bold text-paper transition-colors hover:bg-ink/90"
            >
              Back to the map
            </button>
          </motion.div>
        ) : country ? (
          <motion.div
            key="dossier"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="text-5xl leading-none" aria-hidden>
                {country.flag}
              </span>
              <div>
                <h3 className="font-display text-2xl font-semibold leading-8 text-ink">
                  You are about to become {country.name}
                </h3>
                <p className="text-sm font-semibold text-ink-soft">
                  Starting bloc: {country.startingBloc}
                </p>
              </div>
            </div>

            {/* Special badge explanations */}
            {(country.hasEspionage || country.freeCrossBloc) && (
              <div className="mb-4 flex flex-col gap-1.5">
                {country.hasEspionage && (
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-gold-ink">
                    <Eye className="h-4 w-4" aria-hidden />
                    Espionage — you can spy on other countries' secrets.
                  </p>
                )}
                {country.freeCrossBloc && (
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-status-ontrack">
                    <Handshake className="h-4 w-4" aria-hidden />
                    Free Trader — you earn 3 pts on every deal, even outside your bloc.
                  </p>
                )}
              </div>
            )}

            {/* Dossier: assets with full rating bars + power cards */}
            <div className="flex flex-col gap-4">
              {ASSET_ORDER.map(({ key, label }, i) => {
                const asset = country.assets[key]
                const dealType = ASSET_TO_DEAL[key]
                return (
                  <motion.div
                    key={key}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                        {label}
                      </span>
                      <RatingBar dealType={dealType} value={asset.rating} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.powers.map((p) => (
                        <PowerChip
                          key={p}
                          name={p}
                          dealType={dealType}
                          espionage={p === 'Espionage'}
                        />
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* First mission teaser */}
            {publicMission && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-paper-deep p-3 text-base italic text-ink">
                <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" aria-hidden />
                <span>
                  <span className="font-bold not-italic">Your public mission: </span>
                  {publicMission.text}
                </span>
              </p>
            )}

            {alreadySeated && (
              <p className="mt-3 text-sm font-semibold text-ink-soft">
                Switching seats will release your current country.
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={claiming}
                onClick={onConfirm}
                className="flex min-h-12 items-center justify-center rounded-xl bg-ink text-base font-bold text-paper transition-colors hover:bg-ink/90 disabled:opacity-60"
              >
                {claiming ? (
                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
                    aria-label="Claiming seat"
                  />
                ) : (
                  `Claim ${country.name}`
                )}
              </motion.button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-xl text-sm font-bold text-ink-soft transition-colors hover:text-ink"
              >
                Choose another country
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </BottomSheet>
  )
}
