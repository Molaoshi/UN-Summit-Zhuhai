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
  computeDealPoints,
  evaluateCondition,
  evaluateMissions,
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
