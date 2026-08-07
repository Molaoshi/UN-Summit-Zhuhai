import { motion } from 'framer-motion'
import { Eye, Handshake } from 'lucide-react'
import BlocBadge from '@/components/BlocBadge'
import PowerChip from '@/components/PowerChip'
import RatingBar from '@/components/RatingBar'
import { DEAL_TYPES } from '@/lib/game-ui'
import type { AssetKey, CountryData } from '@contracts/game-data'
import { ASSET_ORDER, blocKeyFor, toUiDealType } from './helpers'

export interface CountryDossierProps {
  country: CountryData
  blocName: string
  allBlocNames: string[]
}

/** My Country dossier: flag, bloc, special badges, assets + power cards. */
export default function CountryDossier({
  country,
  blocName,
  allBlocNames,
}: CountryDossierProps) {
  return (
    <section
      aria-label="My country dossier"
      className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6"
    >
      {/* Double-rule document header */}
      <div
        className="border-b border-ink/15 pb-2"
        style={{ boxShadow: '0 3px 0 -1.5px rgba(30,58,60,0.15)' }}
      >
        <span className="text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
          Country dossier
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span aria-hidden className="text-[44px] leading-none">
          {country.flag}
        </span>
        <h2 className="font-display text-2xl font-semibold text-ink">
          {country.name}
        </h2>
        <BlocBadge
          bloc={blocKeyFor(blocName, allBlocNames)}
          name={blocName}
          size="md"
          showIcon
        />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {country.hasEspionage && (
          <p className="flex items-start gap-2 rounded-xl border-2 border-dashed border-gold bg-gold-soft/50 px-3 py-2 text-sm font-bold text-gold-ink">
            <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="uppercase tracking-[0.10em]">Espionage</span> —
              You can see every country's power cards, and peek at one private
              mission.
            </span>
          </p>
        )}
        {country.freeCrossBloc && (
          <p className="flex items-start gap-2 rounded-xl bg-status-ontrack-soft px-3 py-2 text-sm font-bold text-status-ontrack">
            <Handshake className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="uppercase tracking-[0.10em]">
                Free Trader · 3 pts everywhere
              </span>{' '}
              — Your military is 3 or less: every deal earns you 3 points.
            </span>
          </p>
        )}
      </div>

      <div className="mt-4 divide-y divide-hairline">
        {ASSET_ORDER.map((asset: AssetKey, i) => {
          const data = country.assets[asset]
          const uiType = toUiDealType(asset)
          const meta = DEAL_TYPES[uiType]
          const Icon = meta.icon
          return (
            <motion.div
              key={asset}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.1 + i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="py-4 first:pt-2 last:pb-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-ink">
                  <Icon
                    className="h-5 w-5"
                    style={{ color: meta.color }}
                    aria-hidden
                  />
                  {meta.asset}
                </h3>
                <RatingBar dealType={uiType} value={data.rating} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {data.powers.map((p, j) => (
                  <motion.span
                    key={p}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 22,
                      delay: 0.15 + i * 0.07 + j * 0.04,
                    }}
                  >
                    <PowerChip
                      name={p}
                      dealType={uiType}
                      espionage={p === 'Espionage'}
                    />
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
