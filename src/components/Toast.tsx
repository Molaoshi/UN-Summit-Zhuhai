import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  open: boolean
  message: string
  icon?: LucideIcon
  /** Auto-dismiss delay (ms). */
  duration?: number
  onClose: () => void
  className?: string
}

/** Top-center pill toast (below header on mobile). */
export default function Toast({ open, message, icon: Icon = CheckCircle2, duration = 3500, onClose, className }: ToastProps) {
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(t)
  }, [open, duration, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed left-1/2 top-16 z-[70] -translate-x-1/2 md:top-5',
            className,
          )}
        >
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-paper shadow-raised">
            <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
