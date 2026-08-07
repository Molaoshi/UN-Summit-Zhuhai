/**
 * Unit tests for the pure seating helpers (teacher-assigns-countries model).
 */
import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@contracts/game-data";
import {
  claimedCountries,
  claimedCountryData,
  MAX_ASSISTANTS_PER_ROOM,
  planAssignSeat,
  planSetAssistant,
  seatHolder,
  unseatedPlayers,
  type SeatRow,
} from "./seating";

let pid = 0;
function player(
  name: string,
  countryName: string | null = null,
  isAdmin = false,
  isAssistant = false,
): SeatRow {
  return { id: ++pid, name, countryName, isAdmin, isAssistant };
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
    expect(unseatedPlayers(players)).toEqual([
      { id: players[3].id, name: "Cy", isAssistant: false },
    ]);
  });

  it("unseated entries expose isAssistant so the lobby can label them", () => {
    const players = [player("Ada", null, false, true), player("Bo")];
    expect(unseatedPlayers(players)).toEqual([
      { id: players[0].id, name: "Ada", isAssistant: true },
      { id: players[1].id, name: "Bo", isAssistant: false },
    ]);
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

  it("flags clearsAssistant when the target is an assistant", () => {
    const ada = player("Ada", null, false, true);
    const plan = planAssignSeat([ada], ada.id, "USA", ACTIVE);
    expect(plan).toMatchObject({
      ok: true,
      noop: false,
      clearsAssistant: true,
      previousCountry: null,
    });
  });

  it("does not flag clearsAssistant for a regular player", () => {
    const ada = player("Ada");
    const plan = planAssignSeat([ada], ada.id, "USA", ACTIVE);
    expect(plan).toMatchObject({ ok: true, clearsAssistant: false });
  });
});

describe("planSetAssistant", () => {
  it("promotes an unseated player to assistant", () => {
    const ada = player("Ada");
    const plan = planSetAssistant([ada], ada.id, true);
    expect(plan).toMatchObject({
      ok: true,
      noop: false,
      assistant: true,
      releasedCountry: null,
    });
  });

  it("promoting releases the player's country seat", () => {
    const ada = player("Ada", "USA");
    const plan = planSetAssistant([ada], ada.id, true);
    expect(plan).toMatchObject({
      ok: true,
      noop: false,
      assistant: true,
      releasedCountry: "USA",
    });
  });

  it("demoting returns the assistant to unseated (no seat restored)", () => {
    const ada = player("Ada", null, false, true);
    const plan = planSetAssistant([ada], ada.id, false);
    expect(plan).toMatchObject({
      ok: true,
      noop: false,
      assistant: false,
      releasedCountry: null,
    });
  });

  it("is a no-op when the player is already in the requested state", () => {
    const ada = player("Ada", null, false, true);
    expect(planSetAssistant([ada], ada.id, true)).toMatchObject({
      ok: true,
      noop: true,
    });
    const bo = player("Bo");
    expect(planSetAssistant([bo], bo.id, false)).toMatchObject({
      ok: true,
      noop: true,
    });
  });

  it("rejects unknown player ids and the room admin", () => {
    const ada = player("Ada");
    const teacher = player("Teacher", null, true);
    expect(planSetAssistant([ada], 9999, true)).toEqual({
      ok: false,
      reason: "player_not_found",
    });
    expect(planSetAssistant([ada, teacher], teacher.id, true)).toEqual({
      ok: false,
      reason: "player_is_admin",
    });
  });

  it("allows up to MAX_ASSISTANTS_PER_ROOM assistants, then rejects", () => {
    const assistants = Array.from({ length: MAX_ASSISTANTS_PER_ROOM }, (_, i) =>
      player(`A${i}`, null, false, true),
    );
    const extra = player("Extra");
    expect(
      planSetAssistant([...assistants, extra], extra.id, true),
    ).toEqual({ ok: false, reason: "assistant_limit" });
    // Demoting is always allowed, even at the cap.
    expect(
      planSetAssistant(assistants, assistants[0].id, false),
    ).toMatchObject({ ok: true, noop: false, assistant: false });
    // One below the cap still promotes fine.
    const belowCap = assistants.slice(1);
    expect(
      planSetAssistant([...belowCap, extra], extra.id, true),
    ).toMatchObject({ ok: true, noop: false, assistant: true });
  });

  it("the room admin does not count toward the assistant cap", () => {
    const teacher = player("Teacher", null, true, true); // inconsistent, but robust
    const assistants = Array.from({ length: MAX_ASSISTANTS_PER_ROOM }, (_, i) =>
      player(`A${i}`, null, false, true),
    );
    const extra = player("Extra");
    expect(
      planSetAssistant([teacher, ...assistants, extra], extra.id, true),
    ).toEqual({ ok: false, reason: "assistant_limit" });
    expect(
      planSetAssistant([teacher, ...assistants.slice(1), extra], extra.id, true),
    ).toMatchObject({ ok: true });
  });
});
