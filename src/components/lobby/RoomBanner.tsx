import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Users } from 'lucide-react'
import { useStrings } from '@/lib/i18n'
import lobbyStrings from '@/lib/i18n/lobby'

/** Tween a displayed number towards `value` over 500ms on change. */
function useCountUp(value: number, duration = 500): number {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (from === value) return
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return display
}

export interface RoomBannerProps {
  code: string
  claimed: number
  total: number
  isAdmin: boolean
  onCopy: () => void
}

/** Wide strip under the header: room code, joined counter, waiting hint. */
export default function RoomBanner({ code, claimed, total, isAdmin, onCopy }: RoomBannerProps) {
  const s = useStrings(lobbyStrings)
  const shown = useCountUp(claimed)
  const pct = Math.round((claimed / Math.max(1, total)) * 100)
  const allFilled = claimed >= total
  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">{s.banner.codeLabel}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-[32px] font-semibold leading-9 tracking-[0.12em] text-ink">
              {code}
            </span>
            <button
              type="button"
              onClick={onCopy}
              aria-label={s.banner.copyCode}
              title={s.banner.copyCode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-w-[220px]">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Users className="h-4 w-4 text-ink-soft" aria-hidden />
            {s.banner.claimed(shown, total)}
          </p>
          <div className="mt-2 flex items-center gap-1" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{ backgroundColor: i < Math.round(pct / 10) ? '#C49A33' : '#E3DAC6' }}
                transition={{ duration: 0.4 }}
                className="h-2.5 flex-1 rounded-full"
              />
            ))}
          </div>
        </div>

        <motion.span
          key={allFilled ? 'full' : isAdmin ? 'admin' : 'waiting'}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="inline-flex w-fit items-center rounded-full bg-gold-soft px-4 py-2 text-sm font-extrabold text-gold-ink"
        >
          {allFilled
            ? s.banner.allFilled
            : isAdmin
              ? s.banner.youAreTeacher
              : s.banner.waiting}
        </motion.span>
      </div>
    </motion.section>
  )
}
