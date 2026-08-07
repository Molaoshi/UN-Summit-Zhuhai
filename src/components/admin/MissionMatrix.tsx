import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardCheck, PenLine } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import StatusChip from '@/components/StatusChip'
import EmptyState from '@/components/EmptyState'
import BottomSheet from '@/components/BottomSheet'
import { missionTimingCaption, statusUi, useAdminCtx } from '@/components/admin/admin-utils'
import type { AdminCountry, AdminMission } from '@/components/admin/admin-utils'
import { cn } from '@/lib/utils'

const SLOTS = [
  { slot: 'public', label: 'Public' },
  { slot: 'private', label: 'Private' },
  { slot: 'bonus', label: 'Bonus' },
] as const

interface CellTarget {
  country: AdminCountry
  mission: AdminMission
}

/** Manual complete/fail override sheet for one mission cell. */
function OverrideSheet({ target, onClose }: { target: CellTarget | null; onClose: () => void }) {
  const { creds, notify, refresh } = useAdminCtx()
  const [note, setNote] = useState('')
  useEffect(() => setNote(''), [target])

  const override = trpc.admin.overrideMission.useMutation({
    onSuccess: (_, vars) => {
      notify(`${vars.country}'s ${vars.slot} mission marked ${vars.status}.`)
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
      title={target ? `${target.country.country} · ${target.mission.slot} mission` : 'Mission'}
    >
      {target && (
        <div>
          <p className="mb-3 text-lg leading-7 text-ink">“{target.mission.text}”</p>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-ink-soft">Automatic check:</span>
            <StatusChip status={statusUi(target.mission.status)} />
            {target.mission.overridden && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-extrabold text-gold-ink">
                <PenLine className="h-3 w-3" aria-hidden />
                Teacher override active
              </span>
            )}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (shown in the activity log)"
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
              Mark complete (+10)
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={override.isPending}
              onClick={() => mark('failed')}
              className="flex-1 rounded-xl bg-status-failed px-5 py-3.5 text-lg font-extrabold text-paper transition-colors hover:bg-status-failed/90 disabled:opacity-60"
            >
              Mark failed
            </motion.button>
          </div>
          <p className="mt-3 text-sm text-ink-faint">
            Overrides win over the automatic check and are logged for audit.
          </p>
        </div>
      )}
    </BottomSheet>
  )
}

export interface MissionMatrixProps {
  countries: AdminCountry[]
  projector: boolean
  started: boolean
}

/** 15×3 mission matrix with auto status + manual override per cell. */
export default function MissionMatrix({ countries, projector, started }: MissionMatrixProps) {
  const [target, setTarget] = useState<CellTarget | null>(null)

  if (!started) {
    return (
      <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold text-ink">Mission tracker</h2>
        <EmptyState
          icon={ClipboardCheck}
          title="Missions appear at game start"
          body="Start Round 1 from the command bar — every country's mission statuses will show here."
          className="py-10"
        />
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl font-semibold text-ink">Mission tracker</h2>
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Status legend">
          <StatusChip status="completed" />
          <StatusChip status="ontrack" />
          <StatusChip status="atrisk" />
          <StatusChip status="failed" />
        </div>
      </div>

      <div className="max-h-[640px] overflow-auto rounded-xl border border-hairline">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-paper-deep text-left text-xs font-extrabold uppercase tracking-[0.08em] text-ink-soft">
              <th className="sticky left-0 z-10 bg-paper-deep px-3 py-3">Country</th>
              {SLOTS.map((s) => (
                <th key={s.slot} className="px-3 py-3">
                  {s.label} mission
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
                  {c.country}
                </th>
                {SLOTS.map(({ slot }) => {
                  const mission = c.missions.find((m) => m.slot === slot)
                  if (!mission) return <td key={slot} className="px-3 py-2.5" />
                  const caption = missionTimingCaption(c.country, slot)
                  return (
                    <td key={slot} className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setTarget({ country: c, mission })}
                        title={`${c.country} ${slot} mission — tap to review or override`}
                        className={cn(
                          'relative w-full rounded-xl border border-hairline bg-paper px-3 py-2 text-left transition-colors hover:border-gold hover:bg-gold-soft/40',
                          mission.overridden && 'border-gold/60',
                        )}
                      >
                        {mission.overridden && (
                          <span
                            className="absolute right-1.5 top-1.5 text-gold-ink"
                            title="Teacher override active"
                          >
                            <PenLine className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        )}
                        <div className="mb-1">
                          <StatusChip status={statusUi(mission.status)} />
                        </div>
                        <p
                          className={cn(
                            'line-clamp-2 leading-5 text-ink-soft',
                            projector ? 'text-base' : 'text-sm',
                          )}
                        >
                          {mission.text}
                        </p>
                        {caption && (
                          <div className="mt-1 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-faint">
                            {caption}
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
      <p className="mt-3 text-sm font-semibold text-ink-soft">
        Tap a cell to read the full mission or override the automatic check.
      </p>
      <OverrideSheet target={target} onClose={() => setTarget(null)} />
    </section>
  )
}
