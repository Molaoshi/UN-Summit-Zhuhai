import { motion } from 'framer-motion'
import { Check, Eye, Handshake } from 'lucide-react'
import type { CountryData } from '@contracts/game-data'
import { useLang, useStrings } from '@/lib/i18n'
import { countryName } from '@/lib/i18n/shared'
import lobbyStrings from '@/lib/i18n/lobby'
import { DEAL_TYPES } from '@/lib/game-ui'
import type { DealType } from '@/lib/game-ui'
import { cn } from '@/lib/utils'

export interface SeatInfo {
  country: string
  flag: string
  startingBloc: string
  claimedBy: string | null
}

/** Asset key in game-data → DealType key in game-ui metadata. */
const ASSET_TO_DEAL: Record<string, DealType> = {
  military: 'military',
  resources: 'infrastructure',
  energy: 'energy',
  tech: 'technology',
}

const ASSET_ROWS: { key: keyof typeof lobbyStrings.en.seat.assetShort }[] = [
  { key: 'military' },
  { key: 'resources' },
  { key: 'energy' },
  { key: 'tech' },
]

/** Tiny 10-segment rating preview (2×8px segments). */
function MiniRating({ dealType, value }: { dealType: DealType; value: number }) {
  const color = DEAL_TYPES[dealType].color
  const v = Math.max(0, Math.min(10, Math.round(value)))
  return (
    <span className="flex items-center gap-[2px]" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="h-2 w-[2px] rounded-full"
          style={{ backgroundColor: i < v ? color : '#E3DAC6' }}
        />
      ))}
    </span>
  )
}

export interface SeatCardProps {
  seat: SeatInfo
  data: CountryData
  mine: boolean
  /** Flash gold-soft when the seat state changed during polling. */
  pulse?: boolean
  staggerDelay?: number
  onTake: () => void
}

/** One country seat in the lobby seat map. */
export default function SeatCard({ seat, data, mine, pulse = false, staggerDelay = 0, onTake }: SeatCardProps) {
  const { lang } = useLang()
  const s = useStrings(lobbyStrings)
  const taken = !mine && seat.claimedBy !== null
  const displayName = countryName(seat.country, lang)
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: staggerDelay }}
      className={cn(
        'relative flex min-h-[150px] flex-col gap-3 rounded-2xl border p-5',
        mine && 'border-2 border-ink bg-gold-soft',
        taken && 'border-hairline bg-paper-deep',
        !mine && !taken && 'border-hairline bg-card shadow-card',
      )}
    >
      {pulse && (
        <motion.div
          key={`pulse-${seat.claimedBy ?? 'open'}`}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gold-soft"
          aria-hidden
        />
      )}

      {/* Top row: flag + name + special badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={cn('text-[32px] leading-none', taken && 'opacity-45')} aria-hidden>
            {seat.flag}
          </span>
          <h3 className={cn('text-lg font-extrabold leading-6', taken ? 'text-ink-soft' : 'text-ink')}>
            {displayName}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          {data.hasEspionage && (
            <span
              title={s.seat.espionageTitle}
              className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.08em] text-gold-ink"
            >
              <Eye className="h-3 w-3" aria-hidden />
              {s.seat.espionage}
            </span>
          )}
          {data.freeCrossBloc && (
            <span
              title={s.seat.freeTraderTitle}
              className="inline-flex items-center gap-1 rounded-full bg-status-ontrack-soft px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.08em] text-status-ontrack"
            >
              <Handshake className="h-3 w-3" aria-hidden />
              {s.seat.freeTrader}
            </span>
          )}
        </div>
      </div>

      {/* Asset rating previews */}
      <div className={cn('flex flex-col gap-1.5', taken && 'opacity-45')}>
        {ASSET_ROWS.map(({ key }) => {
          const dealType = ASSET_TO_DEAL[key]
          const rating = data.assets[key].rating
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <span
                className="w-8 text-xs font-extrabold uppercase tracking-[0.10em]"
                style={{ color: DEAL_TYPES[dealType].color }}
              >
                {s.seat.assetShort[key]}
              </span>
              <MiniRating dealType={dealType} value={rating} />
            </div>
          )
        })}
      </div>

      {/* Bottom: state-dependent */}
      <div className="mt-auto pt-1">
        {mine ? (
          <motion.p
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex min-h-12 items-center gap-2 text-base font-bold text-ink"
          >
            <Check className="h-5 w-5 shrink-0 text-gold-ink" aria-hidden />
            {s.seat.youAre(seat.flag, displayName)}
          </motion.p>
        ) : taken ? (
          <p className="flex min-h-12 items-center text-base font-semibold text-ink-soft">
            {s.seat.claimedBy(seat.claimedBy ?? '')}
          </p>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onTake}
            className="min-h-12 w-full rounded-xl border-2 border-ink text-base font-bold text-ink transition-colors hover:bg-paper-deep"
          >
            {s.seat.take}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
