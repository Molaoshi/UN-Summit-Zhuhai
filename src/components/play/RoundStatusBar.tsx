import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Megaphone } from 'lucide-react'
import ActionPips from '@/components/ActionPips'

export interface RoundStatusBarProps {
  round: number
  phase: 'negotiation' | 'round_end'
  actionsRemaining: number
  actionsMax: number
  score: number
  scoreBreakdown: { deals: number; missions: number }
}

/** Sticky (mobile) round strip: round numeral, phase chip, pips, my score. */
export default function RoundStatusBar({
  round,
  phase,
  actionsRemaining,
  actionsMax,
  score,
  scoreBreakdown,
}: RoundStatusBarProps) {
  const [scoreOpen, setScoreOpen] = useState(false)
  const isRoundEnd = phase === 'round_end'

  return (
    <div className="sticky top-[82px] z-40 lg:static">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${round}-${phase}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="border-b border-hairline bg-card/95 backdrop-blur"
        >
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-2.5 md:px-8">
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={round}
                  initial={{ rotateX: 90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: -90, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-2xl font-semibold text-ink"
                >
                  ROUND {round}
                </motion.span>
              </AnimatePresence>
              <motion.span
                key={phase}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-[0.10em]"
                style={
                  isRoundEnd
                    ? { backgroundColor: '#F2E4C6', color: '#B07E22' }
                    : { backgroundColor: '#D9E7E4', color: '#2E6E6A' }
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isRoundEnd ? '#B07E22' : '#2E6E6A' }}
                  aria-hidden
                />
                {isRoundEnd ? 'Round end — choose your bloc' : 'Negotiation'}
              </motion.span>
            </div>

            <ActionPips
              remaining={actionsRemaining}
              total={actionsMax}
              className="hidden md:flex"
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => setScoreOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1.5 ring-1 ring-gold transition-colors hover:bg-gold-soft/80"
                aria-expanded={scoreOpen}
              >
                <span className="text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink">
                  My score
                </span>
                <span className="font-mono text-lg font-semibold leading-none text-gold-ink">
                  {score}
                </span>
              </button>
              <AnimatePresence>
                {scoreOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setScoreOpen(false)}
                      aria-hidden
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-hairline bg-card p-4 text-sm shadow-raised"
                    >
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                        My score breakdown
                      </p>
                      <div className="space-y-1 font-semibold text-ink">
                        <div className="flex justify-between">
                          <span>Deals</span>
                          <span className="font-mono">{scoreBreakdown.deals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Missions</span>
                          <span className="font-mono">{scoreBreakdown.missions}</span>
                        </div>
                        <div className="mt-2 flex justify-between border-t border-hairline pt-2 font-extrabold">
                          <span>Total</span>
                          <span className="font-mono text-gold-ink">{score}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-ink-faint">
                        Teacher score adjustments are added at the end of the
                        game.
                      </p>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          {round === 1 && (
            <div className="border-t border-hairline bg-gold-soft/60">
              <p className="mx-auto flex max-w-[1200px] items-center gap-2 px-4 py-1.5 text-sm font-bold text-gold-ink md:px-8">
                <Megaphone className="h-4 w-4 shrink-0" aria-hidden />
                Stand up and tell the class your public mission!
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
