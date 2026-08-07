import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Check, Landmark } from 'lucide-react'
import BlocBadge from '@/components/BlocBadge'
import { useLang, useStrings } from '@/lib/i18n'
import { blocName } from '@/lib/i18n/shared'
import { playStrings } from '@/lib/i18n/play'
import { cn } from '@/lib/utils'
import { blocKeyFor } from './helpers'

export interface BlocChoiceCardProps {
  blocs: Record<string, string>
  myCountryName: string
  choosing: boolean
  /** Bumps when a choice succeeded — switches the button to "Change my choice". */
  hasChosen: boolean
  onChoose: (blocName: string) => void
}

interface BlocOption {
  name: string
  members: number
}

/** Round-end bloc choice: stay, join another bloc, or found a new one. */
export default function BlocChoiceCard({
  blocs,
  myCountryName,
  choosing,
  hasChosen,
  onChoose,
}: BlocChoiceCardProps) {
  const myCurrent = blocs[myCountryName] ?? ''
  const [selected, setSelected] = useState<string>(myCurrent)
  const [founding, setFounding] = useState(false)
  const [newName, setNewName] = useState('')
  const { lang } = useLang()
  const s = useStrings(playStrings)

  useEffect(() => {
    setSelected(myCurrent)
  }, [myCurrent])

  const options = useMemo<BlocOption[]>(() => {
    const counts = new Map<string, number>()
    for (const blocName of Object.values(blocs)) {
      counts.set(blocName, (counts.get(blocName) ?? 0) + 1)
    }
    const starting = ['Nuclear Energy', 'Green Energy', 'Fossil Fuel']
    return [...counts.entries()]
      .map(([name, members]) => ({ name, members }))
      .sort((a, b) => {
        const ai = starting.indexOf(a.name)
        const bi = starting.indexOf(b.name)
        if (ai !== -1 || bi !== -1) {
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        }
        return a.name.localeCompare(b.name)
      })
  }, [blocs])

  const allBlocNames = options.map((o) => o.name)
  const trimmed = newName.trim()
  const effectiveChoice = founding ? trimmed : selected
  const canConfirm =
    !choosing && effectiveChoice.length >= 2 && effectiveChoice.length <= 24

  return (
    <motion.section
      aria-label={s.blocOptions}
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border-2 border-status-atrisk bg-card p-5 shadow-card md:p-6"
    >
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
        <AlertCircle className="h-5 w-5 text-status-atrisk" aria-hidden />
        {s.blocChoiceTitle}
      </h2>
      <p className="mt-1.5 text-base leading-[26px] text-ink-soft">
        {s.blocChoiceBody}
      </p>

      <div className="mt-4 space-y-2" role="radiogroup" aria-label={s.blocOptions}>
        {options.map((opt) => {
          const isSelected = !founding && selected === opt.name
          const isCurrent = myCurrent === opt.name
          return (
            <button
              key={opt.name}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                setFounding(false)
                setSelected(opt.name)
              }}
              className={cn(
                'flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition-colors',
                isSelected
                  ? 'border-ink bg-gold-soft ring-2 ring-ink'
                  : 'border-hairline bg-paper hover:bg-paper-deep',
              )}
            >
              <BlocBadge
                bloc={blocKeyFor(opt.name, allBlocNames)}
                name={blocName(opt.name, lang)}
                size="md"
                showIcon
              />
              <span className="flex-1 text-sm font-semibold text-ink-soft">
                {s.memberCount(opt.members)}
                {isCurrent && ` · ${s.yourCurrentBloc}`}
              </span>
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper"
                >
                  <Check className="h-4 w-4" aria-hidden />
                </motion.span>
              )}
            </button>
          )
        })}

        {/* Found a new bloc */}
        <button
          type="button"
          role="radio"
          aria-checked={founding}
          onClick={() => setFounding(true)}
          className={cn(
            'flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition-colors',
            founding
              ? 'border-ink bg-gold-soft ring-2 ring-ink'
              : 'border-dashed border-hairline bg-paper hover:bg-paper-deep',
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-deep text-ink-soft">
            <Landmark className="h-4 w-4" aria-hidden />
          </span>
          <span className="flex-1 text-base font-extrabold text-ink">
            {s.foundNewBloc}
          </span>
          {founding && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper"
            >
              <Check className="h-4 w-4" aria-hidden />
            </motion.span>
          )}
        </button>
        {founding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <input
              type="text"
              value={newName}
              maxLength={24}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={s.newBlocPlaceholder}
              aria-label={s.newBlocAria}
              className="h-12 w-full rounded-xl border border-input bg-paper px-4 text-base font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-gold"
            />
            <p className="mt-1 text-xs font-semibold text-ink-faint">
              {s.charCount(trimmed.length)}
            </p>
          </motion.div>
        )}
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={!canConfirm}
        onClick={() => onChoose(effectiveChoice)}
        className={cn(
          'mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-ink text-lg font-extrabold text-paper',
          !canConfirm && 'cursor-not-allowed opacity-40',
        )}
      >
        {choosing
          ? s.lockingIn
          : hasChosen
            ? s.changeMyChoice
            : s.lockInBloc}
      </motion.button>
    </motion.section>
  )
}
