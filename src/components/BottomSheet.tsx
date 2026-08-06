import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

/** Mobile bottom sheet / desktop centered dialog with ink scrim. */
export default function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink/45"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={isDesktop ? { scale: 0.96, opacity: 0 } : { y: '100%' }}
            animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
            exit={isDesktop ? { scale: 0.96, opacity: 0 } : { y: '100%' }}
            transition={
              isDesktop
                ? { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
                : { type: 'spring', stiffness: 320, damping: 26 }
            }
            drag={isDesktop ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (!isDesktop && (info.offset.y > 120 || info.velocity.y > 600)) onClose()
            }}
            className={cn(
              'relative z-10 max-h-[88dvh] w-full overflow-y-auto bg-card shadow-raised',
              'rounded-t-[20px] p-5 pb-8 lg:max-w-[560px] lg:rounded-2xl lg:p-7',
              className,
            )}
          >
            {!isDesktop && (
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-hairline" aria-hidden />
            )}
            <div className="mb-4 flex items-center justify-between gap-3">
              {title && <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
