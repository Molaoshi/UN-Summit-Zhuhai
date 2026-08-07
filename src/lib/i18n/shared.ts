/**
 * Shared bilingual UI strings + activity-log message templates.
 * Page agents: `useStrings(sharedStrings)` for common UI, and
 * `activityMessage(row.kind, row.params, lang) ?? row.message` for the feed.
 */
import {
  BLOC_ZH,
  COUNTRY_NAME_ZH,
  DEAL_TYPES,
  DEAL_TYPE_ZH,
  POWER_ZH,
  type DealTypeKey,
  type Lang,
} from '@contracts/game-data'

export type { Lang }

// ── Name helpers (contracts ZH maps; raw name is the fallback) ─────────────

export function countryName(name: string, lang: Lang): string {
  return lang === 'zh' ? (COUNTRY_NAME_ZH[name] ?? name) : name
}

/** Custom (player-founded) blocs keep their raw name in both languages. */
export function blocName(name: string, lang: Lang): string {
  return lang === 'zh' ? (BLOC_ZH[name] ?? name) : name
}

export function dealTypeName(type: string, lang: Lang): string {
  const key = type as DealTypeKey
  if (lang === 'zh') return DEAL_TYPE_ZH[key] ?? type
  return DEAL_TYPES[key] ?? type
}

export function powerName(power: string, lang: Lang): string {
  return lang === 'zh' ? (POWER_ZH[power] ?? power) : power
}

// ── Common UI strings ──────────────────────────────────────────────────────

export const sharedStrings = {
  en: {
    send: 'Send',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    close: 'Close',
    loading: 'Loading…',
    error: 'Something went wrong',
    status: {
      completed: 'Completed',
      on_track: 'On track',
      at_risk: 'At risk',
      failed: 'Failed',
      pending: 'Pending',
    },
    phase: {
      negotiation: 'Negotiation',
      round_end: 'Round end',
      lobby: 'Lobby',
      ended: 'Ended',
    },
    pts: 'pts',
    deal: 'deal',
    deals: 'deals',
  },
  zh: {
    send: '发送',
    cancel: '取消',
    confirm: '确认',
    back: '返回',
    close: '关闭',
    loading: '加载中…',
    error: '出错了',
    status: {
      completed: '已完成',
      on_track: '进行中',
      at_risk: '有风险',
      failed: '失败',
      pending: '待定',
    },
    phase: {
      negotiation: '谈判阶段',
      round_end: '回合结束',
      lobby: '大厅',
      ended: '已结束',
    },
    pts: '分',
    deal: '协议',
    deals: '协议',
  },
}

export type SharedStrings = (typeof sharedStrings)['en']

// ── Activity log templates ─────────────────────────────────────────────────

/** Structured params stored on activity_log rows (see api/routers). */
export type ActivityParams = Record<string, unknown> | null | undefined

const SLOT_ZH: Record<string, string> = {
  public: '公开',
  private: '秘密',
  bonus: '奖励',
}

const OVERRIDE_STATUS_ZH: Record<string, string> = {
  completed: '已完成',
  failed: '失败',
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Signed delta, e.g. +3 / -2. */
function signed(v: unknown): string {
  const n = num(v)
  return n >= 0 ? `+${n}` : String(n)
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')
}

/**
 * Render one activity-log row in the active language.
 * Returns null for unknown kinds / unusable params — callers should fall
 * back to the stored English `message` (old rows have no params).
 */
export function activityMessage(
  kind: string,
  params: ActivityParams,
  lang: Lang,
): string | null {
  if (!params) return null
  const country = (v: unknown) => countryName(str(v), lang)
  const dealType = (v: unknown) => dealTypeName(str(v), lang)
  const power = (v: unknown) => powerName(str(v), lang)
  const bloc = (v: unknown) => blocName(str(v), lang)

  switch (kind) {
    case 'room_created':
      return fill(
        lang === 'zh'
          ? '房间由 {teacher} 创建。欢迎来到联合国峰会！'
          : 'Room created by {teacher}. Welcome to the UN Summit!',
        { teacher: str(params.teacher) },
      )

    case 'player_joined':
      return fill(lang === 'zh' ? '{player} 加入了房间。' : '{player} joined the room.', {
        player: str(params.player),
      })

    case 'seat_claimed':
      return fill(lang === 'zh' ? '{player} 选择了{country}。' : '{player} claimed {country}.', {
        player: str(params.player),
        country: country(params.country),
      })

    case 'seat_assigned': {
      const target = str(params.country)
      const previous = str(params.previousCountry)
      const moved = previous !== '' && previous !== target
      const evicted = str(params.evictedPlayer)
      let message = fill(
        lang === 'zh' ? '{player} 被分配到{country}。' : '{player} was assigned to {country}.',
        { player: str(params.player), country: country(params.country) },
      )
      if (moved) {
        message += fill(
          lang === 'zh' ? '（从{previous}调离）' : ' (moved from {previous})',
          { previous: country(previous) },
        )
      }
      if (evicted) {
        message += fill(
          lang === 'zh' ? ' {evicted} 被移出席位。' : ' {evicted} was released.',
          { evicted },
        )
      }
      return message
    }

    case 'seat_released':
      return fill(
        lang === 'zh'
          ? '老师释放了{country}的席位（原为 {player}）。'
          : 'Teacher released {country} (was {player}).',
        { country: country(params.country), player: str(params.player) },
      )

    case 'countries_updated': {
      const list = Array.isArray(params.countries) ? params.countries : []
      return fill(
        lang === 'zh'
          ? '老师设置了国家名单（{count} 个国家）。'
          : 'Teacher set the country roster ({count} countries).',
        { count: String(list.length) },
      )
    }

    case 'game_started':
      return fill(
        lang === 'zh'
          ? '联合国峰会开幕！第 {round} 回合开始——宣布你的公开任务。'
          : 'The UN Summit is open! Round {round} begins — declare your public missions.',
        { round: str(params.round ?? 1) },
      )

    case 'round_closed':
      return fill(
        lang === 'zh' ? '第 {round} 回合即将结束——选择你的联盟！' : 'Round {round} is ending — choose your blocs!',
        { round: str(params.round) },
      )

    case 'round_started':
      return fill(
        lang === 'zh'
          ? '第 {round} 回合开始。你有 3 个新的协议行动。'
          : 'Round {round} begins. You have 3 new deal actions.',
        { round: str(params.round) },
      )

    case 'offers_expired':
      return fill(
        lang === 'zh' ? '{count} 份未签署的报价已过期。' : '{count} unsigned offer(s) expired.',
        { count: str(params.count) },
      )

    case 'game_ended':
      return lang === 'zh'
        ? '峰会已结束。最终得分揭晓！'
        : 'The Summit has ended. Final scores are revealed!'

    case 'deal_sent':
      return fill(
        lang === 'zh'
          ? '{a} 向 {b} 发出了{dealType}协议报价（{power}）。'
          : '{a} offers a {dealType} deal ({power}) to {b}.',
        {
          a: country(params.a),
          b: country(params.b),
          dealType: dealType(params.dealType),
          power: power(params.power),
        },
      )

    case 'deal_accepted':
      return fill(
        lang === 'zh' ? '{a} 与 {b} 签署了{dealType}协议。' : '{a} signed a {dealType} deal with {b}.',
        {
          a: country(params.a),
          b: country(params.b),
          dealType: dealType(params.dealType),
          power: power(params.power),
        },
      )

    case 'deal_cancelled':
      return params.rejected
        ? fill(
            lang === 'zh'
              ? '{by} 拒绝了来自{a}的{dealType}协议报价。'
              : '{by} rejected a {dealType} offer from {a}.',
            {
              by: country(params.by),
              a: country(params.a),
              dealType: dealType(params.dealType),
            },
          )
        : fill(
            lang === 'zh'
              ? '{by} 取消了发给{b}的{dealType}协议报价。'
              : '{by} cancelled their {dealType} offer to {b}.',
            {
              by: country(params.by),
              b: country(params.b),
              dealType: dealType(params.dealType),
            },
          )

    case 'bloc_chosen':
      return params.founded
        ? fill(
            lang === 'zh' ? '{country} 创建了新联盟：{bloc}。' : '{country} founded a new bloc: {bloc}.',
            { country: country(params.country), bloc: bloc(params.bloc) },
          )
        : fill(
            lang === 'zh' ? '{country} 加入了{bloc}。' : '{country} joined the {bloc} bloc.',
            { country: country(params.country), bloc: bloc(params.bloc) },
          )

    case 'espionage_peek':
      return fill(
        lang === 'zh'
          ? '{country} 使用情报侦察查看了{target}的机密文件。'
          : "{country} used Espionage to peek at {target}'s secret file.",
        { country: country(params.country), target: country(params.target) },
      )

    case 'override_mission': {
      const slot = str(params.slot)
      const status = str(params.status)
      return fill(
        lang === 'zh'
          ? '老师将{country}的{slot}任务标记为{status}。'
          : "Teacher marked {country}'s {slot} mission as {status}.",
        {
          country: country(params.country),
          slot: lang === 'zh' ? (SLOT_ZH[slot] ?? slot) : slot,
          status: lang === 'zh' ? (OVERRIDE_STATUS_ZH[status] ?? status) : status,
        },
      )
    }

    case 'adjust_score':
      return fill(
        lang === 'zh'
          ? '老师将{country}的得分调整了{delta}：{reason}。'
          : "Teacher adjusted {country}'s score by {delta}: {reason}.",
        {
          country: country(params.country),
          delta: signed(params.delta),
          reason: str(params.reason),
        },
      )

    default:
      return null
  }
}
