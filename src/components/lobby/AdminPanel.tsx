import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Eye, EyeOff, KeyRound, UserX } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import { useLang, useStrings } from '@/lib/i18n'
import { countryName } from '@/lib/i18n/shared'
import lobbyStrings from '@/lib/i18n/lobby'

export interface ClaimedSeat {
  country: string
  flag: string
  player: string
}

export interface AdminPanelProps {
  code: string
  claimed: ClaimedSeat[]
  /** Start is allowed once at least 5 seats are claimed. */
  canStart: boolean
  pin: string
  onPinChange: (pin: string) => void
  releasing: boolean
  starting: boolean
  onRelease: (country: string) => void
  onStart: () => void
  onCopyCode: () => void
  onCopyPin: () => void
}

/** Teacher-only controls: room codes, seat release, Start Round 1. */
export default function AdminPanel({
  code,
  claimed,
  canStart,
  pin,
  onPinChange,
  releasing,
  starting,
  onRelease,
  onStart,
  onCopyCode,
  onCopyPin,
}: AdminPanelProps) {
  const { lang } = useLang()
  const s = useStrings(lobbyStrings)
  const [pinDraft, setPinDraft] = useState('')
  const [pinRevealed, setPinRevealed] = useState(false)
  const [releaseTarget, setReleaseTarget] = useState<ClaimedSeat | null>(null)
  const [startConfirm, setStartConfirm] = useState(false)

  const unlocked = pin.length > 0

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
      <div className="h-1 bg-gold" aria-hidden />
      <div className="p-5 md:p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink">
          {s.admin.onlyYou}
        </p>
        <h2 className="mt-1 font-display text-[26px] leading-8 font-semibold text-ink">
          {s.admin.title}
        </h2>

        {!unlocked ? (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (pinDraft.trim()) onPinChange(pinDraft.trim())
            }}
          >
            <p className="text-base text-ink-soft">{s.admin.pinPrompt}</p>
            <label className="flex items-center gap-2 rounded-xl border border-hairline bg-paper px-3">
              <KeyRound className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
              <input
                value={pinDraft}
                onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                autoComplete="off"
                placeholder={s.admin.pinPlaceholder}
                aria-label={s.admin.pinPlaceholder}
                className="min-h-12 w-full bg-transparent font-mono text-lg font-semibold tracking-[0.2em] text-ink outline-none placeholder:text-ink-faint"
              />
            </label>
            <button
              type="submit"
              disabled={pinDraft.length !== 4}
              className="min-h-12 rounded-xl bg-ink text-base font-bold text-paper transition-colors hover:bg-ink/90 disabled:opacity-50"
            >
              {s.admin.unlock}
            </button>
          </form>
        ) : (
          <>
            {/* Room codes */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-paper-deep px-3 py-2">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">{s.admin.roomCode}</p>
                  <p className="font-mono text-2xl font-semibold tracking-[0.12em] text-ink">{code}</p>
                </div>
                <button
                  type="button"
                  onClick={onCopyCode}
                  aria-label={s.admin.copyCode}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-hairline hover:text-ink"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-paper-deep px-3 py-2">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">{s.admin.adminPin}</p>
                  <p className="font-mono text-2xl font-semibold tracking-[0.12em] text-ink">
                    {pinRevealed ? pin : '••••'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPinRevealed((v) => !v)}
                    aria-label={pinRevealed ? s.admin.hidePin : s.admin.revealPin}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-hairline hover:text-ink"
                  >
                    {pinRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={onCopyPin}
                    aria-label={s.admin.copyPin}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-hairline hover:text-ink"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Player list */}
            <div className="mt-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                {s.admin.claimedSeats(claimed.length)}
              </p>
              <ul className="mt-2 divide-y divide-hairline">
                {claimed.length === 0 && (
                  <li className="py-3 text-sm font-semibold text-ink-faint">
                    {s.admin.noClaims}
                  </li>
                )}
                {claimed.map((seat) => (
                  <motion.li
                    key={seat.country}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="flex min-h-12 items-center justify-between gap-2 py-1.5"
                  >
                    <span className="text-base font-bold text-ink">
                      <span aria-hidden className="mr-1.5">{seat.flag}</span>
                      {countryName(seat.country, lang)}
                      <span className="ml-2 font-semibold text-ink-soft">{seat.player}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReleaseTarget(seat)}
                      title={s.admin.release(countryName(seat.country, lang))}
                      aria-label={`${s.admin.release(countryName(seat.country, lang))} (${seat.player})`}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-status-failed transition-colors hover:bg-status-failed-soft"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Start button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={!canStart || starting}
              onClick={() => setStartConfirm(true)}
              animate={
                canStart && !starting
                  ? { boxShadow: ['0 0 0 0 rgba(196,154,51,0)', '0 0 0 8px rgba(196,154,51,0.25)', '0 0 0 0 rgba(196,154,51,0)'] }
                  : { boxShadow: '0 0 0 0 rgba(196,154,51,0)' }
              }
              transition={canStart && !starting ? { duration: 2.4, repeat: Infinity } : { duration: 0.2 }}
              className="mt-5 flex min-h-16 w-full items-center justify-center rounded-xl bg-ink text-lg font-bold text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting ? s.admin.starting : s.admin.start}
            </motion.button>
            {!canStart && (
              <p className="mt-2 text-sm font-semibold text-ink-soft">
                {s.admin.startNeed}
              </p>
            )}
          </>
        )}
      </div>

      {/* Release confirm */}
      <BottomSheet
        open={releaseTarget !== null}
        onClose={() => setReleaseTarget(null)}
        title={s.admin.releaseTitle}
      >
        {releaseTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-lg text-ink">
              {s.admin.releaseBody(
                releaseTarget.player,
                releaseTarget.flag,
                countryName(releaseTarget.country, lang),
              )}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={releasing}
                onClick={() => {
                  onRelease(releaseTarget.country)
                  setReleaseTarget(null)
                }}
                className="min-h-12 rounded-xl bg-status-failed text-base font-bold text-paper transition-colors hover:opacity-90 disabled:opacity-60"
              >
                {s.admin.releaseConfirm}
              </button>
              <button
                type="button"
                onClick={() => setReleaseTarget(null)}
                className="min-h-11 rounded-xl text-sm font-bold text-ink-soft transition-colors hover:text-ink"
              >
                {s.admin.releaseKeep(releaseTarget.player)}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Start confirm */}
      <BottomSheet open={startConfirm} onClose={() => setStartConfirm(false)} title={s.admin.startTitle}>
        <div className="flex flex-col gap-4">
          <p className="text-lg text-ink">{s.admin.startBody}</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={starting}
              onClick={() => {
                onStart()
                setStartConfirm(false)
              }}
              className="min-h-12 rounded-xl bg-ink text-base font-bold text-paper transition-colors hover:bg-ink/90 disabled:opacity-60"
            >
              {s.admin.startConfirm}
            </button>
            <button
              type="button"
              onClick={() => setStartConfirm(false)}
              className="min-h-11 rounded-xl text-sm font-bold text-ink-soft transition-colors hover:text-ink"
            >
              {s.admin.startNotYet}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
