import { motion } from 'framer-motion'
import { Copy } from 'lucide-react'
import { LangToggle } from '@/lib/i18n'

export interface SummitHeaderProps {
  /** Landing variant shows only logo + wordmark (no room/round UI). */
  variant?: 'landing' | 'game'
  roomCode?: string
  roundNumber?: number
  /** e.g. "NEGOTIATION", "ROUND END", "LOBBY" */
  phase?: string
  player?: { flag: string; country: string; score: number }
  onCopyRoomCode?: () => void
}

/** Sticky summit bar used on all in-game pages (and a slim landing variant). */
export default function SummitHeader({
  variant = 'game',
  roomCode,
  roundNumber,
  phase,
  player,
  onCopyRoomCode,
}: SummitHeaderProps) {
  const roundLabel =
    roundNumber != null ? `ROUND ${roundNumber}${phase ? ` · ${phase}` : ''}` : phase ?? null

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 h-14 border-b border-hairline bg-card/95 backdrop-blur md:h-16"
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/logo-mark.svg" alt="" className="h-7 w-7 shrink-0" />
          <span className="truncate font-sans text-base font-extrabold tracking-tight md:font-display md:text-lg md:font-semibold">
            UN Summit: Zhuhai
          </span>
        </div>

        {variant === 'game' && (
          <>
            {roundLabel && (
              <div className="hidden md:block">
                <motion.span
                  key={roundLabel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="inline-flex items-center rounded-full bg-gold-soft px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink"
                >
                  {roundLabel}
                </motion.span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {roomCode && (
                <button
                  type="button"
                  onClick={onCopyRoomCode}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-paper px-3 py-1.5 font-mono text-sm font-semibold tracking-[0.12em] text-ink transition-colors hover:bg-paper-deep"
                  title="Tap to copy room code"
                >
                  {roomCode}
                  <Copy className="h-3.5 w-3.5 text-ink-soft" />
                </button>
              )}
              {player && (
                <span className="hidden items-center gap-2 rounded-full border border-hairline bg-card px-3 py-1.5 text-sm font-bold sm:inline-flex">
                  <span aria-hidden>{player.flag}</span>
                  <span>{player.country}</span>
                  <span className="font-mono font-semibold text-gold-ink">{player.score}</span>
                </span>
              )}
              <LangToggle />
            </div>
          </>
        )}
        {variant === 'landing' && <LangToggle />}
      </div>
      {variant === 'game' && roundLabel && (
        <div className="flex justify-center pb-1 md:hidden">
          <span className="inline-flex items-center rounded-full bg-gold-soft px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.10em] text-gold-ink">
            {roundLabel}
          </span>
        </div>
      )}
    </motion.header>
  )
}

