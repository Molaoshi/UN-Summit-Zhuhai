import { Rss } from 'lucide-react'
import { useStrings } from '@/lib/i18n'
import { playStrings } from '@/lib/i18n/play'
import { cn } from '@/lib/utils'

export interface NewsTickerProps {
  /** Accepted-deal announcements, already rendered in the active language. */
  items: string[]
  className?: string
}

/** Bilingual copy of the shared NewsTicker marquee strip. */
export default function NewsTicker({ items, className }: NewsTickerProps) {
  const s = useStrings(playStrings)
  if (items.length === 0) return null
  const line = items.join('  ·  ')
  return (
    <div
      className={cn(
        'group flex items-center overflow-hidden border-y border-hairline bg-paper-deep py-2',
        className,
      )}
      aria-label={s.summitNewsAria}
    >
      <span className="flex shrink-0 items-center gap-1.5 border-r border-hairline px-4 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
        <Rss className="h-3.5 w-3.5" aria-hidden />
        {s.summitNews}
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="animate-marquee flex w-max whitespace-nowrap pl-4 text-sm font-semibold text-ink group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused] motion-reduce:animate-none">
          <span className="pr-8">{line}</span>
          <span className="pr-8" aria-hidden>
            {line}
          </span>
        </div>
      </div>
    </div>
  )
}
