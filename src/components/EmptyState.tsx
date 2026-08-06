import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  body: string
  className?: string
}

/** Centered empty-list guidance. */
export default function EmptyState({ icon: Icon, title, body, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-10 text-center', className)}>
      <Icon className="h-10 w-10 text-ink-faint" aria-hidden />
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      <p className="max-w-xs text-base text-ink-soft">{body}</p>
    </div>
  )
}
