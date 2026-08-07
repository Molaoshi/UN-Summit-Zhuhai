import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserX } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useAdminCtx } from '@/components/admin/admin-utils'
import type { AdminCountry } from '@/components/admin/admin-utils'
import { useLang, useStrings } from '@/lib/i18n'
import { adminStrings } from '@/lib/i18n/admin'
import { countryName } from '@/lib/i18n/shared'
import { cn } from '@/lib/utils'

export interface SeatManagerProps {
  countries: AdminCountry[]
  projector: boolean
}

/** Seat map manager: claimed players, release seats, release-all for a rerun. */
export default function SeatManager({ countries, projector }: SeatManagerProps) {
  const { lang } = useLang()
  const t = useStrings(adminStrings).seats
  const { creds, notify, refresh } = useAdminCtx()
  const [releaseTarget, setReleaseTarget] = useState<AdminCountry | null>(null)
  const [releaseAllOpen, setReleaseAllOpen] = useState(false)
  const [releasingAll, setReleasingAll] = useState(false)

  const release = trpc.admin.releaseSeat.useMutation({
    onSuccess: (r, vars) => {
      const name = countryName(vars.country, lang)
      notify(r.released ? t.toastReleased(name) : t.toastAlreadyOpen(name))
      refresh()
    },
    onError: (e) => notify(e.message),
  })

  const claimed = countries.filter((c) => c.playerName)

  const confirmRelease = () => {
    if (!releaseTarget) return
    release.mutate({ code: creds.code, pin: creds.pin, country: releaseTarget.country })
    setReleaseTarget(null)
  }

  const confirmReleaseAll = async () => {
    setReleaseAllOpen(false)
    setReleasingAll(true)
    try {
      for (const c of claimed) {
        await release.mutateAsync({ code: creds.code, pin: creds.pin, country: c.country })
      }
      notify(t.toastAllReleased)
    } catch {
      // Individual errors already toast via onError.
    } finally {
      setReleasingAll(false)
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink">{t.title}</h2>
        <span className="text-sm font-semibold text-ink-soft">
          {t.claimed(claimed.length, countries.length)}
        </span>
        <button
          type="button"
          onClick={() => setReleaseAllOpen(true)}
          disabled={claimed.length === 0 || releasingAll}
          className="ml-auto text-sm font-extrabold text-status-failed transition-colors hover:underline disabled:opacity-40"
        >
          {t.releaseAll}
        </button>
      </div>

      <div className="max-h-[480px] overflow-y-auto rounded-xl border border-hairline">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-paper-deep text-left text-xs font-extrabold uppercase tracking-[0.08em] text-ink-soft">
              <th className="px-3 py-2.5">{t.headers.country}</th>
              <th className="px-3 py-2.5">{t.headers.player}</th>
              <th className="w-16 px-3 py-2.5">
                <span className="sr-only">{t.headers.release}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => {
              const open = !c.playerName
              return (
                <tr
                  key={c.country}
                  className={cn('border-t border-hairline', open && 'bg-paper/60')}
                >
                  <td
                    className={cn(
                      'whitespace-nowrap px-3 py-2 font-extrabold text-ink',
                      projector ? 'text-lg' : 'text-base',
                    )}
                  >
                    <span className="mr-2" aria-hidden>
                      {c.flag}
                    </span>
                    {countryName(c.country, lang)}
                  </td>
                  <td className={cn('px-3 py-2', projector ? 'text-lg' : 'text-base')}>
                    {open ? (
                      <span className="rounded-lg border border-dashed border-hairline px-2.5 py-0.5 font-semibold text-ink-faint">
                        {t.open}
                      </span>
                    ) : (
                      <span className="font-bold text-ink">{c.playerName}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!open && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => setReleaseTarget(c)}
                        disabled={release.isPending}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-paper text-ink-soft transition-colors hover:border-status-failed hover:bg-status-failed-soft hover:text-status-failed disabled:opacity-50"
                        aria-label={t.releaseAria(countryName(c.country, lang), c.playerName ?? '')}
                        title={t.releaseAria(countryName(c.country, lang), c.playerName ?? '')}
                      >
                        <UserX className="h-4 w-4" aria-hidden />
                      </motion.button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!releaseTarget}
        onClose={() => setReleaseTarget(null)}
        title={
          releaseTarget
            ? t.confirmRelease.title(countryName(releaseTarget.country, lang))
            : t.confirmRelease.titleFallback
        }
        body={
          releaseTarget
            ? t.confirmRelease.body(
                releaseTarget.playerName ?? '',
                countryName(releaseTarget.country, lang),
              )
            : undefined
        }
        confirmLabel={t.confirmRelease.confirmLabel}
        tone="danger"
        loading={release.isPending}
        onConfirm={confirmRelease}
      />
      <ConfirmDialog
        open={releaseAllOpen}
        onClose={() => setReleaseAllOpen(false)}
        title={t.confirmReleaseAll.title}
        body={t.confirmReleaseAll.body}
        effects={t.confirmReleaseAll.effects(claimed.length)}
        confirmLabel={t.confirmReleaseAll.confirmLabel}
        tone="danger"
        loading={releasingAll}
        onConfirm={confirmReleaseAll}
      />
    </section>
  )
}
