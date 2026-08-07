import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Copy, Flag, Lock, Play, Presentation, Projector, RefreshCw } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useAdminCtx } from '@/components/admin/admin-utils'
import type { AdminRoom } from '@/components/admin/admin-utils'
import { cn } from '@/lib/utils'

export interface CommandBarProps {
  room: AdminRoom
  /** Deals signed across the game so far. */
  signedCount: number
  pendingCount: number
  offline: boolean
  projector: boolean
  onToggleProjector: () => void
  onLock: () => void
}

type PendingAction = 'start' | 'closeRound' | 'nextRound' | 'endGame' | null

const PHASE_META: Record<string, { label: string; color: string; soft: string }> = {
  lobby: { label: 'LOBBY', color: '#8B8F82', soft: '#E8E4D8' },
  negotiation: { label: 'NEGOTIATION', color: '#2E6E6A', soft: '#D9E7E4' },
  round_end: { label: 'ROUND END', color: '#B07E22', soft: '#F2E4C6' },
  ended: { label: 'ENDED', color: '#4F7A52', soft: '#DDE8D9' },
}

/** Sticky command strip: room code, round state, and the lifecycle buttons. */
export default function CommandBar({
  room,
  signedCount,
  pendingCount,
  offline,
  projector,
  onToggleProjector,
  onLock,
}: CommandBarProps) {
  const { creds, notify, refresh } = useAdminCtx()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [copied, setCopied] = useState(false)

  const startGame = trpc.admin.startGame.useMutation({
    onSuccess: () => {
      notify('Round 1 has begun!')
      refresh()
    },
    onError: (e) => notify(e.message),
  })
  const endRound = trpc.admin.endRound.useMutation({
    onSuccess: (r) => {
      notify(
        r.roundPhase === 'round_end'
          ? `Round ${r.currentRound} negotiation closed — bloc choice is open.`
          : `Round ${r.currentRound} has begun. Deal actions reset to 3.`,
      )
      refresh()
    },
    onError: (e) => notify(e.message),
  })
  const endGame = trpc.admin.endGame.useMutation({
    onSuccess: () => {
      notify('The summit has ended — results revealed!')
      refresh()
    },
    onError: (e) => notify(e.message),
  })

  const busy = startGame.isPending || endRound.isPending || endGame.isPending
  const phaseKey = room.status === 'playing' ? room.roundPhase : room.status
  const phase = PHASE_META[phaseKey] ?? PHASE_META.lobby

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      notify(`Room code: ${room.code}`)
    }
  }

  const confirm = () => {
    const input = { code: creds.code, pin: creds.pin }
    if (pendingAction === 'start') startGame.mutate(input)
    if (pendingAction === 'closeRound' || pendingAction === 'nextRound') endRound.mutate(input)
    if (pendingAction === 'endGame') endGame.mutate(input)
    setPendingAction(null)
  }

  // Lifecycle button config
  let primaryLabel = ''
  let primaryAction: PendingAction = null
  if (room.status === 'lobby') {
    primaryLabel = 'Start Round 1'
    primaryAction = 'start'
  } else if (room.status === 'playing' && room.roundPhase === 'negotiation') {
    primaryLabel = `End Round ${room.currentRound}`
    primaryAction = 'closeRound'
  } else if (room.status === 'playing' && room.roundPhase === 'round_end') {
    primaryLabel = `Begin Round ${room.currentRound + 1}`
    primaryAction = 'nextRound'
  }
  const canEndGame = room.status === 'playing'

  return (
    <>
      <motion.section
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-14 z-40 border-b border-hairline bg-card/95 backdrop-blur md:top-16"
        aria-label="Command bar"
      >
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-8">
          {/* Room code */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                Room code
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-3xl font-semibold tracking-[0.12em] text-ink md:text-4xl">
                  {room.code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-paper text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
                  aria-label="Copy room code"
                  title="Copy room code"
                >
                  <Copy className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <span className="mt-1 hidden items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold text-gold-ink lg:inline-flex">
                <Presentation className="h-3 w-3" aria-hidden />
                {copied ? 'Copied — paste it for students' : 'Project this for students'}
              </span>
            </div>
          </div>

          {/* Round + phase */}
          <div className="flex items-center gap-3">
            <motion.span
              key={room.currentRound}
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-2xl font-semibold text-ink md:text-3xl"
            >
              {room.status === 'lobby' ? 'Not started' : `Round ${room.currentRound}`}
            </motion.span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.10em]"
              style={{ backgroundColor: phase.soft, color: phase.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: phase.color }} aria-hidden />
              {phase.label}
            </span>
            <span className="hidden text-sm font-semibold text-ink-soft xl:block">
              {signedCount} deals signed · {pendingCount} offers pending
            </span>
          </div>

          {/* Lifecycle buttons */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleProjector}
              aria-pressed={projector}
              title="Projector mode: enlarge all text"
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-extrabold transition-colors',
                projector
                  ? 'border-gold bg-gold-soft text-gold-ink'
                  : 'border-hairline bg-paper text-ink-soft hover:bg-paper-deep hover:text-ink',
              )}
            >
              <Projector className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">Projector</span>
            </button>
            <button
              type="button"
              onClick={onLock}
              title="Lock admin (returns to the PIN gate)"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-hairline bg-paper px-3.5 text-sm font-extrabold text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
            >
              <Lock className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">Lock</span>
            </button>
            {room.status === 'ended' ? (
              <Link
                to="/endgame"
                className="inline-flex h-14 items-center gap-2 rounded-xl bg-ink px-6 text-lg font-extrabold text-paper shadow-card transition-colors hover:bg-ink/90"
              >
                <Flag className="h-5 w-5" aria-hidden />
                View final results
              </Link>
            ) : (
              <>
                {primaryLabel && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    disabled={busy || offline}
                    onClick={() => setPendingAction(primaryAction)}
                    className="inline-flex h-14 items-center gap-2 rounded-xl bg-ink px-6 text-lg font-extrabold text-paper shadow-card transition-colors hover:bg-ink/90 disabled:opacity-50"
                  >
                    {primaryAction === 'start' ? (
                      <Play className="h-5 w-5" aria-hidden />
                    ) : (
                      <RefreshCw className="h-5 w-5" aria-hidden />
                    )}
                    {primaryLabel}
                  </motion.button>
                )}
                <div className="flex flex-col items-start">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    disabled={busy || offline || !canEndGame}
                    onClick={() => setPendingAction('endGame')}
                    className="inline-flex h-14 items-center gap-2 rounded-xl border-2 border-status-failed bg-card px-5 text-lg font-extrabold text-status-failed transition-colors hover:bg-status-failed-soft disabled:opacity-50"
                  >
                    <Flag className="h-5 w-5" aria-hidden />
                    End Game
                  </motion.button>
                  {!canEndGame && (
                    <span className="mt-0.5 text-xs font-semibold text-ink-faint">
                      Start the game first
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={pendingAction === 'start'}
        onClose={() => setPendingAction(null)}
        title="Start Round 1?"
        body="The summit opens for every seated player."
        effects={[
          'All players see their country dossier and missions.',
          'Deal actions open: 3 per country per round.',
          'Suggested pace: 4–6 rounds · 2–2.5 hours.',
        ]}
        confirmLabel="Yes, start Round 1"
        icon={Play}
        loading={startGame.isPending}
        onConfirm={confirm}
      />
      <ConfirmDialog
        open={pendingAction === 'closeRound'}
        onClose={() => setPendingAction(null)}
        title={`Close negotiation for Round ${room.currentRound}?`}
        body="Players stop negotiating and choose their blocs."
        effects={[
          'Negotiation closes — no new offers.',
          'Players pick (or found) a bloc for next round.',
          'Last deal actions of the round can still be used.',
        ]}
        confirmLabel={`Yes, close Round ${room.currentRound}`}
        icon={RefreshCw}
        loading={endRound.isPending}
        onConfirm={confirm}
      />
      <ConfirmDialog
        open={pendingAction === 'nextRound'}
        onClose={() => setPendingAction(null)}
        title={`Begin Round ${room.currentRound + 1}?`}
        body="The next negotiation round starts for everyone."
        effects={[
          "Players' bloc choices lock in.",
          'Mission statuses re-check automatically.',
          'Deal actions reset to 3 per country.',
        ]}
        confirmLabel={`Yes, begin Round ${room.currentRound + 1}`}
        icon={RefreshCw}
        loading={endRound.isPending}
        onConfirm={confirm}
      />
      <ConfirmDialog
        open={pendingAction === 'endGame'}
        onClose={() => setPendingAction(null)}
        title="End the summit?"
        tone="danger"
        body="All scores, blocs, and missions will be revealed on every screen. This cannot be undone."
        effects={[
          'Final mission results are graded.',
          'Every player sees the full scoreboard.',
          'No more deals or bloc changes.',
        ]}
        confirmLabel="Yes, reveal the results"
        loading={endGame.isPending}
        onConfirm={confirm}
      />
    </>
  )
}
