import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Megaphone, Newspaper } from 'lucide-react'
import BlocBadge from '@/components/BlocBadge'
import EmptyState from '@/components/EmptyState'
import StatusChip from '@/components/StatusChip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEAL_TYPES } from '@/lib/game-ui'
import { cn } from '@/lib/utils'
import {
  blocKeyFor,
  feedTimestamp,
  toStatusKey,
  toUiDealType,
} from './helpers'
import type { FeedEntry, PublicMissionRow } from './helpers'

export interface FeedTabsProps {
  feed: FeedEntry[]
  publicMissions: PublicMissionRow[]
  myCountryName: string
  blocs: Record<string, string>
  allBlocNames: string[]
  className?: string
}

/** Summit Feed (chronological) + All Public Missions directory, tabbed. */
export default function FeedTabs({
  feed,
  publicMissions,
  myCountryName,
  blocs,
  allBlocNames,
  className,
}: FeedTabsProps) {
  const [expanded, setExpanded] = useState<string | null>(myCountryName)
  const newestFirst = [...feed].reverse()

  // My row pinned to the top of the public-missions directory.
  const rows = [...publicMissions].sort((a, b) => {
    if (a.country === myCountryName) return -1
    if (b.country === myCountryName) return 1
    return a.country.localeCompare(b.country)
  })

  return (
    <section
      aria-label="Summit feed and public missions"
      className={cn(
        'rounded-2xl border border-hairline bg-card p-5 shadow-card md:p-6',
        className,
      )}
    >
      <Tabs defaultValue="feed">
        <TabsList className="mb-4 h-auto w-full justify-start gap-4 rounded-none border-b border-hairline bg-transparent p-0">
          <TabsTrigger
            value="feed"
            className="gap-1.5 rounded-none border-b-[3px] border-transparent px-1 pb-2 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft shadow-none data-[state=active]:border-gold data-[state=active]:bg-transparent data-[state=active]:text-ink data-[state=active]:shadow-none"
          >
            <Newspaper className="h-4 w-4" aria-hidden />
            Summit Feed
          </TabsTrigger>
          <TabsTrigger
            value="missions"
            className="gap-1.5 rounded-none border-b-[3px] border-transparent px-1 pb-2 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft shadow-none data-[state=active]:border-gold data-[state=active]:bg-transparent data-[state=active]:text-ink data-[state=active]:shadow-none"
          >
            <Megaphone className="h-4 w-4" aria-hidden />
            Public Missions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {newestFirst.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title="No news yet"
                body="Signed deals will be announced here for the whole summit."
                className="py-6"
              />
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {newestFirst.map((entry) => {
                    const meta =
                      DEAL_TYPES[toUiDealType(guessKey(entry.dealTypeLabel))]
                    return (
                      <motion.li
                        key={entry.id}
                        layout="position"
                        initial={{ x: -8, opacity: 0, backgroundColor: '#EADFBF' }}
                        animate={{ x: 0, opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                        transition={{ duration: 0.35 }}
                        className="flex items-start gap-2.5 rounded-xl px-3 py-2"
                      >
                        <meta.icon
                          className="mt-1 h-4 w-4 shrink-0"
                          style={{ color: meta.color }}
                          aria-hidden
                        />
                        <p className="flex-1 text-sm font-semibold leading-5 text-ink">
                          {entry.message}
                        </p>
                        <span className="shrink-0 font-mono text-xs font-semibold text-ink-faint">
                          {feedTimestamp(entry.round, entry.createdAt)}
                        </span>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="missions" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="space-y-2">
              {rows.map((row) => {
                const isMe = row.country === myCountryName
                const isOpen = expanded === row.country
                const blocName = blocs[row.country] ?? ''
                return (
                  <li
                    key={row.country}
                    className={cn(
                      'overflow-hidden rounded-xl border',
                      isMe ? 'border-gold bg-gold-soft/50' : 'border-hairline bg-paper',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : row.country)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
                    >
                      <span aria-hidden className="text-xl">
                        {row.flag}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-extrabold text-ink">
                            {row.country}
                            {isMe && (
                              <span className="ml-1.5 text-xs font-extrabold uppercase tracking-[0.10em] text-gold-ink">
                                You
                              </span>
                            )}
                          </span>
                          {blocName && (
                            <BlocBadge
                              bloc={blocKeyFor(blocName, allBlocNames)}
                              name={blocName}
                              size="sm"
                            />
                          )}
                        </span>
                        {!isOpen && (
                          <span className="block truncate text-sm font-semibold text-ink-soft">
                            {row.text}
                          </span>
                        )}
                      </span>
                      <StatusChip status={toStatusKey(row.status)} />
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-ink-faint transition-transform duration-300',
                          isOpen && 'rotate-180',
                        )}
                        aria-hidden
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-hairline px-3.5 py-3 text-base leading-[26px] text-ink">
                            {row.text}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </TabsContent>
      </Tabs>
    </section>
  )
}

/** Feed entries carry the deal-type label; recover the contract key. */
function guessKey(label: string): string {
  switch (label) {
    case 'Military Protection':
      return 'military'
    case 'Infrastructure':
      return 'resources'
    case 'Technology':
      return 'tech'
    default:
      return 'energy'
  }
}
