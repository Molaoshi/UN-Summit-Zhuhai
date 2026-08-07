import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PenLine } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import BottomSheet from '@/components/BottomSheet'
import { useAdminCtx } from '@/components/admin/admin-utils'
import type { AdminCountry } from '@/components/admin/admin-utils'
import { useLang, useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { countryName } from '@/lib/i18n/shared'
import { cn } from '@/lib/utils'

export interface ScoreAdjustSheetProps {
  country: AdminCountry | null
  onClose: () => void
}

/** ±N score adjustment sheet with a required reason note (audited in the log). */
export default function ScoreAdjustSheet({ country, onClose }: ScoreAdjustSheetProps) {
  const { lang } = useLang()
  const t = useStrings(adminStrings).adjust
  const { creds, notify, refresh } = useAdminCtx()
  const [delta, setDelta] = useState(0)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (country) {
      setDelta(0)
      setReason('')
    }
  }, [country])

  const adjust = trpc.admin.adjustScore.useMutation({
    onSuccess: () => {
      notify(country ? t.toastAdjusted(countryName(country.country, lang), delta) : t.toastGeneric)
      refresh()
      onClose()
    },
    onError: (e) => notify(e.message),
  })

  const valid = delta !== 0 && reason.trim().length > 0

  const apply = () => {
    if (!country || !valid) return
    adjust.mutate({
      code: creds.code,
      pin: creds.pin,
      country: country.country,
      delta,
      reason: reason.trim(),
    })
  }

  const step = (n: number) => setDelta((d) => Math.max(-100, Math.min(100, d + n)))

  return (
    <BottomSheet
      open={!!country}
      onClose={onClose}
      title={country ? t.title(countryName(country.country, lang)) : t.titleFallback}
    >
      {country && (
        <div>
          <div className="mb-5 flex items-center justify-between rounded-xl border border-hairline bg-paper px-4 py-3">
            <span className="text-lg font-extrabold text-ink">
              {country.flag} {countryName(country.country, lang)}
            </span>
            <span className="text-sm font-bold text-ink-soft">
              {t.currentTotal}{' '}
              <span className="font-mono text-xl font-semibold text-ink">{country.score.total}</span>
            </span>
          </div>

          <div className="mb-2 text-sm font-bold text-ink">{t.adjustment}</div>
          <div className="mb-5 flex items-center justify-center gap-2">
            {[-5, -1].map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => step(n)}
                className="h-12 w-14 rounded-xl border border-hairline bg-paper font-mono text-lg font-semibold text-status-failed transition-colors hover:bg-status-failed-soft"
              >
                {n}
              </motion.button>
            ))}
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(Math.max(-100, Math.min(100, Number(e.target.value) || 0)))}
              className={cn(
                'h-12 w-24 rounded-xl border border-hairline bg-paper text-center font-mono text-2xl font-semibold',
                delta > 0 ? 'text-status-completed' : delta < 0 ? 'text-status-failed' : 'text-ink',
              )}
              aria-label={t.adjustmentAria}
            />
            {[1, 5].map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => step(n)}
                className="h-12 w-14 rounded-xl border border-hairline bg-paper font-mono text-lg font-semibold text-status-completed transition-colors hover:bg-status-completed-soft"
              >
                +{n}
              </motion.button>
            ))}
          </div>

          <div className="mb-1 text-sm font-bold text-ink">
            {t.reason} <span className="text-status-failed">{t.required}</span>
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t.reasonPlaceholder}
            maxLength={255}
            className="mb-1 w-full rounded-xl border border-hairline bg-paper px-4 py-3 text-base text-ink placeholder:text-ink-faint"
          />
          <p className="mb-5 text-sm text-ink-faint">{t.reasonNote}</p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={!valid || adjust.isPending}
            onClick={apply}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-status-failed bg-card px-5 py-3.5 text-lg font-extrabold text-status-failed transition-colors hover:bg-status-failed-soft disabled:opacity-50"
          >
            <PenLine className="h-5 w-5" aria-hidden />
            {adjust.isPending ? t.applying : t.apply(delta)}
          </motion.button>
        </div>
      )}
    </BottomSheet>
  )
}
