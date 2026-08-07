import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { ArrowUp, Hourglass, Printer, RotateCcw } from 'lucide-react'
import Toast from '@/components/Toast'
import FinalBlocs from '@/components/endgame/FinalBlocs'
import HonorRoll from '@/components/endgame/HonorRoll'
import Scoreboard from '@/components/endgame/Scoreboard'
import type { FinalResults } from '@/components/endgame/types'
import { clearSession, loadSession } from '@/lib/session'
import { trpc } from '@/providers/trpc'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const CONFETTI_COLORS = ['#C49A33', '#1E3A3C', '#B45A3C', '#5E7E58', '#F6F1E7']

/** The two confetti bursts of the ceremony (opening + winner). */
function openingBurst() {
  confetti({
    particleCount: 80,
    spread: 25,
    gravity: 0.9,
    origin: { x: 0.5, y: 0.08 },
    colors: CONFETTI_COLORS,
  })
}
function winnerBurst() {
  confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: CONFETTI_COLORS })
  confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: CONFETTI_COLORS })
}

/** Centered minimal logo bar (the reveal replaces in-game chrome). */
function MinimalHeader() {
  return (
    <header className="flex items-center justify-center gap-2.5 py-5">
      <img src="/logo-mark.svg" alt="" className="h-7 w-7" />
      <span className="font-display text-lg font-semibold text-ink">UN Summit: Zhuhai</span>
    </header>
  )
}

/** Waiting state shown while the teacher has not ended the game yet. */
function WaitingState() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <MinimalHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-24 text-center">
        <motion.div
          animate={{ rotate: [0, 180, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Hourglass className="h-10 w-10 text-gold-ink" aria-hidden />
        </motion.div>
        <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
          The summit is still negotiating
        </h1>
        <p className="max-w-sm text-lg leading-7 text-ink-soft">
          Waiting for the teacher to end the game — the final results will appear here automatically.
        </p>
      </main>
    </div>
  )
}

export default function Endgame() {
  const navigate = useNavigate()
  const [session] = useState(loadSession)
  const reduced = useReducedMotion() ?? false
  const [toast, setToast] = useState<string | null>(null)
  const [stage, setStage] = useState(0)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    if (!session) navigate('/', { replace: true })
  }, [session, navigate])

  const resultsQ = trpc.game.finalResults.useQuery(
    { token: session?.token },
    {
      enabled: !!session,
      retry: false,
      refetchInterval: (query) => (query.state.data ? false : 4000),
    },
  )
  const results = (resultsQ.data ?? null) as FinalResults | null
  const error = resultsQ.error

  // Invalid token → clear session and restart.
  useEffect(() => {
    if (error?.data?.code === 'UNAUTHORIZED') {
      clearSession()
      navigate('/', { replace: true })
    }
  }, [error, navigate])

  const seenKey = results ? `summit:revealed:${results.roomCode}` : null

  // Reveal choreography (~6s). Refresh mid-ceremony or reduced motion → static.
  useEffect(() => {
    if (!results || !seenKey) return
    const seen = !!sessionStorage.getItem(seenKey)
    if (reduced || (seen && runId === 0)) {
      setStage(99)
      return
    }
    setStage(0)
    const timers = [
      window.setTimeout(() => setStage(1), 1600),
      window.setTimeout(() => setStage(2), 3400),
      window.setTimeout(() => setStage(3), 5000),
      window.setTimeout(() => setStage(4), 5600),
      window.setTimeout(() => sessionStorage.setItem(seenKey, '1'), 6500),
    ]
    if (!reduced) {
      timers.push(window.setTimeout(openingBurst, 1400))
      timers.push(window.setTimeout(winnerBurst, 4600))
    }
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [results, seenKey, runId, reduced])

  // Personal arrival toast on player devices.
  useEffect(() => {
    if (results && session?.role === 'student') {
      setToast('The summit has ended — check your results!')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])

  if (!session) return null

  // Not ended yet → waiting state (polls every 4s).
  if (!results) {
    if (error && error.data?.code !== 'CONFLICT') {
      return (
        <div className="flex min-h-[100dvh] flex-col bg-paper">
          <MinimalHeader />
          <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <h1 className="font-display text-3xl font-semibold text-ink">Results unavailable</h1>
            <p className="max-w-sm text-lg text-ink-soft">{error.message}</p>
          </main>
        </div>
      )
    }
    return <WaitingState />
  }

  const animated = stage !== 99
  const dealsSigned = results.deals.filter((d) => d.status === 'accepted').length
  const titleWords = ['The', 'Summit', 'Has', 'Ended']

  const replay = () => {
    if (seenKey) sessionStorage.removeItem(seenKey)
    window.scrollTo({ top: 0 })
    setRunId((r) => r + 1)
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-paper">
      {/* world-map-dots backdrop with slow drift */}
      <motion.div
        className="pointer-events-none fixed -inset-16 opacity-10"
        style={{
          backgroundImage: 'url(/world-map-dots.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        animate={reduced ? undefined : { x: [0, -40, 0], y: [0, -20, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        aria-hidden
      />

      <div className="relative">
        <MinimalHeader />

        <main className="mx-auto flex max-w-[960px] flex-col gap-14 px-4 pb-24 md:px-8">
          {/* Section 0 — Opening beat */}
          <section className="flex flex-col items-center gap-4 pt-6 text-center md:pt-10">
            <motion.img
              key={`logo-${runId}`}
              src="/logo-mark.svg"
              alt=""
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="h-[72px] w-[72px]"
            />
            <h1 className="font-display text-[44px] leading-[48px] font-bold tracking-[-0.02em] text-ink lg:text-[64px] lg:leading-[64px]">
              {titleWords.map((w, i) => (
                <motion.span
                  key={`${runId}-${w}`}
                  initial={animated ? { y: 32, opacity: 0 } : false}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: EASE, delay: animated ? 0.9 + i * 0.12 : 0 }}
                  className="inline-block"
                >
                  {w}
                  {i < titleWords.length - 1 ? ' ' : ''}
                </motion.span>
              ))}
            </h1>
            <motion.p
              key={`sub-${runId}`}
              initial={animated ? { y: 16, opacity: 0 } : false}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: animated ? 1.9 : 0 }}
              className="text-lg leading-7 text-ink-soft"
            >
              15 countries · {results.rounds} round{results.rounds === 1 ? '' : 's'} · {dealsSigned} deal
              {dealsSigned === 1 ? '' : 's'} signed — here are the results.
            </motion.p>
          </section>

          {/* Section 1 — Final blocs */}
          {stage >= 1 && (
            <FinalBlocs key={`blocs-${runId}`} blocs={results.blocs} rounds={results.rounds} />
          )}

          {/* Section 2 — Scoreboard */}
          {stage >= 2 && (
            <Scoreboard
              key={`scores-${runId}`}
              results={results}
              active={animated}
              myCountry={session.country ?? null}
            />
          )}

          {/* Section 3 — Mission honor roll */}
          {stage >= 3 && <HonorRoll key={`honor-${runId}`} scoreboard={results.scoreboard} />}

          {/* Section 4 — Closing actions */}
          {stage >= 4 && (
            <motion.section
              key={`close-${runId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-5 text-base font-bold text-paper transition-colors hover:bg-ink/90"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden />
                  Back to top
                </button>
                <button
                  type="button"
                  onClick={replay}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-bold text-ink-soft transition-colors hover:text-ink"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Replay reveal
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-bold text-ink-soft transition-colors hover:text-ink"
                >
                  <Printer className="h-4 w-4" aria-hidden />
                  Print results
                </button>
                {session.role === 'teacher' && (
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-ink px-5 text-base font-bold text-ink transition-colors hover:bg-paper-deep"
                  >
                    Teacher: start a new game →
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-ink-soft">
                Thanks for negotiating · UN Summit: Zhuhai
              </p>
            </motion.section>
          )}
        </main>
      </div>

      <Toast open={toast !== null} message={toast ?? ''} onClose={() => setToast(null)} />
    </div>
  )
}
