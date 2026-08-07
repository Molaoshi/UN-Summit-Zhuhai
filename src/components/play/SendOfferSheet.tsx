import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Search, Send } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import BlocBadge from '@/components/BlocBadge'
import DealTicket from '@/components/DealTicket'
import PowerChip from '@/components/PowerChip'
import RatingBar from '@/components/RatingBar'
import { DEAL_TYPES } from '@/lib/game-ui'
import { cn } from '@/lib/utils'
import {
  dealTypeForPower,
  DEAL_TYPES as CONTRACT_DEAL_LABELS,
  type AssetKey,
  type CountryData,
} from '@contracts/game-data'
import {
  ASSET_ORDER,
  blocKeyFor,
  myDealPoints,
  toUiDealType,
} from './helpers'

export interface OfferTarget {
  name: string
  flag: string
  blocName: string
}

export interface SendOfferSheetProps {
  open: boolean
  onClose: () => void
  myCountry: CountryData
  targets: OfferTarget[]
  allBlocNames: string[]
  blocs: Record<string, string>
  round: number
  sending: boolean
  onSend: (offer: { powerCard: string; targetCountry: string; note?: string }) => void
}

const ASSET_LABELS: Record<AssetKey, string> = {
  military: 'Military',
  resources: 'Resources',
  energy: 'Energy',
  tech: 'Tech',
}

const STEP_TITLES = [
  'What do you offer?',
  'To which country?',
  'Add a note? (optional)',
]

/** 3-step Send-Offer flow in a bottom sheet / dialog. */
export default function SendOfferSheet({
  open,
  onClose,
  myCountry,
  targets,
  allBlocNames,
  blocs,
  round,
  sending,
  onSend,
}: SendOfferSheetProps) {
  const [step, setStep] = useState(0)
  const [powerCard, setPowerCard] = useState<string | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [query, setQuery] = useState('')

  // Reset the wizard every time it opens.
  useEffect(() => {
    if (open) {
      setStep(0)
      setPowerCard(null)
      setTarget(null)
      setNote('')
      setQuery('')
    }
  }, [open])

  const dealTypeKey = powerCard ? dealTypeForPower(myCountry, powerCard) : null
  const uiDealType = dealTypeKey ? toUiDealType(dealTypeKey) : null
  const dealMeta = uiDealType ? DEAL_TYPES[uiDealType] : null

  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return targets
    return targets.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.blocName.toLowerCase().includes(q),
    )
  }, [targets, query])

  const targetData = target ? targets.find((t) => t.name === target) : null
  const canNext =
    (step === 0 && powerCard != null) || (step === 1 && target != null)

  return (
    <BottomSheet open={open} onClose={onClose} title="Send a Deal Offer">
      {/* Progress dots */}
      <div className="mb-4 flex items-center gap-2" aria-hidden>
        {STEP_TITLES.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-colors',
              i <= step ? 'bg-gold' : 'bg-hairline',
            )}
          />
        ))}
        <span className="ml-2 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
          Step {step + 1} of 3
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="mb-4 text-xl font-extrabold text-ink">
            {STEP_TITLES[step]}
          </h3>

          {/* Step 1 — pick one of my power cards */}
          {step === 0 && (
            <div className="space-y-5">
              {ASSET_ORDER.map((asset) => (
                <div key={asset}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                      {ASSET_LABELS[asset]}
                    </span>
                    <RatingBar
                      dealType={toUiDealType(asset)}
                      value={myCountry.assets[asset].rating}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {myCountry.assets[asset].powers.map((p) => (
                      <PowerChip
                        key={p}
                        name={p}
                        dealType={toUiDealType(asset)}
                        espionage={p === 'Espionage'}
                        selectable
                        selected={powerCard === p}
                        onClick={() => setPowerCard(p)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <AnimatePresence>
                {dealTypeKey && dealMeta && (
                  <motion.p
                    key={dealTypeKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 rounded-xl bg-paper-deep px-4 py-2.5 text-base font-bold text-ink"
                  >
                    <dealMeta.icon
                      className="h-5 w-5"
                      style={{ color: dealMeta.color }}
                      aria-hidden
                    />
                    This is an{' '}
                    <strong style={{ color: dealMeta.color }}>
                      {CONTRACT_DEAL_LABELS[dealTypeKey]}
                    </strong>{' '}
                    deal
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Step 2 — pick a target country */}
          {step === 1 && (
            <div>
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-input bg-paper px-3">
                <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search countries…"
                  className="h-11 w-full bg-transparent text-base font-semibold text-ink outline-none placeholder:text-ink-faint"
                />
              </div>
              {filteredTargets.length === 0 ? (
                <p className="py-6 text-center text-base font-semibold text-ink-faint">
                  No countries match your search.
                </p>
              ) : (
                <ul className="max-h-[46dvh] space-y-2 overflow-y-auto pr-1">
                  {filteredTargets.map((t, i) => {
                    const pts = myDealPoints(myCountry, t.name, blocs)
                    const sameBloc = blocs[myCountry.name] === t.blocName
                    return (
                      <motion.li
                        key={t.name}
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                      >
                        <button
                          type="button"
                          onClick={() => setTarget(t.name)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                            target === t.name
                              ? 'border-ink bg-gold-soft ring-2 ring-ink'
                              : 'border-hairline bg-card hover:bg-paper-deep',
                          )}
                        >
                          <span aria-hidden className="text-2xl">
                            {t.flag}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-extrabold text-ink">
                              {t.name}
                            </p>
                            <BlocBadge
                              bloc={blocKeyFor(t.blocName, allBlocNames)}
                              name={t.blocName}
                              size="sm"
                            />
                          </div>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1',
                              pts === 3
                                ? 'bg-gold-soft text-gold-ink ring-gold'
                                : 'bg-paper-deep text-ink-soft ring-hairline',
                            )}
                            title={
                              pts === 3
                                ? sameBloc
                                  ? '3 points — bloc member'
                                  : '3 points — you are a Free Trader'
                                : '2 points — different bloc'
                            }
                          >
                            {pts} pts
                          </span>
                        </button>
                      </motion.li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Step 3 — optional note + treaty review */}
          {step === 2 && powerCard && targetData && uiDealType && (
            <div>
              <input
                type="text"
                value={note}
                maxLength={80}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. in exchange for your support in the vote"
                className="h-12 w-full rounded-xl border border-input bg-paper px-4 text-base font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-gold"
              />
              <p className="mt-1.5 text-sm font-semibold text-ink-faint">
                Notes are friendly words only — they don't change the score.
              </p>
              <div className="mt-4">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                  Review your treaty
                </p>
                <DealTicket
                  dealType={uiDealType}
                  from={{ flag: myCountry.flag, name: myCountry.name }}
                  to={{ flag: targetData.flag, name: targetData.name }}
                  powerName={powerCard}
                  note={note.trim() || undefined}
                  pointsEach={myDealPoints(myCountry, targetData.name, blocs)}
                  round={round}
                  state="pending"
                />
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={sending}
                onClick={() =>
                  onSend({
                    powerCard,
                    targetCountry: targetData.name,
                    note: note.trim() || undefined,
                  })
                }
                className={cn(
                  'mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink text-lg font-extrabold text-paper',
                  sending && 'cursor-not-allowed opacity-60',
                )}
              >
                <Send className="h-5 w-5" aria-hidden />
                {sending ? 'Sending…' : 'Send Offer'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer navigation */}
      {step < 2 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="flex h-12 items-center gap-1.5 rounded-xl px-4 text-base font-extrabold text-ink-soft transition-colors hover:bg-paper-deep"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={!canNext}
            onClick={() => setStep(step + 1)}
            className={cn(
              'flex h-12 items-center rounded-xl bg-ink px-6 text-base font-extrabold text-paper',
              !canNext && 'cursor-not-allowed opacity-40',
            )}
          >
            Next
          </motion.button>
        </div>
      )}
      {step === 2 && (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="mt-3 flex h-10 items-center gap-1.5 rounded-xl px-2 text-base font-extrabold text-ink-soft transition-colors hover:bg-paper-deep"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
      )}
    </BottomSheet>
  )
}
