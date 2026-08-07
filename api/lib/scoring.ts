/**
 * Scoring engine for "UN Summit: Zhuhai" — pure functions, no DB access.
 *
 * Inputs are plain row-like objects (accepted deals, bloc memberships,
 * espionage peeks, admin overrides, score adjustments). Routers assemble the
 * facts; this module computes deal points, live mission statuses and totals.
 */
import {
  BLOC_DEAL_POINTS,
  COUNTRY_BY_NAME,
  CROSS_BLOC_DEAL_POINTS,
  MISSION_POINTS,
  STARTING_BLOCS,
  countryHasPower,
  type AssetKey,
  type CompareOp,
  type CountryData,
  type MissionCondition,
  type MissionSlot,
} from "@contracts/game-data";

// ── Fact types ─────────────────────────────────────────────────────────────

export interface DealFact {
  id: number;
  round: number;
  initiatorCountry: string;
  targetCountry: string;
  dealType: AssetKey;
  powerCard: string;
  initiatorPoints: number | null;
  targetPoints: number | null;
}

export interface BlocFact {
  country: string;
  blocName: string;
}

export interface PeekFact {
  country: string;
  peekedCountry: string;
}

export interface OverrideFact {
  country: string;
  missionSlot: MissionSlot;
  status: "completed" | "failed";
}

export interface AdjustmentFact {
  country: string;
  delta: number;
}

export interface GameFacts {
  /** Accepted deals only (pending/cancelled never count). */
  deals: DealFact[];
  /** Current bloc per country (latest membership row). */
  currentBlocs: Record<string, string>;
  peeks: PeekFact[];
  /** Latest override per (country, slot) — resolved by the caller. */
  overrides: OverrideFact[];
  adjustments: AdjustmentFact[];
  /** True at game end: decides every still-undecided condition. */
  final: boolean;
}

export type MissionStatus = "completed" | "on_track" | "at_risk" | "failed";

export interface MissionResult {
  slot: MissionSlot;
  text: string;
  status: MissionStatus;
  points: number;
  overridden: boolean;
}

export interface ScoreBreakdown {
  country: string;
  dealPoints: number;
  missionPoints: number;
  adjustments: number;
  total: number;
  missions: MissionResult[];
}

// ── Small helpers ──────────────────────────────────────────────────────────

function cmp(op: CompareOp, a: number, b: number): boolean {
  switch (op) {
    case "gt":
      return a > b;
    case "gte":
      return a >= b;
    case "lt":
      return a < b;
    case "lte":
      return a <= b;
  }
}

function countryData(name: string): CountryData | undefined {
  return COUNTRY_BY_NAME[name];
}

/** All accepted deals where `country` is either party. */
function myDeals(country: string, facts: GameFacts): DealFact[] {
  return facts.deals.filter(
    (d) => d.initiatorCountry === country || d.targetCountry === country,
  );
}

/** The counterparty of `country` in deal `d`. */
function partnerOf(country: string, d: DealFact): string {
  return d.initiatorCountry === country ? d.targetCountry : d.initiatorCountry;
}

function countMyDeals(
  country: string,
  facts: GameFacts,
  dealType?: AssetKey,
): number {
  return myDeals(country, facts).filter(
    (d) => !dealType || d.dealType === dealType,
  ).length;
}

/** Biggest bloc(s) by current membership. Ties all count as "biggest". */
export function biggestBlocNames(facts: GameFacts): string[] {
  const sizes = new Map<string, number>();
  for (const { blocName } of Object.values(facts.currentBlocs).map((b) => ({
    blocName: b,
  }))) {
    sizes.set(blocName, (sizes.get(blocName) ?? 0) + 1);
  }
  let max = 0;
  for (const n of sizes.values()) max = Math.max(max, n);
  return [...sizes.entries()].filter(([, n]) => n === max).map(([b]) => b);
}

// ── Deal points ────────────────────────────────────────────────────────────

/**
 * Points for ONE party of a deal, given the bloc map AT SIGNING TIME.
 * 3 pts if the partner is in the party's current bloc at signing time, or the
 * party has freeCrossBloc (military rating <= 3); otherwise 2 pts.
 */
export function partyDealPoints(
  party: string,
  partner: string,
  blocsAtSigning: Record<string, string>,
): number {
  const me = countryData(party);
  if (me?.freeCrossBloc) return BLOC_DEAL_POINTS;
  const myBloc = blocsAtSigning[party];
  const partnerBloc = blocsAtSigning[partner];
  if (myBloc && partnerBloc && myBloc === partnerBloc) return BLOC_DEAL_POINTS;
  return CROSS_BLOC_DEAL_POINTS;
}

/** Both parties' points for a deal being accepted right now. */
export function computeDealPoints(
  initiatorCountry: string,
  targetCountry: string,
  blocsAtSigning: Record<string, string>,
): { initiatorPoints: number; targetPoints: number } {
  return {
    initiatorPoints: partyDealPoints(
      initiatorCountry,
      targetCountry,
      blocsAtSigning,
    ),
    targetPoints: partyDealPoints(
      targetCountry,
      initiatorCountry,
      blocsAtSigning,
    ),
  };
}

// ── Mission condition evaluation ───────────────────────────────────────────
//
// Per-kind status rules (status = 'completed' | 'on_track' | 'at_risk' | 'failed').
// 'completed'/'failed' are only reported when the outcome is logically DECIDED:
//
// - Positive threshold conditions (deal_count, deal_with_country,
//   deal_with_power, deal_with_power_each, deal_with_energy_rating,
//   cross_bloc_deals, deal_types_diversity, total_deals,
//   cover_starting_blocs, deal_with_peeked_country): accepted deals can never
//   be revoked, so once the threshold is met the mission is permanently
//   'completed'. Until then it is 'on_track' (still achievable); at game end
//   (facts.final) an unmet threshold becomes 'failed'.
//
// - Negative conditions (no_deal_type_with_counterparty_of,
//   no_deals_with_country): a violation is permanent, so a violated condition
//   is immediately 'failed'. While clean it stays 'on_track' during the game
//   and resolves to 'completed' only at game end.
//
// - Comparison conditions (deal_count_compare, total_deals_compare): both
//   sides of the comparison can still move, so nothing is decided mid-game.
//   Currently winning -> 'on_track', currently losing/tied -> 'at_risk'.
//   Decided ('completed'/'failed') only at game end.
//
// - Bloc conditions (biggest_bloc, bloc_size): bloc membership changes every
//   round end, so mid-game these are live indicators: currently satisfied ->
//   'on_track', otherwise -> 'at_risk'. Decided only at game end, evaluated on
//   the final (current) blocs; biggest_bloc counts ties.
//
// - 'all': every sub-condition must be 'completed' for 'completed'; at game
//   end, any non-completed sub-condition makes it 'failed'; otherwise
//   'on_track' ('at_risk' if every sub-condition is 'at_risk'/'failed').

export function evaluateCondition(
  country: string,
  cond: MissionCondition,
  facts: GameFacts,
): MissionStatus {
  const me = countryData(country);
  const myStartingBloc = me?.startingBloc;

  // Decided-by-threshold helper: met -> completed; else on_track, or failed at end.
  const threshold = (met: boolean): MissionStatus =>
    met ? "completed" : facts.final ? "failed" : "on_track";
  // Negative-condition helper: violated -> failed; else on_track, completed at end.
  const negative = (violated: boolean): MissionStatus =>
    violated ? "failed" : facts.final ? "completed" : "on_track";
  // Live-indicator helper: decided only at game end.
  const live = (ok: boolean): MissionStatus =>
    facts.final ? (ok ? "completed" : "failed") : ok ? "on_track" : "at_risk";

  switch (cond.kind) {
    case "deal_count":
      return threshold(
        countMyDeals(country, facts, cond.dealType) >= cond.min,
      );

    case "total_deals":
      return threshold(countMyDeals(country, facts) >= cond.min);

    case "deal_count_compare": {
      const mine = countMyDeals(country, facts, cond.dealType);
      const theirs = countMyDeals(cond.otherCountry, facts, cond.otherDealType);
      return live(cmp(cond.op, mine, theirs));
    }

    case "total_deals_compare": {
      const mine = countMyDeals(country, facts);
      const theirs = countMyDeals(cond.otherCountry, facts);
      return live(cmp(cond.op, mine, theirs));
    }

    case "deal_with_country":
      return threshold(
        myDeals(country, facts).some(
          (d) =>
            partnerOf(country, d) === cond.country &&
            d.dealType === cond.dealType,
        ),
      );

    case "deal_with_power": {
      const n = myDeals(country, facts).filter((d) => {
        if (cond.dealType && d.dealType !== cond.dealType) return false;
        return countryHasPower(partnerOf(country, d), cond.power);
      }).length;
      return threshold(n >= cond.min);
    }

    case "deal_with_power_each": {
      const ok = cond.powers.every((power) =>
        myDeals(country, facts).some((d) =>
          countryHasPower(partnerOf(country, d), power),
        ),
      );
      return threshold(ok);
    }

    case "deal_with_energy_rating": {
      const ok = myDeals(country, facts).some((d) => {
        if (cond.dealType && d.dealType !== cond.dealType) return false;
        const partner = countryData(partnerOf(country, d));
        return partner ? cmp(cond.op, partner.assets.energy.rating, cond.value) : false;
      });
      return threshold(ok);
    }

    case "all": {
      const subs = cond.conditions.map((c) =>
        evaluateCondition(country, c, facts),
      );
      if (subs.every((s) => s === "completed")) return "completed";
      if (facts.final) return "failed";
      return subs.every((s) => s === "at_risk" || s === "failed")
        ? "at_risk"
        : "on_track";
    }

    case "no_deal_type_with_counterparty_of": {
      // Countries that have signed an otherDealType deal with otherCountry.
      const tainted = new Set(
        facts.deals
          .filter(
            (d) =>
              d.dealType === cond.otherDealType &&
              (d.initiatorCountry === cond.otherCountry ||
                d.targetCountry === cond.otherCountry),
          )
          .map((d) =>
            d.initiatorCountry === cond.otherCountry
              ? d.targetCountry
              : d.initiatorCountry,
          ),
      );
      const violated = myDeals(country, facts).some(
        (d) =>
          d.dealType === cond.dealType && tainted.has(partnerOf(country, d)),
      );
      return negative(violated);
    }

    case "no_deals_with_country": {
      const violated = myDeals(country, facts).some(
        (d) => partnerOf(country, d) === cond.country,
      );
      return negative(violated);
    }

    case "cross_bloc_deals": {
      const partners = new Set(
        myDeals(country, facts)
          .map((d) => partnerOf(country, d))
          .filter((p) => countryData(p)?.startingBloc !== myStartingBloc),
      );
      return threshold(partners.size >= cond.min);
    }

    case "deal_types_diversity": {
      const types = new Set(myDeals(country, facts).map((d) => d.dealType));
      return threshold(types.size >= cond.min);
    }

    case "cover_starting_blocs": {
      const covered = new Set(
        myDeals(country, facts).map(
          (d) => countryData(partnerOf(country, d))?.startingBloc,
        ),
      );
      return threshold(
        STARTING_BLOCS.every((b) => covered.has(b)),
      );
    }

    case "biggest_bloc": {
      const myBloc = facts.currentBlocs[country];
      return live(!!myBloc && biggestBlocNames(facts).includes(myBloc));
    }

    case "bloc_size": {
      const myBloc = facts.currentBlocs[country];
      const size = myBloc
        ? Object.values(facts.currentBlocs).filter((b) => b === myBloc).length
        : 0;
      return live(size >= cond.min);
    }

    case "deal_with_peeked_country": {
      const peek = facts.peeks.find((p) => p.country === country);
      if (!peek) return facts.final ? "failed" : "on_track";
      return threshold(
        myDeals(country, facts).some(
          (d) => partnerOf(country, d) === peek.peekedCountry,
        ),
      );
    }
  }
}

// ── Mission + score evaluation ─────────────────────────────────────────────

function overrideFor(
  country: string,
  slot: MissionSlot,
  facts: GameFacts,
): OverrideFact | undefined {
  return facts.overrides.find(
    (o) => o.country === country && o.missionSlot === slot,
  );
}

/** All 3 missions of a country with live status. Admin overrides supersede. */
export function evaluateMissions(
  country: string,
  facts: GameFacts,
): MissionResult[] {
  const data = countryData(country);
  if (!data) return [];
  return data.missions.map((m) => {
    const override = overrideFor(country, m.slot, facts);
    const status: MissionStatus =
      override?.status ?? evaluateCondition(country, m.condition, facts);
    return {
      slot: m.slot,
      text: m.text,
      status,
      points: status === "completed" ? MISSION_POINTS : 0,
      overridden: !!override,
    };
  });
}

/**
 * Full score breakdown. Deal points come from the points persisted on each
 * accepted deal (computed at signing time); falls back to re-computation
 * against current blocs for legacy rows missing them.
 */
export function computeScore(country: string, facts: GameFacts): ScoreBreakdown {
  const missions = evaluateMissions(country, facts);
  let dealPoints = 0;
  for (const d of myDeals(country, facts)) {
    if (d.initiatorCountry === country) {
      dealPoints +=
        d.initiatorPoints ??
        partyDealPoints(d.initiatorCountry, d.targetCountry, facts.currentBlocs);
    } else {
      dealPoints +=
        d.targetPoints ??
        partyDealPoints(d.targetCountry, d.initiatorCountry, facts.currentBlocs);
    }
  }
  const missionPoints = missions.reduce((sum, m) => sum + m.points, 0);
  const adjustments = facts.adjustments
    .filter((a) => a.country === country)
    .reduce((sum, a) => sum + a.delta, 0);
  return {
    country,
    dealPoints,
    missionPoints,
    adjustments,
    total: dealPoints + missionPoints + adjustments,
    missions,
  };
}
