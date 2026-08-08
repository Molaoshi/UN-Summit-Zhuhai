/**
 * Unit tests for the admin dashboard's pure derivation helpers
 * (blocMembershipAtRound) — no DB, no DOM.
 */
import { describe, expect, it } from 'vitest'
import { ALL_COUNTRY_NAMES, COUNTRIES } from '@contracts/game-data'
import { blocMembershipAtRound } from './admin-utils'
import type { AdminBlocRow } from './admin-utils'

let rowId = 0
function row(round: number, country: string, blocName: string): AdminBlocRow {
  return { id: ++rowId, roomId: 1, round, country, blocName } as AdminBlocRow
}

const startingBlocs = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c.startingBloc]),
)

describe('blocMembershipAtRound', () => {
  it('seeds the full 15-country roster into the three starting blocs', () => {
    const at = blocMembershipAtRound([], 1, ALL_COUNTRY_NAMES)
    expect(at.get('Nuclear Energy')).toHaveLength(5)
    expect(at.get('Green Energy')).toHaveLength(5)
    expect(at.get('Fossil Fuel')).toHaveLength(5)
  })

  it('seeds only the room roster — no phantom countries from the other 15', () => {
    const roster = ['USA', 'China', 'Japan']
    const at = blocMembershipAtRound([], 1, roster)
    expect(at.get('Nuclear Energy')!.sort()).toEqual(['China', 'USA'])
    expect(at.get('Fossil Fuel')).toEqual(['Japan'])
    // Green Energy has no roster members, so it does not appear at all.
    expect(at.has('Green Energy')).toBe(false)
    const total = [...at.values()].flat()
    expect(total.sort()).toEqual(['China', 'Japan', 'USA'])
  })

  it('applies history rows at or before the round on top of the roster seeds', () => {
    const roster = ['USA', 'China', 'Japan']
    const history = [
      row(1, 'Japan', 'Nuclear Energy'),
      row(2, 'USA', 'Pacific Alliance'),
    ]
    const round1 = blocMembershipAtRound(history, 1, roster)
    expect(round1.get('Nuclear Energy')!.sort()).toEqual(['China', 'Japan', 'USA'])
    expect(round1.has('Fossil Fuel')).toBe(false) // Japan moved out
    expect(round1.has('Pacific Alliance')).toBe(false)

    const round2 = blocMembershipAtRound(history, 2, roster)
    expect(round2.get('Nuclear Energy')).toEqual(['China', 'Japan'])
    expect(round2.get('Pacific Alliance')).toEqual(['USA'])
    expect(round2.has('Fossil Fuel')).toBe(false)
  })

  it('matches the countries starting-bloc seed for every roster member', () => {
    for (const c of COUNTRIES) {
      const at = blocMembershipAtRound([], 1, [c.name])
      expect(at.get(startingBlocs[c.name])).toEqual([c.name])
    }
  })
})
