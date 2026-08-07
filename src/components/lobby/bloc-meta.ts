// Bloc metadata helpers shared by the lobby + endgame surfaces.
import type { BlocKey } from '@/lib/game-ui'

export const STARTING_BLOC_META: { name: string; key: BlocKey; caption: string }[] = [
  { name: 'Nuclear Energy', key: 'nuclear', caption: 'Big power, big energy.' },
  { name: 'Green Energy', key: 'green', caption: 'Clean tech, smart trade.' },
  { name: 'Fossil Fuel', key: 'fossil', caption: 'Industry giants who need energy.' },
]

const CUSTOM_KEYS: BlocKey[] = ['plum', 'slate', 'olive', 'clay']

/**
 * Map a bloc name (starting or player-founded) to a BlocKey. Custom blocs
 * are assigned plum/slate/olive/clay in order of first appearance.
 */
export function blocKeyFor(name: string, customNames: string[] = []): BlocKey {
  const starting = STARTING_BLOC_META.find((b) => b.name === name)
  if (starting) return starting.key
  const idx = customNames.indexOf(name)
  return CUSTOM_KEYS[(idx === -1 ? 0 : idx) % CUSTOM_KEYS.length]
}

/** Ordered list of custom bloc names (for stable color assignment). */
export function customBlocNames(names: string[]): string[] {
  const seen: string[] = []
  for (const n of names) {
    if (!STARTING_BLOC_META.some((b) => b.name === n) && !seen.includes(n)) seen.push(n)
  }
  return seen
}
