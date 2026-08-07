import { useEffect, useState } from 'react'

export interface CountUpProps {
  value: number
  /** Start counting when true; otherwise show the final value immediately. */
  active: boolean
  duration?: number
}

/** Ease-out numeral tween from 0 → value (score count-up pattern). */
export default function CountUp({ value, active, duration = 900 }: CountUpProps) {
  const [display, setDisplay] = useState(active ? 0 : value)
  useEffect(() => {
    if (!active) {
      setDisplay(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, active, duration])
  return <>{display}</>
}
