/**
 * Player-dashboard helpers: type aliases inferred from the tRPC router,
 * mappings between the game-data contract ("resources"/"tech") and the
 * shared UI kit ("infrastructure"/"technology"), bloc color assignment,
 * and client-side mission progress text (the API sends status only).
 */
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../../../api/router'
import {
  COUNTRY_BY_NAME,
  countryHasPower,
  type AssetKey,
  type CountryData,
  type Lang,
  type MissionCondition,
} from '@contracts/game-data'
import { countryName } from '@/lib/i18n/shared'
import { playStrings } from '@/lib/i18n/play'
import type { BlocKey, DealType, StatusKey } from '@/lib/game-ui'

export type RouterOutputs = inferRouterOutputs<AppRouter>
export type PlayerState = RouterOutputs['game']['playerState']
export type LobbyState = RouterOutputs['lobby']['state']
export type PresentedDeal = PlayerState['myDeals']['sent'][number]
export type SignedDeal = PlayerState['myDeals']['signed'][number]
export type FeedEntry = PlayerState['feed'][number]
export type PublicMissionRow = PlayerState['publicMissions'][number]
export type EspionagePayload = NonNullable<PlayerState['espionage']>
export type MissionResult = PlayerState['myMissions'][number]

export const ASSET_ORDER: AssetKey[] = ['military', 'resources', 'energy', 'tech']

/** Contract deal-type key → shared UI kit DealType. */
export function toUiDealType(key: string): DealType {
  switch (key) {
    case 'resources':
      return 'infrastructure'
    case 'tech':
      return 'technology'
    case 'military':
      return 'military'
    default:
      return 'energy'
  }
}

/** Engine mission status → shared UI kit StatusKey. */
export function toStatusKey(status: string): StatusKey {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'at_risk':
      return 'atrisk'
    case 'failed':
      return 'failed'
    default:
      return 'ontrack'
  }
}

const STARTING_BLOC_KEYS: Record<string, BlocKey> = {
  'Nuclear Energy': 'nuclear',
  'Green Energy': 'green',
  'Fossil Fuel': 'fossil',
}
const CUSTOM_BLOC_KEYS: BlocKey[] = ['plum', 'slate', 'olive', 'clay']

/** Deterministic bloc → color key; custom blocs assigned in sorted order. */
export function blocKeyFor(blocName: string, allBlocNames: string[]): BlocKey {
  const starting = STARTING_BLOC_KEYS[blocName]
  if (starting) return starting
  const customs = allBlocNames
    .filter((n) => !STARTING_BLOC_KEYS[n])
    .sort((a, b) => a.localeCompare(b))
  const idx = customs.indexOf(blocName)
  return CUSTOM_BLOC_KEYS[Math.max(0, Math.min(idx, CUSTOM_BLOC_KEYS.length - 1))]
}

export function flagOf(countryName: string): string {
  return COUNTRY_BY_NAME[countryName]?.flag ?? '🏳️'
}

/** Points I would earn for a deal with this partner, given current blocs. */
export function myDealPoints(
  myCountry: CountryData,
  partnerName: string,
  blocs: Record<string, string>,
): 2 | 3 {
  if (blocs[myCountry.name] === blocs[partnerName]) return 3
  return myCountry.freeCrossBloc ? 3 : 2
}

// ── Mission progress text ──────────────────────────────────────────────────

export interface MissionProgress {
  /** e.g. "1 of 2 deals" — undefined when nothing useful can be said. */
  progress?: string
  /** Round-end-evaluated missions get the "Checked at the end of each round" caption. */
  checkedAtRoundEnd: boolean
}

function countIf<T>(items: T[], pred: (x: T) => boolean): number {
  return items.reduce((n, x) => (pred(x) ? n + 1 : n), 0)
}

function condProgress(
  cond: MissionCondition,
  signed: SignedDeal[],
  myCountry: CountryData,
  blocs: Record<string, string>,
  peekedCountry: string | null,
): { done: number; total: number; unit: string } | null {
  switch (cond.kind) {
    case 'deal_count':
      return {
        done: countIf(signed, (d) => d.dealType === cond.dealType),
        total: cond.min,
        unit: 'deals',
      }
    case 'deal_with_country':
      return {
        done: countIf(
          signed,
          (d) => d.partner === cond.country && d.dealType === cond.dealType,
        ),
        total: 1,
        unit: 'deal',
      }
    case 'deal_with_power':
      return {
        done: countIf(
          signed,
          (d) =>
            countryHasPower(d.partner, cond.power) &&
            (!cond.dealType || d.dealType === cond.dealType),
        ),
        total: cond.min,
        unit: 'deals',
      }
    case 'deal_with_power_each':
      return {
        done: countIf(cond.powers, (p) =>
          signed.some((d) => countryHasPower(d.partner, p)),
        ),
        total: cond.powers.length,
        unit: 'powers',
      }
    case 'deal_with_energy_rating':
      return {
        done: countIf(signed, (d) => {
          const c = COUNTRY_BY_NAME[d.partner]
          if (!c || (cond.dealType && d.dealType !== cond.dealType)) return false
          const r = c.assets.energy.rating
          return (
            (cond.op === 'lte' && r <= cond.value) ||
            (cond.op === 'lt' && r < cond.value) ||
            (cond.op === 'gte' && r >= cond.value) ||
            (cond.op === 'gt' && r > cond.value)
          )
        }),
        total: 1,
        unit: 'deal',
      }
    case 'all': {
      const parts = cond.conditions.map((c) =>
        condProgress(c, signed, myCountry, blocs, peekedCountry),
      )
      const done = countIf(parts, (p) => p != null && p.done >= p.total)
      return { done, total: cond.conditions.length, unit: 'parts' }
    }
    case 'cross_bloc_deals':
      return {
        done: countIf(
          signed,
          (d) =>
            COUNTRY_BY_NAME[d.partner]?.startingBloc !== myCountry.startingBloc,
        ),
        total: cond.min,
        unit: 'deals',
      }
    case 'deal_types_diversity':
      return {
        done: new Set(signed.map((d) => d.dealType)).size,
        total: cond.min,
        unit: 'deal types',
      }
    case 'total_deals':
      return { done: signed.length, total: cond.min, unit: 'deals' }
    case 'cover_starting_blocs':
      return {
        done: new Set(
          signed.map((d) => COUNTRY_BY_NAME[d.partner]?.startingBloc),
        ).size,
        total: 3,
        unit: 'blocs',
      }
    case 'deal_with_peeked_country':
      if (!peekedCountry) return null
      return {
        done: countIf(signed, (d) => d.partner === peekedCountry),
        total: 1,
        unit: 'deal',
      }
    default:
      return null
  }
}

const ROUND_END_KINDS = new Set([
  'deal_count_compare',
  'no_deal_type_with_counterparty_of',
  'no_deals_with_country',
  'total_deals_compare',
  'biggest_bloc',
  'bloc_size',
])

export function missionProgress(
  condition: MissionCondition | undefined,
  signed: SignedDeal[],
  myCountry: CountryData,
  blocs: Record<string, string>,
  peekedCountry: string | null,
  lang: Lang,
): MissionProgress {
  const s = playStrings[lang]
  if (!condition) return { checkedAtRoundEnd: false }
  if (condition.kind === 'deal_with_peeked_country' && !peekedCountry) {
    return {
      progress: s.usePeekToReveal,
      checkedAtRoundEnd: false,
    }
  }
  if (condition.kind === 'deal_with_peeked_country' && peekedCountry) {
    const p = condProgress(condition, signed, myCountry, blocs, peekedCountry)
    return {
      progress: p
        ? s.signDealWith(
            flagOf(peekedCountry),
            countryName(peekedCountry, lang),
            Math.min(p.done, p.total),
            p.total,
          )
        : undefined,
      checkedAtRoundEnd: false,
    }
  }
  if (ROUND_END_KINDS.has(condition.kind)) {
    return { checkedAtRoundEnd: true }
  }
  const p = condProgress(condition, signed, myCountry, blocs, peekedCountry)
  if (!p) return { checkedAtRoundEnd: false }
  const unit = p.total === 1 && p.unit === 'deal' ? 'deal' : p.unit
  return {
    progress: s.progressOf(
      Math.min(p.done, p.total),
      p.total,
      s.progressUnits[unit] ?? unit,
    ),
    checkedAtRoundEnd: false,
  }
}

/** Format a feed timestamp like "R2 · 14:32" / "第2回合 · 14:32". */
export function feedTimestamp(
  round: number,
  createdAt: Date | string,
  lang: Lang,
): string {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const roundLabel = lang === 'zh' ? `第${round}回合` : `R${round}`
  return `${roundLabel} · ${hh}:${mm}`
}
