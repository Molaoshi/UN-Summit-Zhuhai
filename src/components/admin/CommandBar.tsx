import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Copy, Flag, Lock, Play, Presentation, Projector, RefreshCw } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useAdminCtx } from '@/components/admin/admin-utils'
import type { AdminRoom } from '@/components/admin/admin-utils'
import { useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
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

const PHASE_META: Record<string, { color: string; soft: string }> = {
  lobby: { color: '#8B8F82', soft: '#E8E4D8' },
  negotiation: { color: '#2E6E6A', soft: '#D9E7E4' },
  round_end: { color: '#B07E22', soft: '#F2E4C6' },
  ended: { color: '#4F7A52', soft: '#DDE8D9' },
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
  const t = useStrings(adminStrings)
  const { creds, notify, refresh } = useAdminCtx()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [copied, setCopied] = useState(false)

  const startGame = trpc.admin.startGame.useMutation({
    onSuccess: () => {
      notify(t.command.toastStarted)
      refresh()
    },
    onError: (e) => notify(e.message),
  })
  const endRound = trpc.admin.endRound.useMutation({
    onSuccess: (r) => {
      notify(
        r.roundPhase === 'round_end'
          ? t.command.toastRoundClosed(r.currentRound)
          : t.command.toastRoundBegan(r.currentRound),
      )
      refresh()
    },
    onError: (e) => notify(e.message),
  })
  const endGame = trpc.admin.endGame.useMutation({
    onSuccess: () => {
      notify(t.command.toastEnded)
      refresh()
    },
    onError: (e) => notify(e.message),
  })

  const busy = startGame.isPending || endRound.isPending || endGame.isPending
  const phaseKey = room.status === 'playing' ? room.roundPhase : room.status
  const phase = PHASE_META[phaseKey] ?? PHASE_META.lobby
  const phaseLabel =
    t.header.phase[phaseKey as keyof typeof t.header.phase] ?? t.header.phase.lobby

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      notify(t.command.toastRoomCode(room.code))
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
    primaryLabel = t.command.startRound1
    primaryAction = 'start'
  } else if (room.status === 'playing' && room.roundPhase === 'negotiation') {
    primaryLabel = t.command.endRound(room.currentRound)
    primaryAction = 'closeRound'
  } else if (room.status === 'playing' && room.roundPhase === 'round_end') {
    primaryLabel = t.command.beginRound(room.currentRound + 1)
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
        aria-label={t.command.aria}
      >
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-8">
          {/* Room code */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                {t.command.roomCode}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-3xl font-semibold tracking-[0.12em] text-ink md:text-4xl">
                  {room.code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-paper text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
                  aria-label={t.command.copyRoomCode}
                  title={t.command.copyRoomCode}
                >
                  <Copy className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <span className="mt-1 hidden items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold text-gold-ink lg:inline-flex">
                <Presentation className="h-3 w-3" aria-hidden />
                {copied ? t.command.copied : t.command.projectThis}
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
              {room.status === 'lobby' ? t.command.notStarted : t.command.round(room.currentRound)}
            </motion.span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.10em]"
              style={{ backgroundColor: phase.soft, color: phase.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: phase.color }} aria-hidden />
              {phaseLabel}
            </span>
            <span className="hidden text-sm font-semibold text-ink-soft xl:block">
              {t.command.dealsSummary(signedCount, pendingCount)}
            </span>
          </div>

          {/* Lifecycle buttons */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleProjector}
              aria-pressed={projector}
              title={t.command.projectorTitle}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-extrabold transition-colors',
                projector
                  ? 'border-gold bg-gold-soft text-gold-ink'
                  : 'border-hairline bg-paper text-ink-soft hover:bg-paper-deep hover:text-ink',
              )}
            >
              <Projector className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">{t.command.projector}</span>
            </button>
            <button
              type="button"
              onClick={onLock}
              title={t.command.lockTitle}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-hairline bg-paper px-3.5 text-sm font-extrabold text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
            >
              <Lock className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">{t.command.lock}</span>
            </button>
            {room.status === 'ended' ? (
              <Link
                to="/endgame"
                className="inline-flex h-14 items-center gap-2 rounded-xl bg-ink px-6 text-lg font-extrabold text-paper shadow-card transition-colors hover:bg-ink/90"
              >
                <Flag className="h-5 w-5" aria-hidden />
                {t.command.viewResults}
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
                    {t.command.endGame}
                  </motion.button>
                  {!canEndGame && (
                    <span className="mt-0.5 text-xs font-semibold text-ink-faint">
                      {t.command.startFirstHint}
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
        title={t.command.confirm.start.title}
        body={t.command.confirm.start.body}
        effects={t.command.confirm.start.effects}
        confirmLabel={t.command.confirm.start.confirmLabel}
        icon={Play}
        loading={startGame.isPending}
        onConfirm={confirm}
      />
      <ConfirmDialog
        open={pendingAction === 'closeRound'}
        onClose={() => setPendingAction(null)}
        title={t.command.confirm.closeRound.title(room.currentRound)}
        body={t.command.confirm.closeRound.body}
        effects={t.command.confirm.closeRound.effects}
        confirmLabel={t.command.confirm.closeRound.confirmLabel(room.currentRound)}
        icon={RefreshCw}
        loading={endRound.isPending}
        onConfirm={confirm}
      />
      <ConfirmDialog
        open={pendingAction === 'nextRound'}
        onClose={() => setPendingAction(null)}
        title={t.command.confirm.nextRound.title(room.currentRound + 1)}
        body={t.command.confirm.nextRound.body}
        effects={t.command.confirm.nextRound.effects}
        confirmLabel={t.command.confirm.nextRound.confirmLabel(room.currentRound + 1)}
        icon={RefreshCw}
        loading={endRound.isPending}
        onConfirm={confirm}
      />
      <ConfirmDialog
        open={pendingAction === 'endGame'}
        onClose={() => setPendingAction(null)}
        title={t.command.confirm.endGame.title}
        tone="danger"
        body={t.command.confirm.endGame.body}
        effects={t.command.confirm.endGame.effects}
        confirmLabel={t.command.confirm.endGame.confirmLabel}
        loading={endGame.isPending}
        onConfirm={confirm}
      />
    </>
  )
}
