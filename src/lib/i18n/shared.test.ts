/**
 * Unit tests for the bilingual i18n helpers (EN + 中文 rendering).
 */
import { describe, expect, it } from 'vitest'
import {
  activityMessage,
  blocName,
  countryName,
  dealTypeName,
  powerName,
  sharedStrings,
} from './shared'

describe('name helpers', () => {
  it('localizes country names with English fallback', () => {
    expect(countryName('USA', 'en')).toBe('USA')
    expect(countryName('USA', 'zh')).toBe('美国')
    expect(countryName('South Korea', 'zh')).toBe('韩国')
    expect(countryName('Atlantis', 'zh')).toBe('Atlantis')
  })

  it('localizes starting blocs; custom blocs fall back to the raw name', () => {
    expect(blocName('Nuclear Energy', 'zh')).toBe('核能联盟')
    expect(blocName('Green Energy', 'en')).toBe('Green Energy')
    expect(blocName('Team Rocket', 'zh')).toBe('Team Rocket')
  })

  it('localizes deal types and powers', () => {
    expect(dealTypeName('military', 'zh')).toBe('军事保护')
    expect(dealTypeName('resources', 'en')).toBe('Infrastructure')
    expect(powerName('Ballistic Missiles', 'zh')).toBe('弹道导弹')
    expect(powerName('Navy', 'en')).toBe('Navy')
  })
})

describe('sharedStrings', () => {
  it('has matching EN/ZH shapes with the required labels', () => {
    expect(Object.keys(sharedStrings.zh)).toEqual(Object.keys(sharedStrings.en))
    expect(sharedStrings.zh.send).toBe('发送')
    expect(sharedStrings.zh.status.completed).toBe('已完成')
    expect(sharedStrings.zh.status.on_track).toBe('进行中')
    expect(sharedStrings.zh.status.at_risk).toBe('有风险')
    expect(sharedStrings.zh.status.failed).toBe('失败')
    expect(sharedStrings.zh.status.pending).toBe('待定')
    expect(sharedStrings.zh.phase.negotiation).toBe('谈判阶段')
    expect(sharedStrings.zh.phase.round_end).toBe('回合结束')
    expect(sharedStrings.zh.phase.lobby).toBe('大厅')
    expect(sharedStrings.zh.phase.ended).toBe('已结束')
    expect(sharedStrings.zh.pts).toBe('分')
    expect(sharedStrings.zh.deal).toBe('协议')
  })
})

describe('activityMessage', () => {
  const deal = { a: 'USA', b: 'Japan', dealType: 'military', power: 'Ballistic Missiles', round: 1 }

  it('renders deal_accepted in EN and ZH', () => {
    expect(activityMessage('deal_accepted', deal, 'en')).toBe(
      'USA signed a Military Protection deal with Japan.',
    )
    expect(activityMessage('deal_accepted', deal, 'zh')).toBe(
      '美国 与 日本 签署了军事保护协议。',
    )
  })

  it('renders deal_sent and deal_cancelled (rejected + withdrawn)', () => {
    expect(activityMessage('deal_sent', deal, 'en')).toBe(
      'USA offers a Military Protection deal (Ballistic Missiles) to Japan.',
    )
    expect(activityMessage('deal_sent', deal, 'zh')).toBe(
      '美国 向 日本 发出了军事保护协议报价（弹道导弹）。',
    )
    expect(
      activityMessage('deal_cancelled', { ...deal, by: 'Japan', rejected: true }, 'zh'),
    ).toBe('日本 拒绝了来自美国的军事保护协议报价。')
    expect(
      activityMessage('deal_cancelled', { ...deal, by: 'USA', rejected: false }, 'en'),
    ).toBe('USA cancelled their Military Protection offer to Japan.')
  })

  it('renders round/game lifecycle kinds in both languages', () => {
    expect(activityMessage('game_started', { round: 1 }, 'zh')).toContain('第 1 回合开始')
    expect(activityMessage('round_closed', { round: 2 }, 'en')).toBe(
      'Round 2 is ending — choose your blocs!',
    )
    expect(activityMessage('round_started', { round: 3 }, 'zh')).toContain('第 3 回合开始')
    expect(activityMessage('offers_expired', { count: 2 }, 'zh')).toBe(
      '2 份未签署的报价已过期。',
    )
    expect(activityMessage('game_ended', {}, 'en')).toBe(
      'The Summit has ended. Final scores are revealed!',
    )
  })

  it('renders admin/lobby kinds in both languages', () => {
    expect(
      activityMessage('bloc_chosen', { country: 'France', bloc: 'Green Energy', founded: false }, 'zh'),
    ).toBe('法国 加入了绿色能源联盟。')
    expect(
      activityMessage('bloc_chosen', { country: 'France', bloc: 'New Bloc', founded: true }, 'en'),
    ).toBe('France founded a new bloc: New Bloc.')
    expect(
      activityMessage('override_mission', { country: 'India', slot: 'bonus', status: 'completed' }, 'zh'),
    ).toBe('老师将印度的奖励任务标记为已完成。')
    expect(
      activityMessage('adjust_score', { country: 'Kenya', delta: 5, reason: 'Great speech' }, 'en'),
    ).toBe("Teacher adjusted Kenya's score by +5: Great speech.")
    expect(
      activityMessage('seat_released', { country: 'Chile', player: 'Ana' }, 'zh'),
    ).toBe('老师释放了智利的席位（原为 Ana）。')
    expect(
      activityMessage('countries_updated', { countries: ['USA', 'China', 'Japan'] }, 'en'),
    ).toBe('Teacher set the country roster (3 countries).')
  })

  it('renders seat_assigned with optional move/eviction details', () => {
    expect(
      activityMessage('seat_assigned', { player: 'Ana', country: 'France' }, 'en'),
    ).toBe('Ana was assigned to France.')
    expect(
      activityMessage('seat_assigned', { player: 'Ana', country: 'France' }, 'zh'),
    ).toBe('Ana 被分配到法国。')
    expect(
      activityMessage(
        'seat_assigned',
        { player: 'Ana', country: 'France', previousCountry: 'Japan', evictedPlayer: 'Bo' },
        'en',
      ),
    ).toBe('Ana was assigned to France. (moved from Japan) Bo was released.')
    expect(
      activityMessage(
        'seat_assigned',
        { player: 'Ana', country: 'France', previousCountry: 'Japan', evictedPlayer: 'Bo' },
        'zh',
      ),
    ).toBe('Ana 被分配到法国。（从日本调离） Bo 被移出席位。')
    // Re-assigning the same seat is a no-op line with no move clause.
    expect(
      activityMessage(
        'seat_assigned',
        { player: 'Ana', country: 'France', previousCountry: 'France' },
        'en',
      ),
    ).toBe('Ana was assigned to France.')
  })

  it('returns null for unknown kinds or missing params (caller falls back to message)', () => {
    expect(activityMessage('totally_unknown', { a: 1 }, 'en')).toBeNull()
    expect(activityMessage('deal_accepted', null, 'en')).toBeNull()
    expect(activityMessage('deal_accepted', undefined, 'zh')).toBeNull()
  })
})
