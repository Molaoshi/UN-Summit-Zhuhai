import { motion } from 'framer-motion'
import PowerChip from '@/components/PowerChip'
import { useLang, useStrings } from '@/lib/i18n'
import { countryName, dealTypeName, powerName } from '@/lib/i18n/shared'
import { playStrings } from '@/lib/i18n/play'
import { DEAL_TYPES } from '@/lib/game-ui'
import type { DealType } from '@/lib/game-ui'
import type { DealTypeKey } from '@contracts/game-data'
import { cn } from '@/lib/utils'

export interface DealTicketProps {
  dealType: DealType
  from: { flag: string; name: string }
  to: { flag: string; name: string }
  /** Offered power card name (raw English key — localized inside). */
  powerName: string
  /** Optional italic note, e.g. "in exchange for open borders". */
  note?: string
  /** Points each side gets: 3 inside bloc, 2 outside. */
  pointsEach?: 2 | 3
  round?: number
  state?: 'pending' | 'signed' | 'cancelled'
  className?: string
}

/** UI kit deal type → contract deal-type key (for dealTypeName). */
const CONTRACT_KEY: Record<DealType, DealTypeKey> = {
  military: 'military',
  infrastructure: 'resources',
  energy: 'energy',
  technology: 'tech',
}

function Stamp({ label, color, dashed = false }: { label: string; color: string; dashed?: boolean }) {
  return (
    <motion.span
      initial={{ scale: 2.4, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="pointer-events-none absolute right-4 top-4 rounded border-2 px-2.5 py-1 text-sm font-extrabold uppercase tracking-[0.12em]"
      style={{ color, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid', backgroundColor: 'rgba(253,250,243,0.85)' }}
      aria-hidden
    >
      {label}
    </motion.span>
  )
}

/** Bilingual treaty-form card for a deal / offer (player dashboard copy). */
export default function DealTicket({
  dealType,
  from,
  to,
  powerName: power,
  note,
  pointsEach = 2,
  round,
  state = 'pending',
  className,
}: DealTicketProps) {
  const { lang } = useLang()
  const s = useStrings(playStrings)
  const meta = DEAL_TYPES[dealType]
  const typeLabel = dealTypeName(CONTRACT_KEY[dealType], lang)
  return (
    <motion.article
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative overflow-hidden rounded-2xl border border-hairline bg-card p-5 shadow-card', className)}
    >
      {/* Double-rule treaty header */}
      <div className="border-b border-ink/15 pb-2" style={{ boxShadow: '0 3px 0 -1.5px rgba(30,58,60,0.15)' }}>
        <span className="text-xs font-extrabold uppercase tracking-[0.10em]" style={{ color: meta.color }}>
          {s.dealHeader(typeLabel)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-lg font-extrabold text-ink">
        <span>
          {from.flag} {countryName(from.name, lang)}
        </span>
        <span className="text-ink-faint" aria-hidden>
          →
        </span>
        <span>
          {to.flag} {countryName(to.name, lang)}
        </span>
        <PowerChip name={powerName(power, lang)} dealType={dealType} />
      </div>
      {note && <p className="mt-2 text-base italic text-ink-soft">“{note}”</p>}
      <div className="mt-4 flex items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1',
            pointsEach === 3 ? 'bg-gold-soft text-gold-ink ring-gold' : 'bg-paper-deep text-ink-soft ring-hairline',
          )}
        >
          {s.ptsEach(pointsEach)}
        </span>
        {round != null && (
          <span className="rounded-full border border-hairline px-2 py-0.5 font-mono text-xs font-semibold text-ink-soft">
            R{round}
          </span>
        )}
      </div>
      {state === 'signed' && <Stamp label={s.stampSigned} color="#2E6E6A" />}
      {state === 'cancelled' && <Stamp label={s.stampCancelled} color="#A94438" />}
      {state === 'pending' && <Stamp label={s.stampPending} color="#8B8F82" dashed />}
    </motion.article>
  )
}
