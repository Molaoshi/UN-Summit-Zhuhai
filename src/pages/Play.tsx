import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  AlertTriangle,
  CheckCircle2,
  Handshake,
  Mail,
  RotateCcw,
  UserX,
  WifiOff,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { loadSession } from '@/lib/session'
import { useLang, useStrings } from '@/lib/i18n'
import {
  activityMessage,
  blocName,
  countryName,
  sharedStrings,
} from '@/lib/i18n/shared'
import { playStrings } from '@/lib/i18n/play'
import SummitHeader from '@/components/SummitHeader'
import NewsTicker from '@/components/play/NewsTicker'
import MissionCard from '@/components/play/MissionCard'
import DealTicket from '@/components/play/DealTicket'
import EmptyState from '@/components/EmptyState'
import Toast from '@/components/Toast'
import RoundStatusBar from '@/components/play/RoundStatusBar'
import DealActionsCard from '@/components/play/DealActionsCard'
import SendOfferSheet from '@/components/play/SendOfferSheet'
import CountryDossier from '@/components/play/CountryDossier'
import FeedTabs from '@/components/play/FeedTabs'
import EspionagePanel from '@/components/play/EspionagePanel'
import BlocChoiceCard from '@/components/play/BlocChoiceCard'
import StickyBottomBar from '@/components/play/StickyBottomBar'
import {
  flagOf,
  missionProgress,
  toStatusKey,
  toUiDealType,
} from '@/components/play/helpers'
import type { OfferTarget } from '@/components/play/SendOfferSheet'
import { MISSION_POINTS } from '@contracts/game-data'
import type { MissionSlot } from '@contracts/game-data'

const MISSION_ORDER: MissionSlot[] = ['public', 'private', 'bonus']

interface ToastState {
  key: number
  message: string
  icon: LucideIcon
}

export default function Play() {
  const navigate = useNavigate()
  const session = useMemo(() => loadSession(), [])
  const token = session?.token ?? ''
  const { lang } = useLang()
  const s = useStrings(playStrings)
  const t = useStrings(sharedStrings)

  const [toast, setToast] = useState<ToastState | null>(null)
  const showToast = (message: string, icon: LucideIcon = CheckCircle2) =>
    setToast({ key: Date.now(), message, icon })

  const showError = (error: {
    message: string
    data?: { code?: string } | null
  }) => {
    const isConflict = error.data?.code === 'CONFLICT'
    showToast(
      isConflict ? error.message : s.toastError(error.message),
      isConflict ? AlertTriangle : XCircle,
    )
  }

  // ── Data (polling) ────────────────────────────────────────────────────────
  const playerState = trpc.game.playerState.useQuery(
    { token },
    { enabled: !!token, refetchInterval: 4000 },
  )
  const lobbyState = trpc.lobby.state.useQuery(
    { token },
    { enabled: !!token, refetchInterval: 8000 },
  )
  const data = playerState.data

  // ── Auth / room-phase routing ─────────────────────────────────────────────
  useEffect(() => {
    if (!session?.token) navigate('/')
  }, [session, navigate])

  useEffect(() => {
    if (!data) return
    if (data.room.status === 'ended') navigate('/endgame')
    else if (data.room.status === 'lobby') navigate('/lobby')
  }, [data, navigate])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [busyDealId, setBusyDealId] = useState<number | null>(null)

  const sendOffer = trpc.deals.send.useMutation({ onError: showError })
  const acceptDeal = trpc.deals.accept.useMutation({ onError: showError })
  const cancelDeal = trpc.deals.cancel.useMutation({ onError: showError })
  const chooseBloc = trpc.game.chooseBloc.useMutation({ onError: showError })
  const peek = trpc.espionage.peek.useMutation({ onError: showError })

  const [offerSheetOpen, setOfferSheetOpen] = useState(false)
  const [blocChosen, setBlocChosen] = useState(false)
  const blocRef = useRef<HTMLDivElement | null>(null)

  const refetch = () => playerState.refetch()

  // ── Event detection on poll results ───────────────────────────────────────
  const prevRound = useRef<number | null>(null)
  useEffect(() => {
    if (!data) return
    const r = data.room.currentRound
    if (prevRound.current !== null && r > prevRound.current) {
      showToast(s.toastRoundBegan(r), RotateCcw)
    }
    prevRound.current = r
  }, [data])

  const prevMissions = useRef<Record<string, string>>({})
  useEffect(() => {
    if (!data) return
    for (const m of data.myMissions) {
      const prev = prevMissions.current[m.slot]
      if (prev && prev !== 'completed' && m.status === 'completed') {
        confetti({
          particleCount: 12,
          spread: 55,
          startVelocity: 28,
          scalar: 0.8,
          ticks: 120,
          colors: ['#C49A33', '#2E6E6A', '#EADFBF'],
          origin: { y: 0.35 },
        })
        showToast(s.toastMissionComplete, CheckCircle2)
      }
      prevMissions.current[m.slot] = m.status
    }
  }, [data])

  const prevIncoming = useRef<Set<number> | null>(null)
  useEffect(() => {
    if (!data) return
    const ids = new Set(data.myDeals.incoming.map((d) => d.id))
    if (prevIncoming.current !== null) {
      for (const deal of data.myDeals.incoming) {
        if (!prevIncoming.current.has(deal.id)) {
          showToast(s.toastNewOffer(countryName(deal.initiatorCountry, lang)), Mail)
          break
        }
      }
    }
    prevIncoming.current = ids
  }, [data])

  // ── Derived view data ─────────────────────────────────────────────────────
  const myCountry = data?.myCountry ?? null
  const blocs = useMemo(() => data?.blocs ?? {}, [data])
  const allBlocNames = useMemo(
    () => [...new Set(Object.values(blocs))],
    [blocs],
  )

  const score = useMemo(() => {
    if (!data) return { deals: 0, missions: 0, total: 0 }
    const deals = data.myDeals.signed.reduce(
      (n, d) => n + (d.myPoints ?? 0),
      0,
    )
    const missions =
      data.myMissions.filter((m) => m.status === 'completed').length *
      MISSION_POINTS
    return { deals, missions, total: deals + missions }
  }, [data])

  const targets = useMemo<OfferTarget[]>(() => {
    if (!data || !lobbyState.data || !myCountry) return []
    return lobbyState.data.seats
      .filter((s) => s.claimedBy !== null && s.country !== myCountry.name)
      .map((s) => ({
        name: s.country,
        flag: s.flag,
        blocName: blocs[s.country] ?? s.startingBloc,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data, lobbyState.data, myCountry, blocs])

  const actionsBlocked = playerState.isError

  // ── Early states ──────────────────────────────────────────────────────────
  if (!session?.token) return null

  if (playerState.isLoading) {
    return (
      <div className="min-h-[100dvh] bg-paper">
        <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 md:px-8">
          <div className="h-14 animate-pulse rounded-2xl bg-paper-deep" />
          <div className="h-40 animate-pulse rounded-2xl bg-paper-deep" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl bg-paper-deep" />
            <div className="h-72 animate-pulse rounded-2xl bg-paper-deep" />
            <div className="h-72 animate-pulse rounded-2xl bg-paper-deep" />
          </div>
        </div>
      </div>
    )
  }

  if (playerState.isError || !data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md rounded-2xl border border-hairline bg-card p-8 text-center shadow-card">
          <WifiOff className="mx-auto mb-3 h-10 w-10 text-ink-faint" aria-hidden />
          <h1 className="mb-2 font-display text-2xl font-semibold text-ink">
            {s.cannotReach}
          </h1>
          <p className="mb-6 text-base text-ink-soft">
            {playerState.error?.message ?? s.connectionLostBody}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ink text-base font-extrabold text-paper"
            >
              {s.tryAgain}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-hairline bg-paper text-base font-extrabold text-ink"
            >
              {s.backToJoin}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!myCountry || !data.me.countryName) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md rounded-2xl border border-hairline bg-card p-8 text-center shadow-card">
          <UserX className="mx-auto mb-3 h-10 w-10 text-ink-faint" aria-hidden />
          <h1 className="mb-2 font-display text-2xl font-semibold text-ink">
            {s.noCountrySeat}
          </h1>
          <p className="mb-6 text-base text-ink-soft">
            {s.noCountryBody}
          </p>
          <button
            type="button"
            onClick={() => navigate('/lobby')}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-ink text-base font-extrabold text-paper"
          >
            {s.goToLobby}
          </button>
        </div>
      </div>
    )
  }

  const isRoundEnd = data.room.roundPhase === 'round_end'
  const tickerItems = [...data.feed]
    .reverse()
    .map((f) => activityMessage(f.kind, f.params, lang) ?? f.message)
  const missions = MISSION_ORDER.map((slot) =>
    data.myMissions.find((m) => m.slot === slot),
  ).filter((m) => m != null)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAccept = (dealId: number) => {
    setBusyDealId(dealId)
    acceptDeal.mutate(
      { token, dealId },
      {
        onSuccess: (res) => {
          const deal = data.myDeals.incoming.find((d) => d.id === dealId)
          showToast(
            s.toastDealSigned(
              countryName(deal?.initiatorCountry ?? s.partnerFallback, lang),
              res.points.targetPoints,
            ),
          )
          refetch()
        },
        onSettled: () => setBusyDealId(null),
      },
    )
  }

  const handleReject = (dealId: number) => {
    setBusyDealId(dealId)
    cancelDeal.mutate(
      { token, dealId },
      {
        onSuccess: () => {
          showToast(s.toastOfferRejected, XCircle)
          refetch()
        },
        onSettled: () => setBusyDealId(null),
      },
    )
  }

  const handleCancel = (dealId: number) => {
    setBusyDealId(dealId)
    cancelDeal.mutate(
      { token, dealId },
      {
        onSuccess: () => {
          showToast(s.toastOfferCancelled, XCircle)
          refetch()
        },
        onSettled: () => setBusyDealId(null),
      },
    )
  }

  const handleSend = (offer: {
    powerCard: string
    targetCountry: string
    note?: string
  }) => {
    sendOffer.mutate(
      { token, ...offer },
      {
        onSuccess: () => {
          setOfferSheetOpen(false)
          showToast(s.toastOfferSent(countryName(offer.targetCountry, lang)))
          refetch()
        },
      },
    )
  }

  const handleChooseBloc = (chosenBloc: string) => {
    chooseBloc.mutate(
      { token, blocName: chosenBloc },
      {
        onSuccess: () => {
          setBlocChosen(true)
          showToast(s.toastBlocChosen(blocName(chosenBloc, lang)))
          refetch()
        },
      },
    )
  }

  const handlePeek = (country: string) => {
    peek.mutate(
      { token, country },
      {
        onSuccess: () => {
          showToast(s.toastPeekRevealed(countryName(country, lang)), CheckCircle2)
          refetch()
        },
      },
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-paper pb-24 sm:pb-0">
      <SummitHeader
        variant="game"
        roomCode={data.room.code}
        roundNumber={data.room.currentRound}
        phase={isRoundEnd ? t.phase.round_end : t.phase.negotiation}
        player={{
          flag: myCountry.flag,
          country: countryName(myCountry.name, lang),
          score: score.total,
        }}
        onCopyRoomCode={() => {
          navigator.clipboard?.writeText(data.room.code).catch(() => {})
          showToast(s.toastRoomCodeCopied)
        }}
      />

      {/* Connection-lost banner on background refetch failures */}
      {playerState.isError && (
        <div className="bg-status-failed px-4 py-2 text-center text-sm font-extrabold text-paper">
          <WifiOff className="mr-1.5 inline h-4 w-4" aria-hidden />
          {s.connectionLostRetrying}
        </div>
      )}

      <RoundStatusBar
        round={data.room.currentRound}
        phase={data.room.roundPhase}
        actionsRemaining={data.actions.remaining}
        actionsMax={data.actions.max}
        score={score.total}
        scoreBreakdown={{ deals: score.deals, missions: score.missions }}
      />

      <NewsTicker items={tickerItems} />

      <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8 md:px-8 lg:flex-row lg:items-start">
        {/* Column 1 (desktop): dossier → missions → espionage */}
        <div className="contents lg:flex lg:w-[320px] lg:shrink-0 lg:flex-col lg:gap-8">
          <div className="order-3 lg:order-none">
            <CountryDossier
              country={myCountry}
              blocName={blocs[myCountry.name] ?? myCountry.startingBloc}
              allBlocNames={allBlocNames}
            />
          </div>

          <section aria-label={s.myMissionsTitle} className="order-2 lg:order-none">
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
              {s.myMissionsEyebrow}
            </p>
            <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
              {s.myMissionsTitle}
            </h2>
            <div className="space-y-4">
              {missions.map((m) => {
                const condition = myCountry.missions.find(
                  (c) => c.slot === m.slot,
                )?.condition
                const prog = missionProgress(
                  condition,
                  data.myDeals.signed,
                  myCountry,
                  blocs,
                  data.espionage?.peek.peekedCountry ?? null,
                  lang,
                )
                const progressText = prog.checkedAtRoundEnd
                  ? s.checkedAtRoundEnd
                  : prog.progress
                return (
                  <div key={m.slot}>
                    {m.slot === 'public' && data.room.currentRound === 1 && (
                      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-extrabold text-gold-ink">
                        {s.sayItOutLoud}
                      </p>
                    )}
                    <MissionCard
                      kind={m.slot}
                      text={m.text}
                      textZh={m.textZh}
                      status={toStatusKey(m.status)}
                      progressText={progressText}
                      showWatermark
                    />
                  </div>
                )
              })}
            </div>
          </section>

          {data.espionage && (
            <div className="order-6 lg:order-none">
              <EspionagePanel
                espionage={data.espionage}
                myCountryName={myCountry.name}
                blocs={blocs}
                allBlocNames={allBlocNames}
                peeking={peek.isPending}
                onPeek={handlePeek}
              />
            </div>
          )}
        </div>

        {/* Column 2 (desktop): bloc choice (round-end) → deal actions → my deals */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-8">
          <AnimatePresence>
            {isRoundEnd && (
              <div key="bloc-choice" ref={blocRef} className="order-0 lg:order-none">
                <BlocChoiceCard
                  blocs={blocs}
                  myCountryName={myCountry.name}
                  choosing={chooseBloc.isPending}
                  hasChosen={blocChosen}
                  onChoose={handleChooseBloc}
                />
              </div>
            )}
          </AnimatePresence>

          <div className="order-1 lg:order-none">
            <DealActionsCard
              round={data.room.currentRound}
              actions={data.actions}
              incoming={data.myDeals.incoming}
              sent={data.myDeals.sent}
              myCountry={myCountry}
              blocs={blocs}
              busyDealId={busyDealId}
              actionsBlocked={actionsBlocked}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
              onOpenSend={() => setOfferSheetOpen(true)}
            />
          </div>

          <section aria-label={s.myDealsTitle} className="order-4 lg:order-none">
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
              {s.mySignedDealsEyebrow}
            </p>
            <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
              {s.myDealsTitle}
            </h2>
            {data.myDeals.signed.length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-card shadow-card">
                <EmptyState
                  icon={Handshake}
                  title={s.noSignedDeals}
                  body={s.noSignedDealsBody}
                />
              </div>
            ) : (
              <ul className="space-y-4">
                <AnimatePresence initial={false}>
                  {[...data.myDeals.signed].reverse().map((deal) => (
                    <motion.li
                      key={deal.id}
                      layout="position"
                      initial={{ y: 16, opacity: 0, backgroundColor: '#EADFBF' }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl"
                    >
                      <DealTicket
                        dealType={toUiDealType(deal.dealType)}
                        from={{
                          flag: flagOf(deal.initiatorCountry),
                          name: deal.initiatorCountry,
                        }}
                        to={{
                          flag: flagOf(deal.targetCountry),
                          name: deal.targetCountry,
                        }}
                        powerName={deal.powerCard}
                        note={deal.note ?? undefined}
                        pointsEach={deal.myPoints === 3 ? 3 : 2}
                        round={deal.round}
                        state="signed"
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        </div>

        {/* Column 3 (desktop): feed + public missions */}
        <div className="contents lg:flex lg:w-[360px] lg:shrink-0 lg:flex-col lg:gap-8">
          <FeedTabs
            className="order-5 lg:order-none"
            feed={data.feed}
            publicMissions={data.publicMissions}
            myCountryName={myCountry.name}
            blocs={blocs}
            allBlocNames={allBlocNames}
          />
        </div>
      </main>

      <SendOfferSheet
        open={offerSheetOpen}
        onClose={() => setOfferSheetOpen(false)}
        myCountry={myCountry}
        targets={targets}
        allBlocNames={allBlocNames}
        blocs={blocs}
        round={data.room.currentRound}
        sending={sendOffer.isPending}
        onSend={handleSend}
      />

      <StickyBottomBar
        actionsRemaining={data.actions.remaining}
        actionsMax={data.actions.max}
        isRoundEnd={isRoundEnd}
        actionsBlocked={actionsBlocked}
        onSendOffer={() => setOfferSheetOpen(true)}
        onChooseBloc={() =>
          blocRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      />

      {toast && (
        <Toast
          key={toast.key}
          open
          message={toast.message}
          icon={toast.icon}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
