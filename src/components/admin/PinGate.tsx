import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Lock } from 'lucide-react'
import type { AdminCreds } from '@/components/admin/admin-utils'

export interface PinGateProps {
  /** Pre-filled room code (e.g. from the URL). */
  initialCode?: string
  /** Error from a rejected sign-in attempt (wrong PIN). */
  error?: string | null
  onSubmit: (creds: AdminCreds) => void
}

/** Teacher sign-in card shown before the dashboard (PIN gate). */
export default function PinGate({ initialCode = '', error, onSubmit }: PinGateProps) {
  const [code, setCode] = useState(initialCode)
  const [pin, setPin] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const shownError = localError ?? error ?? null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    const cleanPin = pin.trim()
    if (!cleanCode) {
      setLocalError('Enter the room code.')
      return
    }
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setLocalError('The admin PIN is 4–6 characters.')
      return
    }
    setLocalError(null)
    onSubmit({ code: cleanCode, pin: cleanPin })
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4 py-10">
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-hairline bg-card p-6 shadow-card md:p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo-mark.svg" alt="" className="mb-3 h-12 w-12" />
          <h1 className="font-display text-2xl font-semibold text-ink">Teacher sign-in</h1>
          <p className="mt-1 text-base text-ink-soft">
            This control room is for the teacher only.
          </p>
        </div>
        <motion.form
          key={shownError ?? 'ok'}
          animate={shownError ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={submit}
          className="space-y-4"
        >
          <div>
            <label htmlFor="admin-code" className="mb-1.5 block text-sm font-bold text-ink">
              Room code
            </label>
            <input
              id="admin-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="KITE42"
              autoComplete="off"
              className="w-full rounded-xl border border-hairline bg-paper px-4 py-3 font-mono text-lg font-semibold uppercase tracking-[0.12em] text-ink placeholder:text-ink-faint"
            />
          </div>
          <div>
            <label htmlFor="admin-pin" className="mb-1.5 block text-sm font-bold text-ink">
              Admin PIN
            </label>
            <input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4–6 digits"
              autoComplete="off"
              className="w-full rounded-xl border border-hairline bg-paper px-4 py-3 font-mono text-lg font-semibold tracking-[0.12em] text-ink placeholder:text-ink-faint"
            />
          </div>
          {shownError && (
            <p role="alert" className="text-sm font-bold text-status-failed">
              {shownError}
            </p>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-lg font-extrabold text-paper shadow-card transition-colors hover:bg-ink/90"
          >
            <KeyRound className="h-5 w-5" aria-hidden />
            Open dashboard
          </motion.button>
          <p className="flex items-center justify-center gap-1.5 text-sm text-ink-faint">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Students never see this page.
          </p>
        </motion.form>
      </motion.div>
    </div>
  )
}
