/**
 * Unit tests for the scoring engine (pure functions, no DB).
 */
import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  COUNTRY_BY_NAME,
  type AssetKey,
} from "@contracts/game-data";
import {
  claimedScoreboard,
  computeDealPoints,
  emptyScore,
  evaluateCondition,
  evaluateMissions,
  finalBlocSummaries,
  type DealFact,
  type GameFacts,
} from "./scoring";

let dealId = 0;
function deal(
  a: string,
  b: string,
  dealType: AssetKey,
  powerCard = "Test Card",
): DealFact {
  return {
    id: ++dealId,
    round: 1,
    initiatorCountry: a,
    targetCountry: b,
    dealType,
    powerCard,
    initiatorPoints: null,
    targetPoints: null,
  };
}

const startingBlocs = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c.startingBloc]),
);

function makeFacts(partial: Partial<GameFacts> = {}): GameFacts {
  return {
    deals: [],
    currentBlocs: { ...startingBlocs },
    peeks: [],
    overrides: [],
    adjustments: [],
    final: false,
    ...partial,
  };
}

function missionOf(country: string, slot: "public" | "private" | "bonus") {
  const m = COUNTRY_BY_NAME[country].missions.find((x) => x.slot === slot);
  if (!m) throw new Error(`no ${slot} mission for ${country}`);
  return m;
}

describe("deal points", () => {
  it("gives 3 pts to each party when partners share a bloc at signing time", () => {
    // USA & China both start in Nuclear Energy.
    expect(computeDealPoints("USA", "China", startingBlocs)).toEqual({
      initiatorPoints: 3,
      targetPoints: 3,
    });
  });

  it("gives 2 pts to each party for a cross-bloc deal", () => {
    // USA (Nuclear Energy) vs Japan (Fossil Fuel).
    expect(computeDealPoints("USA", "Japan", startingBlocs)).toEqual({
      initiatorPoints: 2,
      targetPoints: 2,
    });
  });

  it("freeCrossBloc party always earns 3, partner unaffected", () => {
    // Denmark has freeCrossBloc (military 3); Japan does not.
    const pts = computeDealPoints("Denmark", "Japan", startingBlocs);
    expect(pts.initiatorPoints).toBe(3); // Denmark
    expect(pts.targetPoints).toBe(2); // Japan
  });

  it("uses the CURRENT blocs at signing time, not starting blocs", () => {
    // Japan moved into Nuclear Energy before signing with the USA.
    const blocs = { ...startingBlocs, Japan: "Nuclear Energy" };
    expect(computeDealPoints("USA", "Japan", blocs)).toEqual({
      initiatorPoints: 3,
      targetPoints: 3,
    });
  });
});

describe("deal_count mission (China public: 2 Infrastructure deals)", () => {
  const cond = missionOf("China", "public").condition;

  it("is on_track below the threshold during the game", () => {
    const facts = makeFacts({
      deals: [deal("China", "Japan", "resources")],
    });
    expect(evaluateCondition("China", cond, facts)).toBe("on_track");
  });

  it("is completed once the threshold is met", () => {
    const facts = makeFacts({
      deals: [
        deal("China", "Japan", "resources"),
        deal("Brazil", "China", "resources"),
        deal("China", "USA", "military"), // wrong type, must not count
      ],
    });
    expect(evaluateCondition("China", cond, facts)).toBe("completed");
  });

  it("resolves to failed at game end when unmet", () => {
    const facts = makeFacts({ final: true, deals: [] });
    expect(evaluateCondition("China", cond, facts)).toBe("failed");
  });
});

describe("deal_with_power_each mission (Saudi Arabia public)", () => {
  const cond = missionOf("Saudi Arabia", "public").condition;

  it("needs a partner for EVERY listed power", () => {
    // China has Industry & Labor; France has Agritech.
    const partial = makeFacts({
      deals: [deal("Saudi Arabia", "China", "resources")],
    });
    expect(evaluateCondition("Saudi Arabia", cond, partial)).toBe("on_track");

    const full = makeFacts({
      deals: [
        deal("Saudi Arabia", "China", "resources"),
        deal("France", "Saudi Arabia", "tech"),
      ],
    });
    expect(evaluateCondition("Saudi Arabia", cond, full)).toBe("completed");
  });
});

describe("no_deal_type_with_counterparty_of (USA bonus)", () => {
  const cond = missionOf("USA", "bonus").condition;

  it("is on_track while clean during the game", () => {
    const facts = makeFacts({
      deals: [deal("USA", "Japan", "military")],
    });
    expect(evaluateCondition("USA", cond, facts)).toBe("on_track");
  });

  it("fails immediately when the USA signs military with a country that signed resources with China", () => {
    const facts = makeFacts({
      deals: [
        deal("China", "Japan", "resources"), // Japan tainted
        deal("USA", "Japan", "military"), // violation
      ],
    });
    expect(evaluateCondition("USA", cond, facts)).toBe("failed");
  });

  it("resolves to completed at game end when never violated", () => {
    const facts = makeFacts({
      final: true,
      deals: [
        deal("China", "Japan", "resources"),
        deal("USA", "France", "military"), // France is clean
      ],
    });
    expect(evaluateCondition("USA", cond, facts)).toBe("completed");
  });
});

describe("cross_bloc_deals mission (Canada bonus: 3 deals outside starting bloc)", () => {
  const cond = missionOf("Canada", "bonus").condition;

  it("counts DEALS, not distinct partners: 3 deals with the same outside-bloc partner complete it", () => {
    // Canada starts in Nuclear Energy; Japan starts in Fossil Fuel.
    const facts = makeFacts({
      deals: [
        deal("Canada", "Japan", "energy"),
        deal("Canada", "Japan", "resources"),
        deal("Japan", "Canada", "tech"),
      ],
    });
    expect(evaluateCondition("Canada", cond, facts)).toBe("completed");
  });

  it("does not count deals with same-starting-bloc partners", () => {
    // USA and France share Canada's starting bloc (Nuclear Energy).
    const facts = makeFacts({
      deals: [
        deal("Canada", "USA", "energy"),
        deal("Canada", "France", "resources"),
        deal("Canada", "Japan", "tech"),
      ],
    });
    expect(evaluateCondition("Canada", cond, facts)).toBe("on_track");
  });

  it("is on_track below the threshold and fails unmet at game end", () => {
    const facts = makeFacts({
      deals: [deal("Canada", "Japan", "energy"), deal("Canada", "Japan", "tech")],
    });
    expect(evaluateCondition("Canada", cond, facts)).toBe("on_track");
    expect(evaluateCondition("Canada", cond, makeFacts({ ...facts, final: true }))).toBe(
      "failed",
    );
  });
});

describe("biggest_bloc mission (ties count)", () => {
  const cond = missionOf("Saudi Arabia", "bonus").condition;

  it("mid-game is a live indicator (on_track / at_risk), never decided", () => {
    const facts = makeFacts(); // 5/5/5 starting blocs: everyone tied-biggest
    expect(evaluateCondition("Saudi Arabia", cond, facts)).toBe("on_track");
    const losing = makeFacts({
      currentBlocs: { ...startingBlocs, "Saudi Arabia": "Tiny Bloc" },
    });
    expect(evaluateCondition("Saudi Arabia", cond, losing)).toBe("at_risk");
  });

  it("at game end, members of ALL tied-biggest blocs complete it", () => {
    // Nuclear Energy 5, Green Energy 5, Fossil Fuel 5 -> 3-way tie.
    const facts = makeFacts({ final: true });
    expect(evaluateCondition("Saudi Arabia", cond, facts)).toBe("completed"); // Nuclear
    expect(evaluateCondition("Chile", cond, facts)).toBe("completed"); // Green
    expect(evaluateCondition("Japan", cond, facts)).toBe("completed"); // Fossil
  });

  it("at game end, members of smaller blocs fail it", () => {
    const facts = makeFacts({
      final: true,
      currentBlocs: { ...startingBlocs, Chile: "Tiny Bloc" }, // Green now 4
    });
    expect(evaluateCondition("Chile", cond, facts)).toBe("failed");
    // Nuclear (5) and Fossil (5) tie as biggest; Green (4) loses.
    expect(evaluateCondition("Japan", cond, facts)).toBe("completed");
    expect(evaluateCondition("Sweden", cond, facts)).toBe("failed");
  });
});

describe("mission wrappers", () => {
  it("admin overrides supersede the auto evaluation", () => {
    const facts = makeFacts({
      overrides: [
        { country: "China", missionSlot: "public", status: "completed" },
      ],
    });
    const results = evaluateMissions("China", facts);
    const pub = results.find((m) => m.slot === "public")!;
    expect(pub.status).toBe("completed");
    expect(pub.points).toBe(10);
    expect(pub.overridden).toBe(true);
  });
});

describe("claimed-only missions & scores", () => {
  it("emptyScore is a zeroed breakdown with no missions", () => {
    expect(emptyScore("Japan")).toEqual({
      country: "Japan",
      dealPoints: 0,
      missionPoints: 0,
      adjustments: 0,
      total: 0,
      missions: [],
    });
  });

  it("claimedScoreboard excludes unclaimed active countries and ranks by total", () => {
    const facts = makeFacts({
      // mid-game: no mission points decided yet, so both tie on deal points
      deals: [deal("USA", "China", "military")], // same bloc: 3 pts each
    });
    // Japan is active but has no seated player.
    const claimed = new Set(["China", "USA"]);
    const board = claimedScoreboard(COUNTRIES, facts, claimed);
    expect(board.map((r) => r.country)).toEqual(["China", "USA"]); // alpha tiebreak
    expect(board.map((r) => r.rank)).toEqual([1, 2]);
    expect(board.every((r) => r.dealPoints === 3)).toBe(true);
    expect(board.find((r) => r.country === "Japan")).toBeUndefined();
  });

  it("finalBlocSummaries lists every country in the given bloc map and flags unclaimed members", () => {
    // The scoring engine honors whatever map it is given (buildFacts strips
    // unclaimed seats upstream); here a full 15-country map keeps Chile's
    // seat visible and flags it as unclaimed.
    const facts = makeFacts({ final: true }); // 5/5/5 starting blocs
    const allButChile = new Set(
      COUNTRIES.map((c) => c.name).filter((n) => n !== "Chile"),
    );
    const blocs = finalBlocSummaries(COUNTRIES, facts, allButChile);
    const green = blocs.find((b) => b.name === "Green Energy")!;
    expect(green.size).toBe(5);
    expect(green.members).toContain("Chile");
    expect(green.unclaimedMembers).toEqual(["Chile"]);
    expect(green.isBiggest).toBe(true); // 5/5/5 tie
    const nuclear = blocs.find((b) => b.name === "Nuclear Energy")!;
    expect(nuclear.unclaimedMembers).toEqual([]);
  });

  it("biggest_bloc math uses the given bloc map when deciding missions", () => {
    // Saudi Arabia's bonus mission is biggest_bloc. With a full 15-country
    // map the 5/5/5 tie completes it; in production buildFacts hands the
    // engine a claimed-only map, so empty chairs never prop up a bloc.
    const cond = missionOf("Saudi Arabia", "bonus").condition;
    const facts = makeFacts({ final: true }); // all 15 present: 5/5/5 tie
    expect(evaluateCondition("Saudi Arabia", cond, facts)).toBe("completed");
    // claimedScoreboard restricts the RANKING to claimed countries but still
    // evaluates each claimed country's missions against the given bloc map.
    const claimed = new Set(["Saudi Arabia"]);
    const board = claimedScoreboard(COUNTRIES, facts, claimed);
    const sa = board.find((r) => r.country === "Saudi Arabia")!;
    expect(sa.missions.find((m) => m.slot === "bonus")!.status).toBe(
      "completed",
    );
  });
});

describe("finalBlocSummaries with claimed-only bloc maps", () => {
  it("emits an empty entry for every active-roster starting bloc with no members", () => {
    // Only two Nuclear countries are claimed; Green/Fossil have active-roster
    // seats but no delegates, so they show up as empty sections.
    const facts = makeFacts({
      final: true,
      currentBlocs: { USA: "Nuclear Energy", China: "Nuclear Energy" },
    });
    const claimed = new Set(["USA", "China"]);
    const blocs = finalBlocSummaries(COUNTRIES, facts, claimed);
    expect(blocs.map((b) => b.name)).toEqual([
      "Nuclear Energy", // size 2 sorts first…
      "Fossil Fuel", // …then empty blocs by name
      "Green Energy",
    ]);
    const fossil = blocs.find((b) => b.name === "Fossil Fuel")!;
    expect(fossil).toMatchObject({
      members: [],
      unclaimedMembers: [],
      size: 0,
      isBiggest: false,
    });
    const green = blocs.find((b) => b.name === "Green Energy")!;
    expect(green.size).toBe(0);
    expect(green.isBiggest).toBe(false);
  });

  it("does not invent empty custom blocs", () => {
    const facts = makeFacts({
      final: true,
      currentBlocs: { USA: "Nuclear Energy" },
    });
    const blocs = finalBlocSummaries(COUNTRIES, facts, new Set(["USA"]));
    expect(blocs.map((b) => b.name).sort()).toEqual([
      "Fossil Fuel",
      "Green Energy",
      "Nuclear Energy",
    ]);
  });

  it("keeps custom blocs that have claimed members", () => {
    const facts = makeFacts({
      final: true,
      currentBlocs: { USA: "Pacific Alliance", Japan: "Pacific Alliance" },
    });
    const claimed = new Set(["USA", "Japan"]);
    const blocs = finalBlocSummaries(COUNTRIES, facts, claimed);
    const custom = blocs.find((b) => b.name === "Pacific Alliance")!;
    expect(custom.size).toBe(2);
    expect(custom.isBiggest).toBe(true); // only non-empty bloc
    // Empty starting blocs still trail behind.
    expect(blocs.filter((b) => b.size === 0).map((b) => b.name)).toEqual([
      "Fossil Fuel",
      "Green Energy",
      "Nuclear Energy",
    ]);
  });

  it("crowns no bloc when every bloc is empty", () => {
    const facts = makeFacts({ final: true, currentBlocs: {} });
    const blocs = finalBlocSummaries(COUNTRIES, facts, new Set());
    expect(blocs).toHaveLength(3); // the three starting blocs only
    expect(blocs.every((b) => b.size === 0 && !b.isBiggest)).toBe(true);
  });
});
