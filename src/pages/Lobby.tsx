import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Info, Settings } from 'lucide-react'
import { COUNTRY_BY_NAME } from '@contracts/game-data'
import SummitHeader from '@/components/SummitHeader'
import BottomSheet from '@/components/BottomSheet'
import Toast from '@/components/Toast'
import AdminPanel from '@/components/lobby/AdminPanel'
import ClaimSheet from '@/components/lobby/ClaimSheet'
import CountryPicker from '@/components/lobby/CountryPicker'
import RoomBanner from '@/components/lobby/RoomBanner'
import SeatCard from '@/components/lobby/SeatCard'
import type { SeatInfo } from '@/components/lobby/SeatCard'
import { STARTING_BLOC_META } from '@/components/lobby/bloc-meta'
import { clearAdminCreds, loadAdminCreds, saveAdminCreds } from '@/components/admin/admin-utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLang, useStrings } from '@/lib/i18n'
import { blocName, countryName, sharedStrings } from '@/lib/i18n/shared'
import lobbyStrings from '@/lib/i18n/lobby'
import { clearSession, loadSession, saveSession } from '@/lib/session'
import { BLOCS } from '@/lib/game-ui'
import { trpc } from '@/providers/trpc'

const PIN_KEY = 'summit:adminPin'

/** Pull the seat-taker's name out of a CONFLICT error message. */
function takerFromMessage(message: string): string | null {
  const m = message.match(/taken by (.+?)\./)
  return m?.[1] ?? null
}

export default function Lobby() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const s = useStrings(lobbyStrings)
  const shared = useStrings(sharedStrings)
  const [session, setSession] = useState(loadSession)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isAdmin = session?.role === 'teacher'

  const [toast, setToast] = useState<string | null>(null)
  const [claimCountry, setClaimCountry] = useState<string | null>(null)
  const [conflictName, setConflictName] = useState<string | null>(null)
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

  // Room moved on → route to the right surface.
  useEffect(() => {
    if (!data) return
    if (data.status === 'playing') {
      navigate(isAdmin ? '/admin' : '/play', { replace: true })
    } else if (data.status === 'ended') {
      navigate('/endgame', { replace: true })
    }
  }, [data, isAdmin, navigate])

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

  const claim = trpc.lobby.claim.useMutation()
  const release = trpc.admin.releaseSeat.useMutation()
  const startGame = trpc.admin.startGame.useMutation()

  const copyCode = useCallback(() => {
    if (!session) return
    void navigator.clipboard?.writeText(session.roomCode).catch(() => {})
    setToast(s.toast.codeCopied)
  }, [session, s])

  const openClaim = (country: string) => {
    setConflictName(null)
    setClaimCountry(country)
  }

  // If the open claim sheet's seat is grabbed by someone else, swap to the conflict state.
  useEffect(() => {
    if (!claimCountry) return
    const seat = seats.find((s) => s.country === claimCountry)
    if (seat?.claimedBy && seat.claimedBy !== session?.name) {
      setConflictName(seat.claimedBy)
    }
  }, [seats, claimCountry, session])

  const confirmClaim = async () => {
    if (!session || !claimCountry || claim.isPending) return
    const country = COUNTRY_BY_NAME[claimCountry]
    try {
      await claim.mutateAsync({ token: session.token, country: claimCountry })
      saveSession({ ...session, country: claimCountry, flag: country?.flag })
      setSession(loadSession())
      setClaimCountry(null)
      setToast(s.toast.welcome(countryName(claimCountry, lang)))
      if (country) {
        const blocKey = STARTING_BLOC_META.find((b) => b.name === country.startingBloc)?.key ?? 'nuclear'
        confetti({
          particleCount: 16,
          spread: 60,
          startVelocity: 24,
          gravity: 0.8,
          origin: { y: 0.7 },
          colors: [BLOCS[blocKey].color, '#C49A33', '#F6F1E7'],
        })
      }
      void stateQ.refetch()
    } catch (e) {
      const message = e instanceof Error ? e.message : s.toast.claimFailed
      if (message.includes('already taken')) {
        setConflictName(takerFromMessage(message) ?? s.claim.someone)
        void stateQ.refetch()
      } else {
        setClaimCountry(null)
        setToast(message)
      }
    }
  }

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
                if (blocSeats.length === 0) return null
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
                            onTake={() => openClaim(seat.country)}
                          />
                        )
                      })}
                    </div>
                  </motion.section>
                )
              })}

              {/* Seating note (students) */}
              {!isAdmin && (
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

      <ClaimSheet
        open={claimCountry !== null}
        country={claimCountry ? (COUNTRY_BY_NAME[claimCountry] ?? null) : null}
        conflictName={conflictName}
        claiming={claim.isPending}
        alreadySeated={!!mySeat && mySeat.country !== claimCountry}
        onConfirm={confirmClaim}
        onClose={() => setClaimCountry(null)}
      />

      <Toast open={toast !== null} message={toast ?? ''} onClose={() => setToast(null)} />
    </div>
  )
}
