import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Flag, Play, WifiOff } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import SummitHeader from '@/components/SummitHeader'
import Toast from '@/components/Toast'
import PinGate from '@/components/admin/PinGate'
import CommandBar from '@/components/admin/CommandBar'
import PacingCard from '@/components/admin/PacingCard'
import ScoresTable from '@/components/admin/ScoresTable'
import MissionMatrix from '@/components/admin/MissionMatrix'
import BlocMonitor from '@/components/admin/BlocMonitor'
import DealsMonitor from '@/components/admin/DealsMonitor'
import SeatManager from '@/components/admin/SeatManager'
import ActivityLogPanel from '@/components/admin/ActivityLogPanel'
import {
  AdminCtx,
  PROJECTOR_KEY,
  clearAdminCreds,
  customBlocNames,
  loadAdminCreds,
  saveAdminCreds,
} from '@/components/admin/admin-utils'
import type { AdminCreds } from '@/components/admin/admin-utils'
import { useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { clearSession } from '@/lib/session'

function DashboardSkeleton() {
  const t = useStrings(adminStrings)
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 md:px-8" aria-label={t.loading.skeletonAria}>
      <div className="h-24 animate-pulse rounded-2xl border border-hairline bg-card" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-80 animate-pulse rounded-2xl border border-hairline bg-card lg:col-span-7" />
        <div className="h-80 animate-pulse rounded-2xl border border-hairline bg-card lg:col-span-5" />
      </div>
    </div>
  )
}

/** Admin dashboard: the teacher's projector control room. */
export default function Admin() {
  const t = useStrings(adminStrings)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [creds, setCreds] = useState<AdminCreds | null>(() => loadAdminCreds())
  const [gateError, setGateError] = useState<string | null>(null)
  const [projector, setProjector] = useState(() => localStorage.getItem(PROJECTOR_KEY) === '1')
  const [toast, setToast] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const query = trpc.game.adminState.useQuery(
    { code: creds?.code ?? '', pin: creds?.pin ?? '' },
    { enabled: !!creds, refetchInterval: 3000, retry: false },
  )

  const errorCode = query.error?.data?.code
  const authFailed = !!creds && !!query.error && errorCode === 'UNAUTHORIZED'
  const offline = !!creds && !!query.error && !authFailed

  // Wrong PIN → drop stored credentials and re-gate with an error.
  useEffect(() => {
    if (authFailed) {
      clearAdminCreds()
      setCreds(null)
      setGateError(t.pinGate.wrongPin)
    }
  }, [authFailed, t])

  const state = query.data
  const customBlocs = useMemo(() => (state ? customBlocNames(state) : []), [state])

  const ctxValue = useMemo(
    () =>
      creds
        ? {
            creds,
            projector,
            notify: (message: string) => setToast(message),
            refresh: () => {
              void utils.game.adminState.invalidate()
            },
          }
        : null,
    [creds, projector, utils],
  )

  const handleGate = (next: AdminCreds) => {
    saveAdminCreds(next)
    setGateError(null)
    setCreds(next)
  }

  const handleLock = () => {
    clearAdminCreds()
    setCreds(null)
    setGateError(null)
  }

  const toggleProjector = () => {
    setProjector((p) => {
      localStorage.setItem(PROJECTOR_KEY, p ? '0' : '1')
      return !p
    })
  }

  /** Sign out of the finished room entirely and go home for a fresh game. */
  const startNewGame = () => {
    clearSession()
    clearAdminCreds()
    navigate('/')
  }

  // ── PIN gate ──────────────────────────────────────────────────────────────
  if (!creds) {
    return <PinGate initialCode={searchParams.get('code') ?? ''} error={gateError} onSubmit={handleGate} />
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (query.isPending && !state) {
    return (
      <div className="min-h-[100dvh] bg-paper">
        <SummitHeader variant="landing" />
        <DashboardSkeleton />
      </div>
    )
  }

  const room = state?.room ?? { code: creds.code, status: 'lobby' as const, currentRound: 0, roundPhase: 'negotiation' as const }
  const started = room.status !== 'lobby'
  const ended = room.status === 'ended'
  const phaseLabel =
    room.status === 'lobby'
      ? t.header.phase.lobby
      : ended
        ? t.header.phase.ended
        : room.roundPhase === 'round_end'
          ? t.header.phase.round_end
          : t.header.phase.negotiation

  // ── Finished room: clear finished-state card instead of the live dashboard ─
  if (ended) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-paper">
        <SummitHeader
          variant="game"
          roomCode={room.code}
          roundNumber={room.currentRound}
          phase={phaseLabel}
          onCopyRoomCode={() => {
            void navigator.clipboard?.writeText(room.code).catch(() => {})
            setToast(t.header.roomCodeCopied)
          }}
        />
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg rounded-2xl border border-hairline bg-card p-6 text-center shadow-card md:p-8">
            <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-gold-ink">
              <Flag className="h-7 w-7" aria-hidden />
            </span>
            <h1 className="font-display text-3xl font-semibold text-ink">{t.ended.title}</h1>
            <p className="mt-2 text-lg leading-7 text-ink-soft">{t.ended.body}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/endgame"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-lg font-extrabold text-paper shadow-card transition-colors hover:bg-ink/90"
              >
                <Flag className="h-5 w-5" aria-hidden />
                {t.ended.viewResults}
              </Link>
              <button
                type="button"
                onClick={startNewGame}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-ink px-5 text-lg font-extrabold text-ink transition-colors hover:bg-paper-deep"
              >
                <Play className="h-5 w-5" aria-hidden />
                {t.ended.newGame}
              </button>
            </div>
          </div>
        </main>
        <Toast open={!!toast} message={toast ?? ''} onClose={() => setToast(null)} />
      </div>
    )
  }

  const signedCount = state ? state.allDeals.filter((d) => d.status === 'accepted').length : 0
  const pendingCount = state ? state.pendingDeals.length : 0

  return (
    <AdminCtx.Provider value={ctxValue}>
      <div className="min-h-[100dvh] bg-paper">
        <SummitHeader
          variant="game"
          roomCode={room.code}
          roundNumber={room.status === 'lobby' ? undefined : room.currentRound}
          phase={phaseLabel}
          onCopyRoomCode={() => {
            void navigator.clipboard?.writeText(room.code).catch(() => {})
            setToast(t.header.roomCodeCopied)
          }}
        />

        {state && (
          <CommandBar
            room={room}
            signedCount={signedCount}
            pendingCount={pendingCount}
            offline={offline}
            projector={projector}
            onToggleProjector={toggleProjector}
            onLock={handleLock}
          />
        )}

        {offline && (
          <div className="border-b border-hairline bg-status-failed-soft">
            <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2 text-sm font-bold text-status-failed md:px-8">
              <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
              {t.offline}
            </div>
          </div>
        )}

        {state && (
          <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 md:px-8 lg:grid-cols-12">
            <div className="order-2 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1">
              <ScoresTable
                countries={state.countries}
                customBlocs={customBlocs}
                projector={projector}
                started={started}
              />
            </div>
            <div className="order-1 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1">
              <PacingCard state={state} />
            </div>
            <div className="order-5 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-2">
              <BlocMonitor state={state} customBlocs={customBlocs} started={started} />
            </div>
            <div className="order-3 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-3">
              <DealsMonitor state={state} started={started} />
            </div>
            <div className="order-4 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-2">
              <MissionMatrix countries={state.countries} projector={projector} started={started} />
            </div>
            <div className="order-6 lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-4">
              <SeatManager countries={state.countries} projector={projector} />
            </div>
            <div className="order-7 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-start-4">
              <ActivityLogPanel log={state.activityLog} projector={projector} />
            </div>
          </main>
        )}

        <Toast open={!!toast} message={toast ?? ''} onClose={() => setToast(null)} />
      </div>
    </AdminCtx.Provider>
  )
}
