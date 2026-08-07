import { motion } from 'framer-motion'
import { Landmark, Send } from 'lucide-react'
import ActionPips from '@/components/ActionPips'
import { cn } from '@/lib/utils'

export interface StickyBottomBarProps {
  actionsRemaining: number
  actionsMax: number
  isRoundEnd: boolean
  actionsBlocked: boolean
  onSendOffer: () => void
  onChooseBloc: () => void
}

/** Mobile-only sticky action bar: Send Offer + pips (or bloc choice at round end). */
export default function StickyBottomBar({
  actionsRemaining,
  actionsMax,
  isRoundEnd,
  actionsBlocked,
  onSendOffer,
  onChooseBloc,
}: StickyBottomBarProps) {
  const exhausted = actionsRemaining <= 0
  return (
    <motion.div
      initial={{ y: 72 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-card/95 shadow-raised backdrop-blur sm:hidden"
    >
      <div className="flex h-[72px] items-center justify-between gap-3 px-4">
        {isRoundEnd ? (
          <button
            type="button"
            onClick={onChooseBloc}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-base font-extrabold text-paper"
          >
            <Landmark className="h-5 w-5" aria-hidden />
            Choose my bloc
          </button>
        ) : (
          <>
            <ActionPips
              remaining={actionsRemaining}
              total={actionsMax}
              className="shrink-0 [&_span]:text-xs"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={actionsBlocked || exhausted}
              onClick={onSendOffer}
              className={cn(
                'flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-base font-extrabold text-paper',
                (actionsBlocked || exhausted) && 'cursor-not-allowed opacity-50',
              )}
            >
              <Send className="h-5 w-5" aria-hidden />
              Send Offer
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  )
}
