import { Rss } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NewsTickerProps {
  /** Accepted-deal announcements, e.g. "USA signed a Military Protection deal with Japan". */
  items: string[]
  className?: string
}

/** Horizontal marquee strip for summit news (32s, pause on hover). */
export default function NewsTicker({ items, className }: NewsTickerProps) {
  if (items.length === 0) return null
  const line = items.join('  ·  ')
  return (
    <div
      className={cn(
        'group flex items-center overflow-hidden border-y border-hairline bg-paper-deep py-2',
        className,
      )}
      aria-label="Summit news"
    >
      <span className="flex shrink-0 items-center gap-1.5 border-r border-hairline px-4 text-xs font-extrabold uppercase tracking-[0.10em] text-ink-soft">
        <Rss className="h-3.5 w-3.5" aria-hidden />
        Summit News
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
