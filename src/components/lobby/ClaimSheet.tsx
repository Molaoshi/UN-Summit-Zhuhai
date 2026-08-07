import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Eye, Handshake, Megaphone } from 'lucide-react'
import type { CountryData } from '@contracts/game-data'
import BottomSheet from '@/components/BottomSheet'
import PowerChip from '@/components/PowerChip'
import RatingBar from '@/components/RatingBar'
import { useLang, useStrings } from '@/lib/i18n'
import { blocName, countryName, powerName } from '@/lib/i18n/shared'
import lobbyStrings from '@/lib/i18n/lobby'
import type { DealType } from '@/lib/game-ui'

const ASSET_TO_DEAL: Record<string, DealType> = {
  military: 'military',
  resources: 'infrastructure',
  energy: 'energy',
  tech: 'technology',
}

const ASSET_ORDER: { key: keyof CountryData['assets'] }[] = [
  { key: 'military' },
  { key: 'resources' },
  { key: 'energy' },
  { key: 'tech' },
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
  const { lang } = useLang()
  const s = useStrings(lobbyStrings)
  const publicMission = country?.missions.find((m) => m.slot === 'public')
  const displayName = country ? countryName(country.name, lang) : ''
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={country ? s.claim.title(displayName) : s.claim.titleFallback}
    >
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
              {s.claim.conflictTitle(conflictName)}
            </h3>
            <p className="text-base text-ink-soft">{s.claim.conflictBody}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 min-h-12 w-full rounded-xl bg-ink text-base font-bold text-paper transition-colors hover:bg-ink/90"
            >
              {s.claim.conflictBack}
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
                  {s.claim.become(displayName)}
                </h3>
                <p className="text-sm font-semibold text-ink-soft">
                  {s.claim.startingBloc(blocName(country.startingBloc, lang))}
                </p>
              </div>
            </div>

            {/* Special badge explanations */}
            {(country.hasEspionage || country.freeCrossBloc) && (
              <div className="mb-4 flex flex-col gap-1.5">
                {country.hasEspionage && (
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-gold-ink">
                    <Eye className="h-4 w-4" aria-hidden />
                    {s.claim.espionage}
                  </p>
                )}
                {country.freeCrossBloc && (
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-status-ontrack">
                    <Handshake className="h-4 w-4" aria-hidden />
                    {s.claim.freeTrader}
                  </p>
                )}
              </div>
            )}

            {/* Dossier: assets with full rating bars + power cards */}
            <div className="flex flex-col gap-4">
              {ASSET_ORDER.map(({ key }, i) => {
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
                        {s.claim.assets[key]}
                      </span>
                      <RatingBar dealType={dealType} value={asset.rating} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.powers.map((p) => (
                        <PowerChip
                          key={p}
                          name={powerName(p, lang)}
                          dealType={dealType}
                          espionage={p === 'Espionage'}
                        />
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Public mission teaser — learning content: BOTH languages,
                English primary, 中文 below regardless of the toggle. */}
            {publicMission && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-paper-deep p-3 text-base italic text-ink">
                <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" aria-hidden />
                <span>
                  <span className="font-bold not-italic">{s.claim.publicMission}</span>
                  {publicMission.text}
                  {publicMission.textZh && publicMission.textZh !== publicMission.text && (
                    <span className="mt-1 block not-italic text-ink-soft">
                      {publicMission.textZh}
                    </span>
                  )}
                </span>
              </div>
            )}

            {alreadySeated && (
              <p className="mt-3 text-sm font-semibold text-ink-soft">{s.claim.switching}</p>
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
                    aria-label={s.claim.claiming}
                  />
                ) : (
                  s.claim.confirm(displayName)
                )}
              </motion.button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-xl text-sm font-bold text-ink-soft transition-colors hover:text-ink"
              >
                {s.claim.chooseAnother}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </BottomSheet>
  )
}
