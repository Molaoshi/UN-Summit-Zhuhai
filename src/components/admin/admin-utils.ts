/**
 * Shared helpers for the Admin dashboard: tRPC payload types, admin
 * credential storage, projector-mode flag, a small page context, and the
 * mapping helpers between API enums and the shared UI metadata.
 */
import { createContext, useContext } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../../../api/router'
import { COUNTRIES, COUNTRY_BY_NAME, STARTING_BLOCS } from '@contracts/game-data'
import type { MissionSlot } from '@contracts/game-data'
import type { BlocKey, DealType, StatusKey } from '@/lib/game-ui'
import { loadSession } from '@/lib/session'

// ── tRPC payload types ─────────────────────────────────────────────────────

type RouterOutputs = inferRouterOutputs<AppRouter>
export type AdminState = RouterOutputs['game']['adminState']
export type AdminRoom = AdminState['room']
export type AdminCountry = AdminState['countries'][number]
export type AdminMission = AdminCountry['missions'][number]
export type AdminDeal = AdminState['allDeals'][number]
export type AdminLogEntry = AdminState['activityLog'][number]
export type AdminBlocRow = AdminState['blocHistory'][number]

// ── Admin credentials (room code + admin PIN, stored locally) ──────────────

export interface AdminCreds {
  code: string
  pin: string
}

const CREDS_KEY = 'summit:admin'
const LEGACY_PIN_KEY = 'summit:adminPin'
export const PROJECTOR_KEY = 'summit:projector'

export function loadAdminCreds(): AdminCreds | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AdminCreds
      if (parsed.code && parsed.pin) return parsed
    }
    // Legacy fallback: the lobby used to store the PIN as a raw string under
    // 'summit:adminPin'. Recover it with the session's room code and heal the
    // JSON store so the teacher is never locked out.
    const legacyPin = localStorage.getItem(LEGACY_PIN_KEY)
    const code = loadSession()?.roomCode
    if (legacyPin && code) {
      const creds: AdminCreds = { code, pin: legacyPin }
      saveAdminCreds(creds)
      return creds
    }
    return null
  } catch {
    return null
  }
}

export function saveAdminCreds(creds: AdminCreds) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds))
}

export function clearAdminCreds() {
  localStorage.removeItem(CREDS_KEY)
}

// ── Page context (creds, projector mode, toast, refresh) ───────────────────

export interface AdminCtxValue {
  creds: AdminCreds
  projector: boolean
  notify: (message: string) => void
  refresh: () => void
}

export const AdminCtx = createContext<AdminCtxValue | null>(null)

export function useAdminCtx(): AdminCtxValue {
  const ctx = useContext(AdminCtx)
  if (!ctx) throw new Error('useAdminCtx must be used inside AdminCtx.Provider')
  return ctx
}

// ── Enum → UI mappings ─────────────────────────────────────────────────────

/** API deal types are keyed by asset; UI metadata uses friendlier keys. */
export function dealTypeUi(key: AdminDeal['dealType']): DealType {
  switch (key) {
    case 'military':
      return 'military'
    case 'resources':
      return 'infrastructure'
    case 'energy':
      return 'energy'
    case 'tech':
      return 'technology'
  }
}

export function statusUi(status: AdminMission['status']): StatusKey {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'on_track':
      return 'ontrack'
    case 'at_risk':
      return 'atrisk'
    case 'failed':
      return 'failed'
  }
}

const STARTING_BLOC_KEYS: Record<string, BlocKey> = {
  'Nuclear Energy': 'nuclear',
  'Green Energy': 'green',
  'Fossil Fuel': 'fossil',
}
const CUSTOM_BLOC_KEYS: BlocKey[] = ['plum', 'slate', 'olive', 'clay']

/**
 * Deterministic order of custom (player-founded) bloc names: first appearance
 * in bloc history, then current memberships, then alphabetical.
 */
export function customBlocNames(state: AdminState): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const push = (name: string) => {
    if ((STARTING_BLOCS as readonly string[]).includes(name)) return
    if (seen.has(name)) return
    seen.add(name)
    out.push(name)
  }
  for (const row of state.blocHistory) push(row.blocName)
  for (const c of state.countries) push(c.bloc)
  return out
}

export function blocKeyFor(blocName: string, customNames: string[]): BlocKey {
  const starting = STARTING_BLOC_KEYS[blocName]
  if (starting) return starting
  const idx = customNames.indexOf(blocName)
  return CUSTOM_BLOC_KEYS[Math.max(0, idx) % CUSTOM_BLOC_KEYS.length]
}

export function countryFlag(name: string): string {
  return COUNTRY_BY_NAME[name]?.flag ?? '🏳️'
}

export function countryStartingBloc(name: string): string {
  return COUNTRY_BY_NAME[name]?.startingBloc ?? ''
}

export function countryFreeTrader(name: string): boolean {
  return COUNTRY_BY_NAME[name]?.freeCrossBloc ?? false
}

/**
 * Caption for missions whose condition is only decided later:
 * bloc conditions re-check at round end, comparisons at game end.
 */
export function missionTimingCaption(country: string, slot: MissionSlot): string | null {
  const mission = COUNTRY_BY_NAME[country]?.missions.find((m) => m.slot === slot)
  if (!mission) return null
  switch (mission.condition.kind) {
    case 'biggest_bloc':
    case 'bloc_size':
      return 'checks at round end'
    case 'deal_count_compare':
    case 'total_deals_compare':
      return 'decided at game end'
    default:
      return null
  }
}

// ── Time helpers ───────────────────────────────────────────────────────────

export function timeAgo(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

export function formatClock(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  return `${h} h ${minutes % 60} min`
}

// ── Round history derivation ───────────────────────────────────────────────

export interface RoundSummary {
  round: number
  beganAt: Date | null
  endedAt: Date | null
  dealsSigned: number
}

const ROUND_BEGIN_RE = /^Round (\d+) begins/
const GAME_OPEN_RE = /Round 1 begins/

/** Rebuild per-round timing from the activity log + signed deals. */
export function roundSummaries(state: AdminState): RoundSummary[] {
  const begins = new Map<number, Date>()
  for (const entry of state.activityLog) {
    if (entry.kind !== 'game') continue
    const at = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt)
    const m = ROUND_BEGIN_RE.exec(entry.message)
    if (m) {
      begins.set(Number(m[1]), at)
    } else if (GAME_OPEN_RE.test(entry.message)) {
      begins.set(1, at)
    }
  }
  const signedByRound = new Map<number, number>()
  for (const d of state.allDeals) {
    if (d.status !== 'accepted') continue
    signedByRound.set(d.round, (signedByRound.get(d.round) ?? 0) + 1)
  }
  const lastRound = Math.max(
    state.room.currentRound,
    0,
    ...[...signedByRound.keys()],
    ...[...begins.keys()],
  )
  const summaries: RoundSummary[] = []
  for (let r = 1; r <= lastRound; r++) {
    const beganAt = begins.get(r) ?? null
    const endedAt = begins.get(r + 1) ?? null
    summaries.push({ round: r, beganAt, endedAt, dealsSigned: signedByRound.get(r) ?? 0 })
  }
  return summaries
}

/** Deterministic membership per round: starting blocs + history rows ≤ round. */
export function blocMembershipAtRound(
  history: AdminBlocRow[],
  round: number,
): Map<string, string[]> {
  const membership = new Map<string, string>()
  for (const c of COUNTRIES) membership.set(c.name, c.startingBloc)
  const rows = [...history].sort((a, b) => a.id - b.id)
  for (const row of rows) {
    if (row.round <= round) membership.set(row.country, row.blocName)
  }
  const byBloc = new Map<string, string[]>()
  for (const [country, bloc] of membership) {
    byBloc.set(bloc, [...(byBloc.get(bloc) ?? []), country])
  }
  return byBloc
}
