import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Eye,
  Flag,
  GraduationCap,
  Handshake,
  Landmark,
  Layers,
  Megaphone,
  MessageCircle,
  Shield,
  Sparkle,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'
import SummitHeader from '@/components/SummitHeader'
import Footer from '@/components/Footer'
import { trpc } from '@/providers/trpc'
import { loadSession, saveSession, clearSession } from '@/lib/session'
import { clearAdminCreds, markAdminUnlocked, saveAdminCreds } from '@/components/admin/admin-utils'
import { useLang, useStrings } from '@/lib/i18n'
import { countryName } from '@/lib/i18n/shared'
import homeStrings from '@/lib/i18n/home'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const SPRING = { type: 'spring', stiffness: 380, damping: 22 } as const

const CODE_LEN = 6

/** Legacy raw-PIN key the lobby used before the JSON admin creds store. */
const LEGACY_PIN_KEY = 'summit:adminPin'

/** Drop every trace of a previous room (session + admin credentials). */
function clearAllRoomStorage() {
  clearSession()
  clearAdminCreds()
  localStorage.removeItem(LEGACY_PIN_KEY)
}

/* ------------------------------------------------------------------ */
/* 6-cell room code input with auto-advance                            */
/* ------------------------------------------------------------------ */
function CodeInput({
  value,
  onChange,
  onComplete,
  invalid,
  letterLabel,
}: {
  value: string
  onChange: (v: string) => void
  onComplete: () => void
  invalid: boolean
  letterLabel: (i: number) => string
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const chars = value.padEnd(CODE_LEN, ' ').slice(0, CODE_LEN).split('')
  const complete = value.length === CODE_LEN

  const setChar = (i: number, c: string) => {
    const clean = c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (!clean) return
    const next = (value.slice(0, i) + clean[clean.length - 1] + value.slice(i + 1)).slice(0, CODE_LEN)
    onChange(next)
    if (i < CODE_LEN - 1) refs.current[i + 1]?.focus()
    else if (next.length === CODE_LEN) onComplete()
  }

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (chars[i].trim()) onChange(value.slice(0, i) + value.slice(i + 1))
      else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i))
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < CODE_LEN - 1) refs.current[i + 1]?.focus()
    else if (e.key === 'Enter' && complete) onComplete()
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, CODE_LEN)
    if (!text) return
    onChange(text)
    refs.current[Math.min(text.length, CODE_LEN - 1)]?.focus()
    if (text.length === CODE_LEN) onComplete()
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl p-1 transition-shadow',
          complete && 'ring-2 ring-deal-technology',
        )}
      >
        {chars.map((c, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={c.trim()}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={1}
            aria-label={letterLabel(i + 1)}
            placeholder="_"
            onChange={(e) => setChar(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={onPaste}
            className={cn(
              'h-14 w-full min-w-0 rounded-xl border bg-paper-deep text-center font-mono text-2xl font-semibold uppercase tracking-[0.12em] text-ink placeholder:text-ink-faint',
              invalid ? 'border-status-failed' : 'border-hairline',
            )}
          />
        ))}
        <span className={cn('w-6 shrink-0 transition-opacity', complete ? 'opacity-100' : 'opacity-0')}>
          <Check className="h-6 w-6 text-deal-technology" aria-hidden />
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Student Join card                                                   */
/* ------------------------------------------------------------------ */
function JoinCard() {
  const navigate = useNavigate()
  const s = useStrings(homeStrings)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(0)
  const join = trpc.room.join.useMutation()

  const valid = code.length === CODE_LEN && name.trim().length >= 2

  const submit = async () => {
    if (!valid || join.isPending) return
    setError(null)
    try {
      const res = await join.mutateAsync({ code, name: name.trim() })
      saveSession({ token: res.token, roomCode: res.roomCode ?? code, role: 'student', name: name.trim(), country: res.country, flag: res.flag })
      navigate('/lobby')
    } catch (e) {
      // Show the server's actual reason (duplicate name, game already
      // started, …) instead of masking every failure as "room not found".
      setError(e instanceof Error ? e.message : s.join.errorFallback)
      setShake((v) => v + 1)
    }
  }

  return (
    <motion.section
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.35 }}
      className="rounded-2xl border border-hairline bg-card p-6 shadow-card"
      aria-labelledby="join-title"
    >
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING, delay: 0.5 }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft"
      >
        <GraduationCap className="h-7 w-7 text-ink" aria-hidden />
      </motion.div>
      <h2 id="join-title" className="font-display text-[26px] leading-8 font-semibold tracking-[-0.01em]">
        {s.join.title}
      </h2>
      <p className="mt-1 mb-5 text-base text-ink-soft">{s.join.subtitle}</p>

      <motion.div
        key={shake}
        animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : undefined}
        transition={{ duration: 0.3 }}
      >
        <label className="mb-1.5 block text-sm font-bold text-ink">{s.join.codeLabel}</label>
        <CodeInput
          value={code}
          onChange={(v) => { setCode(v); setError(null) }}
          onComplete={submit}
          invalid={!!error}
          letterLabel={s.join.codeLetter}
        />
      </motion.div>
      {error && <p className="mt-2 text-sm font-bold text-status-failed">{error}</p>}

      <label htmlFor="join-name" className="mt-4 mb-1.5 block text-sm font-bold text-ink">
        {s.join.nameLabel}
      </label>
      <input
        id="join-name"
        value={name}
        maxLength={20}
        placeholder={s.join.namePlaceholder}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="h-12 w-full rounded-xl border border-hairline bg-paper-deep px-4 text-base text-ink placeholder:text-ink-faint"
      />

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={!valid || join.isPending}
        onClick={submit}
        className="group relative mt-5 h-14 w-full overflow-hidden rounded-xl bg-ink text-base font-extrabold text-paper transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gold/25 opacity-0 transition-all duration-200 group-hover:left-full group-hover:opacity-100 motion-reduce:hidden" aria-hidden />
        {join.isPending ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" aria-hidden />
            {s.join.joining}
          </span>
        ) : (
          s.join.submit
        )}
      </motion.button>
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/* Teacher Create card                                                 */
/* ------------------------------------------------------------------ */
interface CreatedRoom {
  token: string
  roomCode: string
  adminPin?: string
}

function CreateCard() {
  const navigate = useNavigate()
  const s = useStrings(homeStrings)
  const [teacherName, setTeacherName] = useState('')
  const [created, setCreated] = useState<CreatedRoom | null>(null)
  const [pinRevealed, setPinRevealed] = useState(false)
  const [copied, setCopied] = useState<'code' | 'pin' | null>(null)
  const create = trpc.room.create.useMutation()

  const copy = async (text: string, what: 'code' | 'pin') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const submit = async () => {
    if (create.isPending) return
    // New game: drop the old room's session + admin creds FIRST, so stale
    // localStorage can never bounce the teacher back to the previous room.
    clearAllRoomStorage()
    const res = await create.mutateAsync({ teacherName: teacherName.trim() || 'Teacher' })
    const room: CreatedRoom = { token: res.token, roomCode: res.roomCode, adminPin: res.adminPin }
    saveSession({ token: room.token, roomCode: room.roomCode, role: 'teacher', name: teacherName.trim() || 'Teacher' })
    // Save the new admin creds (room-code prefill + lobby controls) and count
    // this browser session as unlocked — the teacher just saw the PIN.
    if (room.adminPin) {
      saveAdminCreds({ code: room.roomCode, pin: room.adminPin })
      markAdminUnlocked(room.roomCode)
    }
    setCreated(room)
  }

  return (
    <motion.section
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.47 }}
      className="rounded-2xl border border-hairline bg-card p-6 shadow-card"
      aria-labelledby="create-title"
    >
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING, delay: 0.62 }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft"
      >
        <Landmark className="h-7 w-7 text-ink" aria-hidden />
      </motion.div>
      <h2 id="create-title" className="font-display text-[26px] leading-8 font-semibold tracking-[-0.01em]">
        {s.create.title}
      </h2>
      <p className="mt-1 mb-5 text-base text-ink-soft">
        {s.create.subtitle}
      </p>

      <label htmlFor="teacher-name" className="mb-1.5 block text-sm font-bold text-ink">
        {s.create.nameLabel}
      </label>
      <input
        id="teacher-name"
        value={teacherName}
        maxLength={20}
        placeholder={s.create.namePlaceholder}
        onChange={(e) => setTeacherName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="h-12 w-full rounded-xl border border-hairline bg-paper-deep px-4 text-base text-ink placeholder:text-ink-faint"
      />

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={create.isPending}
        onClick={submit}
        className="mt-5 h-14 w-full rounded-xl border-2 border-ink bg-transparent text-base font-extrabold text-ink transition-colors hover:bg-paper-deep disabled:opacity-40"
      >
        {create.isPending ? s.create.creating : s.create.submit}
      </motion.button>
      {create.isError && (
        <p className="mt-2 text-sm font-bold text-status-failed">{s.create.error}</p>
      )}

      {created && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="overflow-hidden"
        >
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="mt-5 rounded-xl border border-hairline bg-paper-deep p-4"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
              <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">{s.create.codeLabel}</p>
              <button
                type="button"
                onClick={() => copy(created.roomCode, 'code')}
                className="mt-1 flex items-center gap-2 font-mono text-[40px] font-semibold tracking-[0.12em] text-ink"
                title={s.create.tapToCopy}
              >
                {created.roomCode}
                {copied === 'code' ? <Check className="h-6 w-6 text-deal-technology" /> : <Copy className="h-6 w-6 text-ink-soft" />}
              </button>
            </motion.div>

            {created.adminPin && (
              <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="mt-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">{s.create.pinLabel}</p>
                <button
                  type="button"
                  onClick={() => (pinRevealed ? copy(created.adminPin!, 'pin') : setPinRevealed(true))}
                  className={cn(
                    'mt-1 flex items-center gap-2 font-mono text-2xl font-semibold tracking-[0.12em] text-ink transition-[filter]',
                    !pinRevealed && 'blur-md select-none',
                  )}
                  title={pinRevealed ? s.create.tapToCopy : s.create.tapToReveal}
                >
                  {created.adminPin}
                  {copied === 'pin' ? <Check className="h-5 w-5 text-deal-technology" /> : <Copy className="h-5 w-5 text-ink-soft" />}
                </button>
              </motion.div>
            )}

            <motion.p
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              className="mt-3 flex items-center gap-1.5 text-sm font-bold text-status-atrisk"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {s.create.pinWarning}
            </motion.p>

            <motion.button
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/admin?code=${created.roomCode}`)}
              className="mt-4 h-12 w-full rounded-xl bg-ink text-base font-extrabold text-paper"
            >
              {s.create.openAdmin}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/* Landing page                                                        */
/* ------------------------------------------------------------------ */
const META_ICONS = [Users, Clock, MessageCircle]
const STEP_ICONS = [Flag, Megaphone, Handshake, Trophy]
const RULE_ICONS = [Layers, Eye, Shield, Timer]

function ResumeBanner() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const s = useStrings(homeStrings)
  const [session, setSession] = useState(loadSession)

  // Validate the stored token against the server (room may have ended or
  // the token may be stale after a server reset).
  const resumeQ = trpc.room.resume.useQuery(
    { token: session?.token ?? '' },
    { enabled: !!session, retry: false, staleTime: 30_000 },
  )

  // Invalid token → silently clear the stored session and hide the banner.
  useEffect(() => {
    if (resumeQ.isError) clearAllRoomStorage()
  }, [resumeQ.isError])

  if (!session || resumeQ.isError) return null

  const status = resumeQ.data?.status
  const startOver = () => {
    clearAllRoomStorage()
    setSession(null)
  }

  // Room already ended → never send anyone "back to the dashboard".
  if (status === 'ended') {
    return (
      <motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="border-b border-hairline bg-gold-soft"
      >
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-4 py-3 md:px-8">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gold-ink">{s.resume.endedTitle}</p>
            <p className="text-sm text-gold-ink/80">{s.resume.endedBody}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/endgame')}
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-extrabold text-paper"
            >
              {s.resume.viewResults}
            </button>
            <button
              type="button"
              onClick={() => {
                startOver()
                document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="text-sm font-bold text-gold-ink underline underline-offset-2"
            >
              {s.resume.newGame}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const isTeacher = session.role === 'teacher'
  // Admin assistants always resume to the read-only spectator dashboard.
  const isAssistant = !isTeacher && resumeQ.data?.player.isAssistant === true
  const welcome = isTeacher
    ? s.resume.welcomeTeacher(session.roomCode)
    : session.country
      ? s.resume.welcomeCountry(session.flag ?? '', countryName(session.country, lang), session.roomCode)
      : s.resume.welcomeNoCountry(session.roomCode)

  // Route to the right surface for the room's actual status.
  const destination = isTeacher
    ? status === 'playing'
      ? '/admin'
      : '/lobby'
    : isAssistant
      ? '/spectate'
      : status === 'playing' && session.country
        ? '/play'
        : '/lobby'
  const cta = isTeacher
    ? status === 'playing'
      ? s.resume.backAdmin
      : s.resume.backLobby
    : isAssistant
      ? s.resume.backSpectator
      : session.country && status === 'playing'
        ? s.resume.backDashboard
        : s.resume.backLobby

  return (
    <motion.div
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="border-b border-hairline bg-gold-soft"
    >
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-4 py-3 md:px-8">
        <p className="text-sm font-bold text-gold-ink">{welcome}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(destination)}
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-extrabold text-paper"
          >
            {cta}
          </button>
          <button
            type="button"
            onClick={startOver}
            className="text-sm font-bold text-gold-ink underline underline-offset-2"
          >
            {s.resume.startOver}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const reduceMotion = useReducedMotion()
  const s = useStrings(homeStrings)
  const titleWords = s.heroWords

  return (
    <div className="min-h-[100dvh]">
      <SummitHeader variant="landing" />
      <ResumeBanner />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <motion.img
          src="/world-map-dots.svg"
          alt=""
          aria-hidden
          initial={false}
          animate={reduceMotion ? undefined : { x: [0, 12] }}
          transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
          className="pointer-events-none absolute right-0 top-0 hidden h-full object-cover opacity-[0.08] lg:block"
        />
        <div className="relative mx-auto grid max-w-[1120px] items-center gap-8 px-4 pb-12 pt-10 md:px-8 lg:grid-cols-[55%_45%] lg:pb-16 lg:pt-16">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft"
            >
              <Sparkle className="h-4 w-4 text-gold" aria-hidden />
              {s.heroEyebrow}
              <Sparkle className="h-4 w-4 text-gold" aria-hidden />
            </motion.p>
            <h1 className="mt-3 font-display text-[44px] font-bold leading-[48px] tracking-[-0.02em] lg:text-[64px] lg:leading-[64px]">
              {titleWords.map((w, i) => (
                <motion.span
                  key={w}
                  initial={{ y: 28, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.09 }}
                  className={cn('inline-block', i < titleWords.length - 1 && 'mr-[0.25em]', i === 1 && 'lg:mr-[0.25em]')}
                >
                  {w}
                  {i === 1 && <br className="lg:hidden" />}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.4 }}
              className="mt-4 max-w-md text-lg leading-[30px] text-ink-soft"
            >
              {s.heroSubtitle}
            </motion.p>
            <div className="mt-5 flex flex-wrap gap-2">
              {s.metaChips.map((label, i) => {
                const Icon = META_ICONS[i % META_ICONS.length]
                return (
                  <motion.span
                    key={label}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...SPRING, delay: 0.55 + i * 0.08 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3.5 py-1.5 text-sm font-bold text-ink"
                  >
                    <Icon className="h-4 w-4 text-ink-soft" aria-hidden />
                    {label}
                  </motion.span>
                )
              })}
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
            className="overflow-hidden rounded-2xl border border-hairline border-b-[6px] border-b-gold bg-card shadow-card"
          >
            <img
              src="/hero-illustration.png"
              alt={s.heroImgAlt}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* ---------------- Action cards ---------------- */}
      <section id="get-started" className="mx-auto grid max-w-[1120px] scroll-mt-20 gap-6 px-4 pb-12 md:px-8 lg:grid-cols-2 lg:pb-16">
        <JoinCard />
        <CreateCard />
      </section>

      {/* ---------------- How to play ---------------- */}
      <section className="relative overflow-hidden border-y border-hairline bg-paper-deep">
        <img
          src="/world-map-dots.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.06]"
        />
        <div className="relative mx-auto max-w-[1120px] px-4 py-12 md:px-8 lg:py-16">
          <h2 className="text-center font-display text-[26px] font-semibold tracking-[-0.01em]">{s.howToPlay}</h2>
          <p className="mt-1 text-center text-base text-ink-soft">{s.howToPlaySub}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.steps.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length]
              return (
                <motion.div
                  key={step.title}
                  initial={{ y: 24, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, ease: EASE, delay: i * 0.1 }}
                  className="rounded-2xl border border-hairline bg-card p-5 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <motion.span
                      initial={{ scale: 0.6 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ ...SPRING, delay: i * 0.1 }}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft font-display text-[32px] font-semibold text-gold-ink"
                    >
                      {i + 1}
                    </motion.span>
                    <Icon className="h-5 w-5 text-ink-faint" aria-hidden />
                  </div>
                  <h3 className="mt-3 text-[19px] font-extrabold leading-[26px]">{step.title}</h3>
                  <p className="mt-1 text-base leading-[26px] text-ink-soft">{step.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Quick rules strip ---------------- */}
      <section className="mx-auto max-w-[1120px] px-4 py-12 md:px-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="grid gap-4 rounded-2xl border border-hairline bg-card p-5 shadow-card sm:grid-cols-2 lg:grid-cols-4"
        >
          {s.rules.map((text, i) => {
            const Icon = RULE_ICONS[i % RULE_ICONS.length]
            return (
              <motion.div
                key={text}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                className="flex items-start gap-2.5"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <p className="text-sm font-semibold leading-5 text-ink-soft">{text}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
