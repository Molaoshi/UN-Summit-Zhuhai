import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, Globe } from 'lucide-react'
import {
  ALL_COUNTRY_NAMES,
  ALWAYS_ACTIVE,
  COUNTRY_BY_NAME,
  NAMED_DEPENDENCIES,
  countryHasPower,
} from '@contracts/game-data'
import type { CompareOp, MissionCondition } from '@contracts/game-data'
import { trpc } from '@/providers/trpc'
import { useLang, useStrings } from '@/lib/i18n'
import { blocName, countryName } from '@/lib/i18n/shared'
import lobbyStrings from '@/lib/i18n/lobby'
import { STARTING_BLOC_META } from './bloc-meta'
import { cn } from '@/lib/utils'

export interface CountryPickerProps {
  code: string
  pin: string
  /** Roster currently active on the server. */
  activeCountries: string[]
  /** The roster can only change while the room is in the lobby. */
  canEdit: boolean
  onToast: (message: string) => void
  /** Called after a successful save so the parent refetches lobby state. */
  onSaved: () => void
}

/** Close a selection under NAMED_DEPENDENCIES (e.g. South Korea ⇒ Japan). */
function withDependencies(selected: ReadonlySet<string>): Set<string> {
  const next = new Set(selected)
  let changed = true
  while (changed) {
    changed = false
    for (const name of [...next]) {
      for (const dep of NAMED_DEPENDENCIES[name] ?? []) {
        if (!next.has(dep)) {
          next.add(dep)
          changed = true
        }
      }
    }
  }
  return next
}

function compareRating(rating: number, op: CompareOp, value: number): boolean {
  switch (op) {
    case 'gt':
      return rating > value
    case 'gte':
      return rating >= value
    case 'lt':
      return rating < value
    case 'lte':
      return rating <= value
  }
}

/**
 * Soft (non-blocking) roster warnings: selected countries whose missions
 * reference a power / energy rating / partner that no selected country has.
 * Computed client-side from the contracts mission-condition DSL.
 */
function missionsAtRisk(selected: ReadonlySet<string>): string[] {
  const roster = ALL_COUNTRY_NAMES.filter((n) => selected.has(n))
  const atRisk = new Set<string>()

  const walk = (owner: string, cond: MissionCondition) => {
    switch (cond.kind) {
      case 'all':
        for (const c of cond.conditions) walk(owner, c)
        break
      case 'deal_with_country':
        if (!selected.has(cond.country)) atRisk.add(owner)
        break
      case 'deal_with_power':
        if (!roster.some((n) => countryHasPower(n, cond.power))) atRisk.add(owner)
        break
      case 'deal_with_power_each':
        if (cond.powers.some((p) => !roster.some((n) => countryHasPower(n, p)))) atRisk.add(owner)
        break
      case 'deal_with_energy_rating':
        if (
          !roster.some((n) =>
            compareRating(COUNTRY_BY_NAME[n]?.assets.energy.rating ?? 0, cond.op, cond.value),
          )
        )
          atRisk.add(owner)
        break
      default:
        break
    }
  }

  for (const name of roster) {
    const data = COUNTRY_BY_NAME[name]
    if (!data) continue
    for (const m of data.missions) walk(name, m.condition)
  }
  return ALL_COUNTRY_NAMES.filter((n) => atRisk.has(n))
}

/** Collapsible "Countries in this summit" card in the lobby admin panel. */
export default function CountryPicker({
  code,
  pin,
  activeCountries,
  canEdit,
  onToast,
  onSaved,
}: CountryPickerProps) {
  const { lang } = useLang()
  const s = useStrings(lobbyStrings)
  const [open, setOpen] = useState(true)
  const [draft, setDraft] = useState<Set<string>>(() => new Set(activeCountries))
  const setCountries = trpc.admin.setCountries.useMutation()

  // Reset the draft whenever the server roster changes (initial load / save).
  const rosterKey = [...activeCountries].sort().join('|')
  useEffect(() => {
    setDraft(new Set(activeCountries))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterKey])

  const dirty = useMemo(() => {
    if (draft.size !== activeCountries.length) return true
    return activeCountries.some((n) => !draft.has(n))
  }, [draft, activeCountries])

  /** Countries that must stay checked because a selected country needs them. */
  const lockedByDependency = useMemo(() => {
    const locked = new Map<string, string[]>()
    for (const name of draft) {
      for (const dep of NAMED_DEPENDENCIES[name] ?? []) {
        if (draft.has(dep)) locked.set(dep, [...(locked.get(dep) ?? []), name])
      }
    }
    return locked
  }, [draft])

  const toggle = (name: string) => {
    if (!canEdit) return
    if (ALWAYS_ACTIVE.includes(name)) return
    if (draft.has(name) && lockedByDependency.has(name)) return
    setDraft((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next.has(name) ? withDependencies(next) : next
    })
  }

  const atRisk = useMemo(() => missionsAtRisk(draft), [draft])
  const canSave = canEdit && dirty && pin.length > 0 && !setCountries.isPending

  const save = async () => {
    if (!canSave) return
    try {
      const res = await setCountries.mutateAsync({
        code,
        pin,
        countries: ALL_COUNTRY_NAMES.filter((n) => draft.has(n)),
      })
      const parts = [s.countries.saved]
      if (res.addedCountries.length > 0) {
        parts.push(s.countries.savedAdded(res.addedCountries.map((n) => countryName(n, lang)).join(', ')))
      }
      if (res.unclaimed.length > 0) {
        parts.push(
          s.countries.savedUnclaimed(
            res.unclaimed.map((u) => `${countryName(u.country, lang)} (${u.player})`).join(', '),
          ),
        )
      }
      onToast(parts.join(' '))
      onSaved()
    } catch (e) {
      onToast(e instanceof Error ? e.message : s.countries.saveFailed)
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-left md:px-6"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft">
          <Globe className="h-5 w-5 text-gold-ink" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold leading-6 text-ink">
            {s.countries.title}
          </span>
          <span className="block text-sm font-semibold text-ink-soft">
            {s.countries.selected(draft.size)}
          </span>
        </span>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-ink-soft transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 md:px-6">
              <p className="text-sm text-ink-soft">{s.countries.hint}</p>

              <div className="mt-3 flex flex-col gap-3">
                {STARTING_BLOC_META.map((bloc) => {
                  const names = ALL_COUNTRY_NAMES.filter(
                    (n) => COUNTRY_BY_NAME[n]?.startingBloc === bloc.name,
                  )
                  if (names.length === 0) return null
                  return (
                    <div key={bloc.name}>
                      <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
                        {blocName(bloc.name, lang)}
                      </p>
                      <div className="flex flex-col gap-1">
                        {names.map((name) => {
                          const data = COUNTRY_BY_NAME[name]
                          const checked = draft.has(name)
                          const always = ALWAYS_ACTIVE.includes(name)
                          const neededBy = lockedByDependency.get(name)
                          const disabled = !canEdit || always || (checked && !!neededBy)
                          const tooltip = always
                            ? s.countries.always
                            : checked && neededBy
                              ? s.countries.neededBy(
                                  neededBy.map((n) => countryName(n, lang)).join(', '),
                                )
                              : undefined
                          return (
                            <label
                              key={name}
                              title={tooltip}
                              className={cn(
                                'flex min-h-10 items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-colors',
                                checked ? 'border-hairline bg-paper-deep' : 'border-hairline bg-card',
                                disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-paper-deep',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggle(name)}
                                className="h-4 w-4 shrink-0 accent-[#1A1A2E]"
                              />
                              <span aria-hidden>{data?.flag}</span>
                              <span className="text-sm font-bold text-ink">
                                {countryName(name, lang)}
                              </span>
                              {always && (
                                <span className="ml-auto text-xs font-semibold text-ink-faint">
                                  {s.countries.always}
                                </span>
                              )}
                              {!always && checked && neededBy && (
                                <span className="ml-auto text-xs font-semibold text-ink-faint">
                                  {s.countries.neededBy(
                                    neededBy.map((n) => countryName(n, lang)).join(', '),
                                  )}
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {atRisk.length > 0 && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-status-atrisk-soft px-3 py-2 text-sm font-semibold text-status-atrisk">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {s.countries.warning(atRisk.map((n) => countryName(n, lang)).join(', '))}
                </p>
              )}
              {!canEdit && (
                <p className="mt-3 text-sm font-semibold text-ink-soft">{s.countries.onlyLobby}</p>
              )}

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={!canSave}
                onClick={save}
                className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-ink text-base font-bold text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {setCountries.isPending ? s.countries.saving : s.countries.save}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
