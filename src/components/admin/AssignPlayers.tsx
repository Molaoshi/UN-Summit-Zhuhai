import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserX, Users } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useLang, useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { countryName } from '@/lib/i18n/shared'
import { cn } from '@/lib/utils'

export interface AssignablePlayer {
  id: number
  name: string
  /** Country this player currently holds, or null when unassigned. */
  country: string | null
}

export interface AssignableCountry {
  country: string
  flag: string
  playerName: string | null
  playerId: number | null
}

export interface AssignPlayersProps {
  code: string
  pin: string
  /** Every joined (non-admin) player, seated or waiting. */
  players: AssignablePlayer[]
  /** The room's ACTIVE countries with their current holders. */
  countries: AssignableCountry[]
  onToast: (message: string) => void
  /** Called after a successful change so the parent refetches state. */
  onChanged: () => void
}

/**
 * Teacher assignment panel: seat every joined player at a country. Works in
 * the lobby AND mid-game (late joiners) — admin.assignSeat accepts both.
 * Reused by the Admin dashboard and the Lobby teacher controls.
 */
export default function AssignPlayers({
  code,
  pin,
  players,
  countries,
  onToast,
  onChanged,
}: AssignPlayersProps) {
  const { lang } = useLang()
  const t = useStrings(adminStrings)
  const a = t.assign
  const [releaseAllOpen, setReleaseAllOpen] = useState(false)
  const [releasingAll, setReleasingAll] = useState(false)
  const [busyPlayerId, setBusyPlayerId] = useState<number | null>(null)

  const locked = pin.length === 0
  const seatedCount = players.filter((p) => p.country !== null).length
  const holderByCountry = new Map(countries.map((c) => [c.country, c.playerName]))

  const assign = trpc.admin.assignSeat.useMutation()
  const release = trpc.admin.releaseSeat.useMutation()

  const handleAssign = async (player: AssignablePlayer, country: string) => {
    if (!country || locked || assign.isPending) return
    setBusyPlayerId(player.id)
    try {
      const res = await assign.mutateAsync({ code, pin, playerId: player.id, country })
      const label = countryName(res.country, lang)
      if (res.evictedPlayer) {
        onToast(a.toastAssignedEvicted(res.playerName, label, res.evictedPlayer.name))
      } else if (!res.changed) {
        onToast(a.toastAlready(res.playerName, label))
      } else {
        onToast(a.toastAssigned(res.playerName, label))
      }
      onChanged()
    } catch (e) {
      onToast(e instanceof Error ? e.message : a.toastAssignFailed)
    } finally {
      setBusyPlayerId(null)
    }
  }

  const handleRelease = async (player: AssignablePlayer) => {
    if (!player.country || locked || release.isPending) return
    setBusyPlayerId(player.id)
    try {
      await release.mutateAsync({ code, pin, country: player.country })
      onToast(a.toastReleased(player.name))
      onChanged()
    } catch (e) {
      onToast(e instanceof Error ? e.message : a.toastReleaseFailed)
    } finally {
      setBusyPlayerId(null)
    }
  }

  const confirmReleaseAll = async () => {
    setReleaseAllOpen(false)
    setReleasingAll(true)
    try {
      for (const p of players) {
        if (p.country) await release.mutateAsync({ code, pin, country: p.country })
      }
      onToast(t.seats.toastAllReleased)
      onChanged()
    } catch (e) {
      onToast(e instanceof Error ? e.message : a.toastReleaseFailed)
    } finally {
      setReleasingAll(false)
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft">
            <Users className="h-5 w-5 text-gold-ink" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-semibold text-ink">{a.title}</h2>
            <p className="text-sm font-semibold text-ink-soft">
              {a.seatedCount(seatedCount, players.length)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReleaseAllOpen(true)}
            disabled={locked || seatedCount === 0 || releasingAll}
            className="text-sm font-extrabold text-status-failed transition-colors hover:underline disabled:opacity-40"
          >
            {t.seats.releaseAll}
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-soft">{a.subtitle}</p>

        {players.length === 0 ? (
          <p className="mt-4 rounded-xl bg-paper-deep px-4 py-3 text-sm font-semibold text-ink-faint">
            {a.empty}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline">
            {players.map((p) => {
              const busy = busyPlayerId === p.id
              return (
                <motion.li
                  key={p.id}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-wrap items-center gap-2 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-ink">{p.name}</span>
                    {p.country ? (
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-extrabold text-gold-ink">
                        <span aria-hidden>{countries.find((c) => c.country === p.country)?.flag}</span>
                        {countryName(p.country, lang)}
                      </span>
                    ) : (
                      <span className="mt-0.5 inline-flex rounded-full border border-dashed border-hairline px-2.5 py-0.5 text-xs font-extrabold text-ink-faint">
                        {a.unassigned}
                      </span>
                    )}
                  </span>
                  <select
                    value={p.country ?? ''}
                    disabled={locked || busy}
                    onChange={(e) => void handleAssign(p, e.target.value)}
                    aria-label={a.selectAria(p.name)}
                    className={cn(
                      'min-h-11 max-w-[190px] rounded-xl border border-hairline bg-paper px-2.5 text-sm font-bold text-ink outline-none transition-colors focus:border-gold disabled:opacity-60',
                    )}
                  >
                    <option value="" disabled>
                      {a.placeholder}
                    </option>
                    {countries.map((c) => {
                      const holder = holderByCountry.get(c.country)
                      const heldByOther = holder && holder !== p.name
                      return (
                        <option key={c.country} value={c.country}>
                          {c.flag} {countryName(c.country, lang)}
                          {heldByOther ? ` — ${a.holderSuffix(holder)}` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {p.country && (
                    <button
                      type="button"
                      onClick={() => void handleRelease(p)}
                      disabled={locked || busy}
                      title={a.releaseAria(p.name)}
                      aria-label={a.releaseAria(p.name)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-paper text-ink-soft transition-colors hover:border-status-failed hover:bg-status-failed-soft hover:text-status-failed disabled:opacity-50"
                    >
                      <UserX className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </motion.li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={releaseAllOpen}
        onClose={() => setReleaseAllOpen(false)}
        title={t.seats.confirmReleaseAll.title}
        body={t.seats.confirmReleaseAll.body}
        effects={t.seats.confirmReleaseAll.effects(seatedCount)}
        confirmLabel={t.seats.confirmReleaseAll.confirmLabel}
        tone="danger"
        loading={releasingAll}
        onConfirm={() => void confirmReleaseAll()}
      />
    </section>
  )
}
