import { cn } from '@/lib/utils'

export interface CountryChipProps {
  flag: string
  name: string
  /** e.g. player name or "Open seat" (lobby SeatCard usage). */
  subtitle?: string
  size?: 'sm' | 'md'
  className?: string
}

/** Flag emoji + country name chip. */
export default function CountryChip({ flag, name, subtitle, size = 'md', className }: CountryChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-hairline bg-card font-bold text-ink',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
        className,
      )}
    >
      <span aria-hidden className={size === 'sm' ? 'text-sm' : 'text-base'}>
        {flag}
      </span>
      <span>{name}</span>
      {subtitle && <span className="font-semibold text-ink-soft">· {subtitle}</span>}
    </span>
  )
}
