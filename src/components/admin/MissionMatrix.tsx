import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardCheck, PenLine } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import EmptyState from '@/components/EmptyState'
import BottomSheet from '@/components/BottomSheet'
import { missionTimingKey, statusUi, useAdminCtx } from '@/components/admin/admin-utils'
import type { AdminCountry, AdminMission } from '@/components/admin/admin-utils'
import { STATUSES } from '@/lib/game-ui'
import type { StatusKey } from '@/lib/game-ui'
import { useLang, useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { countryName, sharedStrings } from '@/lib/i18n/shared'
import { cn } from '@/lib/utils'

const SLOT_KEYS = ['public', 'private', 'bonus'] as const

/** StatusKey (game-ui) → sharedStrings.status key. */
const SHARED_STATUS_KEY: Record<StatusKey, keyof typeof sharedStrings.en.status> = {
  completed: 'completed',
  ontrack: 'on_track',
  atrisk: 'at_risk',
  failed: 'failed',
  pending: 'pending',
}

/** Localized status chip: game-ui colors + sharedStrings label. */
function LocalStatusChip({ status }: { status: StatusKey }) {
  const s = useStrings(sharedStrings)
  const meta = STATUSES[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-[0.10em]"
      style={{ backgroundColor: meta.soft, color: meta.color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
      {s.status[SHARED_STATUS_KEY[status]]}
    </span>
  )
}

interface CellTarget {
  country: AdminCountry
  mission: AdminMission
}

/** Manual complete/fail override sheet for one mission cell. */
function OverrideSheet({ target, onClose }: { target: CellTarget | null; onClose: () => void }) {
  const { lang } = useLang()
  const t = useStrings(adminStrings).missions
  const s = useStrings(sharedStrings)
  const { creds, notify, refresh } = useAdminCtx()
  const [note, setNote] = useState('')
  useEffect(() => setNote(''), [target])

  const override = trpc.admin.overrideMission.useMutation({
    onSuccess: (_, vars) => {
      const slotLabel = t.slots[vars.slot]
      const statusLabel =
        vars.status === 'completed' ? s.status.completed : s.status.failed
      notify(t.sheet.toast(countryName(vars.country, lang), slotLabel, statusLabel))
      refresh()
      onClose()
    },
    onError: (e) => notify(e.message),
  })

  const mark = (status: 'completed' | 'failed') => {
    if (!target) return
    override.mutate({
      code: creds.code,
      pin: creds.pin,
      country: target.country.country,
      slot: target.mission.slot,
      status,
      note: note.trim() || undefined,
    })
  }

  return (
    <BottomSheet
      open={!!target}
      onClose={onClose}
      title={
        target
          ? t.sheet.title(countryName(target.country.country, lang), t.slots[target.mission.slot])
          : t.sheet.titleFallback
      }
    >
      {target && (
        <div>
          <p className="mb-1 text-lg leading-7 text-ink">“{target.mission.text}”</p>
          <p className="mb-3 text-base leading-6 text-ink-soft">“{target.mission.textZh}”</p>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-ink-soft">{t.sheet.autoCheck}</span>
            <LocalStatusChip status={statusUi(target.mission.status)} />
            {target.mission.overridden && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-extrabold text-gold-ink">
                <PenLine className="h-3 w-3" aria-hidden />
                {t.overrideActive}
              </span>
            )}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.sheet.notePlaceholder}
            maxLength={255}
            className="mb-4 w-full rounded-xl border border-hairline bg-paper px-4 py-3 text-base text-ink placeholder:text-ink-faint"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={override.isPending}
              onClick={() => mark('completed')}
              className="flex-1 rounded-xl bg-status-completed px-5 py-3.5 text-lg font-extrabold text-paper transition-colors hover:bg-status-completed/90 disabled:opacity-60"
            >
              {t.sheet.markComplete}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={override.isPending}
              onClick={() => mark('failed')}
              className="flex-1 rounded-xl bg-status-failed px-5 py-3.5 text-lg font-extrabold text-paper transition-colors hover:bg-status-failed/90 disabled:opacity-60"
            >
              {t.sheet.markFailed}
            </motion.button>
          </div>
          <p className="mt-3 text-sm text-ink-faint">{t.sheet.footnote}</p>
        </div>
      )}
    </BottomSheet>
  )
}

export interface MissionMatrixProps {
  countries: AdminCountry[]
  projector: boolean
  started: boolean
  /** Spectator mode: cells are display-only, no override sheet. */
  readOnly?: boolean
}

/** 15×3 mission matrix with auto status + manual override per cell. */
export default function MissionMatrix({ countries, projector, started, readOnly = false }: MissionMatrixProps) {
  const { lang } = useLang()
  const t = useStrings(adminStrings).missions
  const [target, setTarget] = useState<CellTarget | null>(null)

  if (!started) {
    return (
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold text-ink">{t.title}</h2>
        <EmptyState
          icon={ClipboardCheck}
          title={t.emptyTitle}
          body={t.emptyBody}
          className="py-10"
        />
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl font-semibold text-ink">{t.title}</h2>
        <div className="flex flex-wrap items-center gap-1.5" aria-label={t.legendAria}>
          <LocalStatusChip status="completed" />
          <LocalStatusChip status="ontrack" />
          <LocalStatusChip status="atrisk" />
          <LocalStatusChip status="failed" />
        </div>
      </div>

      <div className="max-h-[640px] overflow-auto rounded-xl border border-hairline">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-paper-deep text-left text-xs font-extrabold uppercase tracking-[0.08em] text-ink-soft">
              <th className="sticky left-0 z-10 bg-paper-deep px-3 py-3">{t.countryHeader}</th>
              {SLOT_KEYS.map((slot) => (
                <th key={slot} className="px-3 py-3">
                  {t.slotMission[slot]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countries.map((c, rowIdx) => (
              <motion.tr
                key={c.country}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(rowIdx * 0.04, 0.6) }}
                className="border-t border-hairline"
              >
                <th
                  className={cn(
                    'sticky left-0 z-10 whitespace-nowrap bg-card px-3 py-2.5 text-left font-extrabold text-ink',
                    projector ? 'text-lg' : 'text-base',
                  )}
                >
                  <span className="mr-2" aria-hidden>
                    {c.flag}
                  </span>
                  {countryName(c.country, lang)}
                </th>
                {SLOT_KEYS.map((slot) => {
                  const mission = c.missions.find((m) => m.slot === slot)
                  if (!mission) return <td key={slot} className="px-3 py-2.5" />
                  const timing = missionTimingKey(c.country, slot)
                  return (
                    <td key={slot} className="px-2 py-1.5">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          if (!readOnly) setTarget({ country: c, mission })
                        }}
                        title={readOnly ? undefined : t.cellTitle(countryName(c.country, lang), t.slots[slot])}
                        className={cn(
                          'relative w-full rounded-xl border border-hairline bg-paper px-3 py-2 text-left transition-colors',
                          readOnly
                            ? 'cursor-default disabled:opacity-100'
                            : 'hover:border-gold hover:bg-gold-soft/40',
                          mission.overridden && 'border-gold/60',
                        )}
                      >
                        {mission.overridden && (
                          <span
                            className="absolute right-1.5 top-1.5 text-gold-ink"
                            title={t.overrideActiveShort}
                          >
                            <PenLine className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        )}
                        <div className="mb-1">
                          <LocalStatusChip status={statusUi(mission.status)} />
                        </div>
                        <p
                          className={cn(
                            'line-clamp-2 leading-5 text-ink',
                            projector ? 'text-base' : 'text-sm',
                          )}
                        >
                          {mission.text}
                        </p>
                        <p
                          className={cn(
                            'line-clamp-2 leading-5 text-ink-soft',
                            projector ? 'text-sm' : 'text-xs',
                          )}
                        >
                          {mission.textZh}
                        </p>
                        {timing && (
                          <div className="mt-1 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-faint">
                            {t.timing[timing]}
                          </div>
                        )}
                      </button>
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && <p className="mt-3 text-sm font-semibold text-ink-soft">{t.tapHint}</p>}
      {!readOnly && <OverrideSheet target={target} onClose={() => setTarget(null)} />}
    </section>
  )
}
