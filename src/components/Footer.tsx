import { motion } from 'framer-motion'

/** Landing-only footer strip. */
export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="border-t border-hairline bg-paper-deep py-6"
    >
      <p className="px-4 text-center text-sm font-semibold text-ink-soft">
        UN Summit: Zhuhai · A classroom negotiation game · Talk in class — the app keeps the score.
      </p>
    </motion.footer>
  )
}
