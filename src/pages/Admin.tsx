import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { WifiOff } from 'lucide-react'
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

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 md:px-8" aria-label="Loading admin dashboard">
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
      setGateError('Wrong room code or admin PIN. Try again.')
    }
  }, [authFailed])

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
  const phaseLabel =
    room.status === 'lobby' ? 'LOBBY' : room.status === 'ended' ? 'ENDED' : room.roundPhase === 'round_end' ? 'ROUND END' : 'NEGOTIATION'

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
            setToast('Room code copied.')
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
              Connection lost — retrying every few seconds. Controls are disabled until we're back.
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
