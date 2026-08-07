/**
 * Pure seating helpers for the teacher-assigns-countries model (no DB).
 *
 * A country seat is "claimed" when a non-admin player's `countryName` points
 * at it. Only claimed countries participate in missions, scores, deals and
 * espionage; unclaimed-but-active countries still occupy their bloc seats
 * (they count toward biggest_bloc / bloc_size math).
 */
import type { CountryData } from "@contracts/game-data";

export interface SeatRow {
  id: number;
  name: string;
  countryName: string | null;
  isAdmin: boolean;
}

/** Names of countries that currently have a seated player. */
export function claimedCountries(players: SeatRow[]): Set<string> {
  const set = new Set<string>();
  for (const p of players) {
    if (!p.isAdmin && p.countryName) set.add(p.countryName);
  }
  return set;
}

/** Non-admin players with no country seat (waiting for the teacher). */
export function unseatedPlayers(
  players: SeatRow[],
): { id: number; name: string }[] {
  return players
    .filter((p) => !p.countryName && !p.isAdmin)
    .map((p) => ({ id: p.id, name: p.name }));
}

/** Who holds a country seat, if anyone. */
export function seatHolder(
  players: SeatRow[],
  country: string,
): SeatRow | undefined {
  return players.find((p) => !p.isAdmin && p.countryName === country);
}

/** Active roster filtered to the countries with a seated player. */
export function claimedCountryData(
  active: CountryData[],
  claimed: Set<string>,
): CountryData[] {
  return active.filter((c) => claimed.has(c.name));
}

// ── Admin seat assignment ──────────────────────────────────────────────────

export type AssignSeatFailure =
  | "country_not_active"
  | "player_not_found"
  | "player_is_admin";

export type AssignSeatPlan =
  | {
      ok: true;
      /** Player already holds this exact seat — nothing to change. */
      noop: boolean;
      player: SeatRow;
      /** Seat the player moves away from (released), or null. */
      previousCountry: string | null;
      /** Player evicted from the target seat (released), or null. */
      evictedPlayer: SeatRow | null;
    }
  | { ok: false; reason: AssignSeatFailure };

/**
 * Decide the effects of the teacher seating `playerId` at `country`.
 * The router validates the room/status first, then executes the DB updates:
 * evict the current holder (if any), then move the player.
 */
export function planAssignSeat(
  players: SeatRow[],
  playerId: number,
  country: string,
  active: readonly string[],
): AssignSeatPlan {
  if (!active.includes(country)) {
    return { ok: false, reason: "country_not_active" };
  }
  const player = players.find((p) => p.id === playerId);
  if (!player) return { ok: false, reason: "player_not_found" };
  if (player.isAdmin) return { ok: false, reason: "player_is_admin" };
  const previousCountry = player.countryName;
  if (previousCountry === country) {
    return {
      ok: true,
      noop: true,
      player,
      previousCountry,
      evictedPlayer: null,
    };
  }
  const evicted = seatHolder(players, country);
  return {
    ok: true,
    noop: false,
    player,
    previousCountry,
    evictedPlayer: evicted && evicted.id !== player.id ? evicted : null,
  };
}
