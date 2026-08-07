import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Inbox, Info, Send, X } from 'lucide-react'
import ActionPips from '@/components/ActionPips'
import DealTicket from '@/components/DealTicket'
import EmptyState from '@/components/EmptyState'
import { cn } from '@/lib/utils'
import type { CountryData } from '@contracts/game-data'
import { flagOf, myDealPoints, toUiDealType } from './helpers'
import type { PresentedDeal } from './helpers'

export interface DealActionsCardProps {
  round: number
  actions: { used: number; remaining: number; max: number }
  incoming: PresentedDeal[]
  sent: PresentedDeal[]
  myCountry: CountryData
  blocs: Record<string, string>
  /** Mutation-in-flight ids (for button spinners/disabled states). */
  busyDealId: number | null
  actionsBlocked: boolean
  onAccept: (dealId: number) => void
  onReject: (dealId: number) => void
  onCancel: (dealId: number) => void
  onOpenSend: () => void
}

/** The core interactive module: incoming offers, Send Offer CTA, sent offers. */
export default function DealActionsCard({
  round,
  actions,
  incoming,
  sent,
  myCountry,
  blocs,
  busyDealId,
  actionsBlocked,
  onAccept,
  onReject,
  onCancel,
  onOpenSend,
}: DealActionsCardProps) {
  const exhausted = actions.remaining <= 0
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null)
  const confirmTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current)
    }
  }, [])

  const handleCancel = (dealId: number) => {
    if (confirmCancelId === dealId) {
      setConfirmCancelId(null)
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current)
      onCancel(dealId)
      return
    }
    setConfirmCancelId(dealId)
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current)
    confirmTimer.current = window.setTimeout(() => setConfirmCancelId(null), 3000)
  }

  return (
    <section
      aria-label="Deal actions"
      className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
          Deal actions · Round {round}
        </h2>
        <ActionPips remaining={actions.remaining} total={actions.max} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {exhausted ? (
          <motion.p
            key="exhausted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-4 rounded-xl bg-paper-deep px-4 py-3 text-sm font-bold text-ink-soft"
          >
            You used all {actions.max} actions this round. Watch the feed and
            plan your next moves!
          </motion.p>
        ) : (
          <motion.p
            key="budget"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-faint"
          >
            <Info className="h-4 w-4 shrink-0" aria-hidden />
            Sending, accepting, and cancelling each use 1 action.
          </motion.p>
        )}
      </AnimatePresence>

      {/* 3a. Incoming offers — needs my answer */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-extrabold text-ink">Incoming offers</h3>
        {incoming.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No offers yet"
            body="Walk over to a classmate and ask for a deal!"
            className="py-6"
          />
        ) : (
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {incoming.map((deal) => (
                <motion.li
                  key={deal.id}
                  layout="position"
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="mb-2 text-base text-ink">
                    {flagOf(deal.initiatorCountry)}{' '}
                    <strong>{deal.initiatorCountry}</strong> offers you an{' '}
                    <strong>{deal.dealTypeLabel}</strong> deal ({deal.powerCard})
                    {deal.note && (
                      <>
                        {' '}
                        — <em className="text-ink-soft">“{deal.note}”</em>
                      </>
                    )}
                  </p>
                  <DealTicket
                    dealType={toUiDealType(deal.dealType)}
                    from={{
                      flag: flagOf(deal.initiatorCountry),
                      name: deal.initiatorCountry,
                    }}
                    to={{ flag: flagOf(deal.targetCountry), name: deal.targetCountry }}
                    powerName={deal.powerCard}
                    note={deal.note ?? undefined}
                    pointsEach={myDealPoints(myCountry, deal.initiatorCountry, blocs)}
                    round={deal.round}
                    state="pending"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      disabled={actionsBlocked || exhausted || busyDealId !== null}
                      onClick={() => onAccept(deal.id)}
                      className={cn(
                        'flex h-14 items-center justify-center gap-2 rounded-xl bg-ink text-base font-extrabold text-paper transition-colors hover:bg-ink/90',
                        (actionsBlocked || exhausted || busyDealId !== null) &&
                          'cursor-not-allowed opacity-50',
                      )}
                    >
                      <Check className="h-5 w-5" aria-hidden />
                      {busyDealId === deal.id ? 'Signing…' : 'Accept'}
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      disabled={actionsBlocked || exhausted || busyDealId !== null}
                      onClick={() => onReject(deal.id)}
                      className={cn(
                        'flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-status-failed text-base font-extrabold text-status-failed transition-colors hover:bg-status-failed-soft',
                        (actionsBlocked || exhausted || busyDealId !== null) &&
                          'cursor-not-allowed opacity-50',
                      )}
                    >
                      <X className="h-5 w-5" aria-hidden />
                      Reject
                    </motion.button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* 3b. Send offer CTA */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={actionsBlocked || exhausted}
        onClick={onOpenSend}
        className={cn(
          'group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-ink text-lg font-extrabold text-paper',
          (actionsBlocked || exhausted) && 'cursor-not-allowed opacity-50',
        )}
      >
        <Send className="h-5 w-5" aria-hidden />
        Send a Deal Offer
        {!exhausted && !actionsBlocked && (
          <span
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gold/25 opacity-0 transition-all duration-200 group-hover:left-full group-hover:opacity-100"
            aria-hidden
          />
        )}
      </motion.button>
      {exhausted && (
        <p className="mt-2 text-center text-sm font-semibold text-ink-faint">
          No actions left this round
        </p>
      )}

      {/* 3c. My sent offers */}
      <div className="mt-6">
        <h3 className="mb-3 text-lg font-extrabold text-ink">My sent offers</h3>
        {sent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-hairline px-4 py-3 text-sm font-semibold text-ink-faint">
            No outgoing offers right now — your pending offers will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {sent.map((deal) => (
                <motion.li
                  key={deal.id}
                  layout="position"
                  initial={{ y: -12, opacity: 0, backgroundColor: '#EADFBF' }}
                  animate={{ y: 0, opacity: 1, backgroundColor: '#FDFAF3' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 rounded-xl border border-hairline px-4 py-3"
                >
                  <span aria-hidden className="text-xl">
                    {flagOf(deal.targetCountry)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-ink">
                      {deal.targetCountry} · {deal.dealTypeLabel}
                    </p>
                    <p className="truncate text-xs font-semibold text-ink-soft">
                      {deal.powerCard} · waiting for an answer
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actionsBlocked || exhausted || busyDealId !== null}
                    onClick={() => handleCancel(deal.id)}
                    className={cn(
                      'flex h-10 shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-extrabold text-status-failed transition-colors hover:bg-status-failed-soft',
                      confirmCancelId === deal.id && 'bg-status-failed-soft ring-1 ring-status-failed',
                      (actionsBlocked || exhausted || busyDealId !== null) &&
                        'cursor-not-allowed opacity-50',
                    )}
                  >
                    <X className="h-4 w-4" aria-hidden />
                    {confirmCancelId === deal.id ? 'Sure? Tap again' : 'Cancel'}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  )
}
