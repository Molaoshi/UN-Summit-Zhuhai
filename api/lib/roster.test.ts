/**
 * Unit tests for the teacher-selectable country roster validation
 * (resolveActiveCountries in contracts/game-data.ts) — pure, no DB.
 */
import { describe, expect, it } from "vitest";
import {
  ALL_COUNTRY_NAMES,
  NAMED_DEPENDENCIES,
  resolveActiveCountries,
} from "@contracts/game-data";

describe("resolveActiveCountries", () => {
  it("defaults to the full 15-country roster when input is undefined/null", () => {
    for (const input of [undefined, null]) {
      const r = resolveActiveCountries(input);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.countries).toEqual(ALL_COUNTRY_NAMES);
        expect(r.countries).toHaveLength(15);
        expect(r.added).toEqual([]);
      }
    }
  });

  it("auto-adds missing NAMED_DEPENDENCIES instead of erroring", () => {
    // South Korea's missions name Japan; USA/China are included already.
    const r = resolveActiveCountries(["USA", "China", "South Korea"]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.added).toEqual(["Japan"]);
    expect(r.countries).toContain("Japan");
    // Canonical roster order (China before USA before Japan…).
    expect(r.countries).toEqual(["China", "USA", "Japan", "South Korea"]);
  });

  it("auto-adds transitive dependencies (Saudi Arabia pulls in USA+China)", () => {
    const r = resolveActiveCountries(["USA", "China", "Saudi Arabia"]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.countries).toEqual(
      expect.arrayContaining(["USA", "China", "Saudi Arabia"]),
    );
    expect(r.added).toEqual([]);
  });

  it("rejects rosters missing USA or China (hard lock, never auto-added)", () => {
    for (const input of [
      ["China", "Japan"],
      ["USA", "Japan"],
      ["South Korea", "Japan"],
    ]) {
      const r = resolveActiveCountries(input);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/must always be active/);
    }
  });

  it("rejects unknown country names", () => {
    const r = resolveActiveCountries(["USA", "China", "Atlantis"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Unknown country: Atlantis/);
  });

  it("de-duplicates input and keeps canonical order", () => {
    const r = resolveActiveCountries(["USA", "USA", "China", "China"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.countries).toEqual(["China", "USA"]);
  });

  it("every country in NAMED_DEPENDENCIES keys/values is a known country", () => {
    for (const [country, deps] of Object.entries(NAMED_DEPENDENCIES)) {
      expect(ALL_COUNTRY_NAMES).toContain(country);
      for (const dep of deps) expect(ALL_COUNTRY_NAMES).toContain(dep);
    }
  });
});
