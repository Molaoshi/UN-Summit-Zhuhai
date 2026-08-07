/**
 * Unit tests for the pure seating helpers (teacher-assigns-countries model).
 */
import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@contracts/game-data";
import {
  claimedCountries,
  claimedCountryData,
  planAssignSeat,
  seatHolder,
  unseatedPlayers,
  type SeatRow,
} from "./seating";

let pid = 0;
function player(
  name: string,
  countryName: string | null = null,
  isAdmin = false,
): SeatRow {
  return { id: ++pid, name, countryName, isAdmin };
}

const ACTIVE = ["China", "USA", "Japan", "France"];

describe("claimedCountries / unseatedPlayers", () => {
  it("claimed = countries held by non-admin players", () => {
    const players = [
      player("Teacher", null, true),
      player("Ada", "USA"),
      player("Bo", "Japan"),
      player("Cy"), // unseated
    ];
    expect(claimedCountries(players)).toEqual(new Set(["USA", "Japan"]));
    expect(unseatedPlayers(players)).toEqual([{ id: players[3].id, name: "Cy" }]);
  });

  it("an admin holding a country (should never happen) is not a claim", () => {
    const players = [player("Teacher", "USA", true)];
    expect(claimedCountries(players)).toEqual(new Set());
    expect(seatHolder(players, "USA")).toBeUndefined();
  });
});

describe("claimedCountryData (publicMissions filtering)", () => {
  it("keeps only claimed countries, in canonical order", () => {
    const active = COUNTRIES.filter((c) => ACTIVE.includes(c.name));
    const visible = claimedCountryData(active, new Set(["USA", "France"]));
    expect(visible.map((c) => c.name)).toEqual(["USA", "France"]);
  });
});

describe("planAssignSeat", () => {
  it("assigns a player to a free seat", () => {
    const ada = player("Ada");
    const plan = planAssignSeat([ada], ada.id, "USA", ACTIVE);
    expect(plan).toMatchObject({
      ok: true,
      noop: false,
      previousCountry: null,
      evictedPlayer: null,
    });
  });

  it("moves a player off their old seat (previousCountry reported)", () => {
    const ada = player("Ada", "Japan");
    const plan = planAssignSeat([ada], ada.id, "USA", ACTIVE);
    expect(plan).toMatchObject({
      ok: true,
      noop: false,
      previousCountry: "Japan",
      evictedPlayer: null,
    });
  });

  it("evicts the current holder of the target seat", () => {
    const ada = player("Ada", "Japan");
    const bo = player("Bo", "USA");
    const plan = planAssignSeat([ada, bo], ada.id, "USA", ACTIVE);
    expect(plan).toMatchObject({ ok: true, noop: false, previousCountry: "Japan" });
    if (plan.ok) expect(plan.evictedPlayer?.name).toBe("Bo");
  });

  it("is a no-op when the player already holds that seat", () => {
    const ada = player("Ada", "USA");
    const plan = planAssignSeat([ada], ada.id, "USA", ACTIVE);
    expect(plan).toMatchObject({
      ok: true,
      noop: true,
      previousCountry: "USA",
      evictedPlayer: null,
    });
  });

  it("rejects a country outside the room roster", () => {
    const ada = player("Ada");
    expect(planAssignSeat([ada], ada.id, "Brazil", ACTIVE)).toEqual({
      ok: false,
      reason: "country_not_active",
    });
  });

  it("rejects unknown player ids and the admin", () => {
    const ada = player("Ada");
    const teacher = player("Teacher", null, true);
    expect(planAssignSeat([ada], 9999, "USA", ACTIVE)).toEqual({
      ok: false,
      reason: "player_not_found",
    });
    expect(planAssignSeat([ada, teacher], teacher.id, "USA", ACTIVE)).toEqual({
      ok: false,
      reason: "player_is_admin",
    });
  });
});
