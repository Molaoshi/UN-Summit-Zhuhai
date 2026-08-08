import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Eye, Hourglass, Info, Settings } from 'lucide-react'
import { COUNTRY_BY_NAME } from '@contracts/game-data'
import SummitHeader from '@/components/SummitHeader'
import BottomSheet from '@/components/BottomSheet'
import Toast from '@/components/Toast'
import AdminPanel from '@/components/lobby/AdminPanel'
import CountryPicker from '@/components/lobby/CountryPicker'
import RoomBanner from '@/components/lobby/RoomBanner'
import SeatCard from '@/components/lobby/SeatCard'
import type { SeatInfo } from '@/components/lobby/SeatCard'
import { STARTING_BLOC_META } from '@/components/lobby/bloc-meta'
import AssignPlayers from '@/components/admin/AssignPlayers'
import { clearAdminCreds, loadAdminCreds, saveAdminCreds } from '@/components/admin/admin-utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLang, useStrings } from '@/lib/i18n'
import { blocName, countryName, sharedStrings } from '@/lib/i18n/shared'
import lobbyStrings from '@/lib/i18n/lobby'
import { clearSession, loadSession } from '@/lib/session'
import { BLOCS } from '@/lib/game-ui'
import { trpc } from '@/providers/trpc'

const PIN_KEY = 'summit:adminPin'

export default function Lobby() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const s = useStrings(lobbyStrings)
  const shared = useStrings(sharedStrings)
  const [session] = useState(loadSession)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  // Teachers get the controls either via their session role OR via stored
  // admin credentials (a teacher who signed in through the PIN gate has no
  // session role but still owns this room).
  const [hasAdminCreds, setHasAdminCreds] = useState(() => {
    const creds = loadAdminCreds()
    return !!creds && creds.code === session?.roomCode && creds.pin.length > 0
  })
  const isAdmin = session?.role === 'teacher' || hasAdminCreds

  const [toast, setToast] = useState<string | null>(null)
  const [pin, setPin] = useState(
    () => localStorage.getItem(PIN_KEY) ?? loadAdminCreds()?.pin ?? '',
  )
  const [adminSheetOpen, setAdminSheetOpen] = useState(false)
  const [pulsing, setPulsing] = useState<ReadonlySet<string>>(new Set())

  // No session → back to landing.
  useEffect(() => {
    if (!session) navigate('/', { replace: true })
  }, [session, navigate])

  const stateQ = trpc.lobby.state.useQuery(
    { token: session?.token },
    {
      enabled: !!session,
      retry: 1,
      // Stop polling once the room has ended (the effect below navigates away).
      refetchInterval: (query) =>
        (query.state.data as { status?: string } | undefined)?.status === 'ended' ? false : 3500,
    },
  )
  const data = stateQ.data

  // Invalid token → clear session and restart.
  useEffect(() => {
    if (stateQ.error?.data?.code === 'UNAUTHORIZED') {
      clearSession()
      navigate('/', { replace: true })
    }
  }, [stateQ.error, navigate])

  // Am I an admin assistant? (unseated pool entries carry the flag)
  const amAssistant = useMemo(
    () =>
      !isAdmin &&
      !!session?.name &&
      (data?.unseated.some((p) => p.name === session.name && p.isAssistant) ?? false),
    [data, isAdmin, session],
  )

  // Room moved on → route to the right surface.
  useEffect(() => {
    if (!data) return
    if (data.status === 'playing') {
      navigate(isAdmin ? '/admin' : amAssistant ? '/spectate' : '/play', { replace: true })
    } else if (data.status === 'ended') {
      navigate('/endgame', { replace: true })
    }
  }, [data, isAdmin, amAssistant, navigate])

  // Seat-change pulses (compare consecutive polls).
  const prevSeats = useRef<Map<string, string | null> | null>(null)
  useEffect(() => {
    if (!data) return
    const next = new Map(data.seats.map((s) => [s.country, s.claimedBy]))
    if (prevSeats.current) {
      const changed = new Set<string>()
      for (const [country, holder] of next) {
        if (prevSeats.current.get(country) !== holder) changed.add(country)
      }
      if (changed.size > 0) {
        setPulsing(changed)
        const t = window.setTimeout(() => setPulsing(new Set()), 1300)
        prevSeats.current = next
        return () => window.clearTimeout(t)
      }
    }
    prevSeats.current = next
  }, [data])

  const seats: SeatInfo[] = useMemo(() => data?.seats ?? [], [data])
  const mySeat = useMemo(
    () =>
      !isAdmin && session?.name
        ? seats.find((s) => s.claimedBy === session.name)
        : undefined,
    [seats, isAdmin, session],
  )
  const claimedCount = seats.filter((s) => s.claimedBy !== null).length
  const claimedSeats = useMemo(
    () =>
      seats
        .filter((s) => s.claimedBy !== null)
        .map((s) => ({ country: s.country, flag: s.flag, player: s.claimedBy as string })),
    [seats],
  )

  // Teacher assignment panel data: every joined player (seated or waiting).
  const assignablePlayers = useMemo(() => {
    if (!data) return []
    const seated = data.seats
      .filter((s) => s.playerId !== null)
      .map((s) => ({ id: s.playerId as number, name: s.claimedBy as string, country: s.country as string | null, isAssistant: false }))
    const unseated = data.unseated.map((p) => ({ id: p.id, name: p.name, country: null as string | null, isAssistant: p.isAssistant }))
    return [...unseated, ...seated].sort((a, b) => a.id - b.id)
  }, [data])
  const assignableCountries = useMemo(
    () =>
      seats.map((s) => ({
        country: s.country,
        flag: s.flag,
        playerName: s.claimedBy,
        playerId: s.playerId,
      })),
    [seats],
  )

  const release = trpc.admin.releaseSeat.useMutation()
  const startGame = trpc.admin.startGame.useMutation()

  const copyCode = useCallback(() => {
    if (!session) return
    void navigator.clipboard?.writeText(session.roomCode).catch(() => {})
    setToast(s.toast.codeCopied)
  }, [session, s])

  const handleRelease = async (country: string) => {
    if (!session || !pin) return
    try {
      await release.mutateAsync({ code: session.roomCode, pin, country })
      setToast(s.toast.released(countryName(country, lang)))
      void stateQ.refetch()
    } catch (e) {
      const message = e instanceof Error ? e.message : s.toast.releaseFailed
      if (message.toLowerCase().includes('pin')) {
        setPin('')
        setHasAdminCreds(false)
        localStorage.removeItem(PIN_KEY)
        clearAdminCreds()
      }
      setToast(message)
    }
  }

  const handleStart = async () => {
    if (!session || !pin || startGame.isPending) return
    try {
      await startGame.mutateAsync({ code: session.roomCode, pin })
      setToast(s.toast.started)
      navigate('/admin', { replace: true })
    } catch (e) {
      const message = e instanceof Error ? e.message : s.toast.startFailed
      if (message.toLowerCase().includes('pin')) {
        setPin('')
        setHasAdminCreds(false)
        localStorage.removeItem(PIN_KEY)
        clearAdminCreds()
      }
      setToast(message)
    }
  }

  if (!session) return null

  const adminPanel = (
    <>
      <AdminPanel
        code={session.roomCode}
        claimed={claimedSeats}
        canStart={claimedCount >= 5}
        pin={pin}
        onPinChange={(p) => {
          setPin(p)
          setHasAdminCreds(p.length > 0)
          localStorage.setItem(PIN_KEY, p)
          // Keep the Admin dashboard's JSON credential store in sync so the
          // teacher is never locked out after pressing Start.
          saveAdminCreds({ code: session.roomCode, pin: p })
        }}
        releasing={release.isPending}
        starting={startGame.isPending}
        onRelease={handleRelease}
        onStart={handleStart}
        onCopyCode={copyCode}
        onCopyPin={() => {
          void navigator.clipboard?.writeText(pin).catch(() => {})
          setToast(s.toast.pinCopied)
        }}
      />
      <CountryPicker
        code={session.roomCode}
        pin={pin}
        activeCountries={data?.activeCountries ?? []}
        canEdit={data?.status === 'lobby'}
        onToast={setToast}
        onSaved={() => void stateQ.refetch()}
      />
      <AssignPlayers
        code={session.roomCode}
        pin={pin}
        players={assignablePlayers}
        countries={assignableCountries}
        onToast={setToast}
        onChanged={() => void stateQ.refetch()}
      />
    </>
  )

  return (
    <div className="min-h-[100dvh] bg-paper">
      <SummitHeader
        variant="game"
        roomCode={session.roomCode}
        phase={shared.phase.lobby}
        onCopyRoomCode={copyCode}
      />

      <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-6 md:px-8 md:pt-8">
        <RoomBanner
          code={session.roomCode}
          claimed={claimedCount}
          total={seats.length || (data?.activeCountries.length ?? 15)}
          isAdmin={!!isAdmin}
          onCopy={copyCode}
        />

        <div className="mt-8 lg:flex lg:items-start lg:gap-8">
          {/* Seat map */}
          <div className="relative min-w-0 flex-1">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: 'url(/world-map-dots.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-hidden
            />
            <div className="relative flex flex-col gap-8">
              {STARTING_BLOC_META.map((bloc, bi) => {
                // Seats are already filtered to the room's active countries.
                const blocSeats = seats.filter((s) => s.startingBloc === bloc.name)
                const blocClaimed = blocSeats.filter((s) => s.claimedBy !== null).length
                const label = blocName(bloc.name, lang)
                return (
                  <motion.section
                    key={bloc.name}
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 * bi }}
                    className="rounded-2xl border border-hairline bg-card/80 p-4 md:p-6"
                  >
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-bold"
                        style={{ backgroundColor: BLOCS[bloc.key].soft, color: BLOCS[bloc.key].color }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: BLOCS[bloc.key].color }}
                          aria-hidden
                        />
                        {label}
                      </span>
                      <h2 className="font-display text-[26px] leading-8 font-semibold text-ink">
                        {label}
                      </h2>
                      <span className="text-sm font-semibold text-ink-soft">
                        {lang === 'zh' ? bloc.captionZh : bloc.caption}
                      </span>
                      <span className="ml-auto text-sm font-semibold text-ink-soft">
                        {s.blocClaimed(blocClaimed, blocSeats.length)}
                      </span>
                    </div>
                    {blocSeats.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-hairline px-4 py-3 text-sm font-semibold text-ink-faint">
                        {s.blocEmpty}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {blocSeats.map((seat, si) => {
                          const country = COUNTRY_BY_NAME[seat.country]
                          if (!country) return null
                          return (
                            <SeatCard
                              key={seat.country}
                              seat={seat}
                              data={country}
                              mine={mySeat?.country === seat.country}
                              pulse={pulsing.has(seat.country)}
                              staggerDelay={0.1 * bi + 0.05 * si}
                            />
                          )
                        })}
                      </div>
                    )}
                  </motion.section>
                )
              })}

              {/* Assistant card (promoted students watch read-only) */}
              {!isAdmin && amAssistant && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.5 }}
                  className="rounded-2xl border-2 border-gold bg-card p-5 md:p-6"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                      <Eye className="h-5 w-5 text-gold-ink" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-2xl font-semibold text-ink">
                        {s.assistant.title}
                      </h2>
                      <p className="mt-1 text-lg leading-7 text-ink-soft">{s.assistant.body}</p>
                      <button
                        type="button"
                        onClick={() => navigate('/spectate')}
                        className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-base font-extrabold text-paper shadow-card transition-colors hover:bg-ink/90"
                      >
                        <Eye className="h-5 w-5" aria-hidden />
                        {s.assistant.open}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Waiting card (students with no seat yet) */}
              {!isAdmin && !amAssistant && !mySeat && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.5 }}
                  className="rounded-2xl border-2 border-dashed border-gold bg-card p-5 md:p-6"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                      <Hourglass className="h-5 w-5 text-gold-ink" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-2xl font-semibold text-ink">
                        {s.waiting.title}
                      </h2>
                      <p className="mt-1 text-lg leading-7 text-ink-soft">{s.waiting.body}</p>
                      {session.name && (
                        <p className="mt-2 inline-flex rounded-full bg-paper-deep px-3 py-1 text-sm font-bold text-ink">
                          {s.waiting.joinedAs(session.name)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 border-t border-hairline pt-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                      {s.waiting.rosterTitle(claimedCount, seats.length)}
                    </p>
                    {claimedSeats.length === 0 ? (
                      <p className="mt-2 text-sm font-semibold text-ink-faint">
                        {s.waiting.rosterEmpty}
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {claimedSeats.map((seat) => (
                          <li
                            key={seat.country}
                            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-paper px-3 py-1 text-sm font-bold text-ink"
                          >
                            <span aria-hidden>{seat.flag}</span>
                            {countryName(seat.country, lang)}
                            <span className="font-semibold text-ink-soft">{seat.player}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Seating note (students) */}
              {!isAdmin && !amAssistant && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                  className="flex items-start gap-3 rounded-2xl border border-hairline bg-card p-5"
                >
                  <Info className="mt-0.5 h-6 w-6 shrink-0 text-ink-faint" aria-hidden />
                  <p className="text-lg leading-7 text-ink-soft">{s.seatingNote}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Admin controls: sticky column on desktop */}
          {isAdmin && isDesktop && (
            <motion.aside
              initial={{ x: 32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="sticky top-24 w-[360px] shrink-0"
            >
              {adminPanel}
            </motion.aside>
          )}
        </div>
      </main>

      {/* Admin controls: floating button + sheet on mobile */}
      {isAdmin && !isDesktop && (
        <>
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.4 }}
            onClick={() => setAdminSheetOpen(true)}
            aria-label={s.openTeacherControls}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink shadow-raised"
          >
            <Settings className="h-6 w-6" />
          </motion.button>
          <BottomSheet open={adminSheetOpen} onClose={() => setAdminSheetOpen(false)} title={s.admin.title}>
            {adminPanel}
          </BottomSheet>
        </>
      )}

      <Toast open={toast !== null} message={toast ?? ''} onClose={() => setToast(null)} />
    </div>
  )
}
