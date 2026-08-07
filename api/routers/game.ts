/**
 * game router: polling-friendly state payloads (player / admin / endgame)
 * plus the round-end bloc choice.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "drizzle-orm";
import {
  activityLog,
  blocMemberships,
  deals,
  players,
  type Deal,
} from "@db/schema";
import {
  COUNTRY_BY_NAME,
  DEAL_TYPES,
  MAX_DEAL_ACTIONS_PER_ROUND,
  powerCardsOf,
  type CountryData,
} from "@contracts/game-data";
import {
  claimedScoreboard,
  computeScore,
  emptyScore,
  evaluateMissions,
  finalBlocSummaries,
  type GameFacts,
} from "../lib/scoring";
import { claimedCountries, claimedCountryData } from "../lib/seating";
import { createRouter, publicQuery } from "../middleware";
import {
  actionsUsed,
  activeCountriesOf,
  activeCountryData,
  buildFacts,
  currentBlocs,
  db,
  existingBlocNames,
  logActivity,
  requireAdmin,
  requireCountry,
  requirePlayer,
  requireViewer,
  type Db,
} from "./helpers";

const viewerInput = z.object({
  token: z.string().uuid().optional(),
  code: z.string().optional(),
  pin: z.string().optional(),
});

function presentDeal(d: Deal) {
  return {
    id: d.id,
    round: d.round,
    initiatorCountry: d.initiatorCountry,
    targetCountry: d.targetCountry,
    dealType: d.dealType,
    dealTypeLabel: DEAL_TYPES[d.dealType],
    powerCard: d.powerCard,
    note: d.note,
    status: d.status,
    initiatorPoints: d.initiatorPoints,
    targetPoints: d.targetPoints,
    createdAt: d.createdAt,
  };
}

async function roomDeals(d: Db, roomId: number): Promise<Deal[]> {
  return d
    .select()
    .from(deals)
    .where(eq(deals.roomId, roomId))
    .orderBy(asc(deals.id));
}

/** Feed entry: one signed deal, phrased like a news ticker. */
function feedEntry(d: Deal) {
  return {
    id: d.id,
    round: d.round,
    kind: "deal_accepted" as const,
    message: `${d.initiatorCountry} signed a ${DEAL_TYPES[d.dealType]} deal with ${d.targetCountry}.`,
    params: {
      a: d.initiatorCountry,
      b: d.targetCountry,
      dealType: d.dealType,
      power: d.powerCard,
      round: d.round,
    },
    initiatorCountry: d.initiatorCountry,
    targetCountry: d.targetCountry,
    dealTypeLabel: DEAL_TYPES[d.dealType],
    createdAt: d.createdAt,
  };
}

function espionagePayload(
  countryName: string,
  facts: GameFacts,
  /** CLAIMED countries only — spying on an empty chair is useless. */
  visible: CountryData[],
) {
  const me = COUNTRY_BY_NAME[countryName];
  if (!me?.hasEspionage) return null;
  const peek = facts.peeks.find((p) => p.country === countryName) ?? null;
  const peekedPrivate = peek
    ? (COUNTRY_BY_NAME[peek.peekedCountry]?.missions.find(
        (m) => m.slot === "private",
      ) ?? null)
    : null;
  return {
    allPowerCards: visible.map((c) => ({
      country: c.name,
      flag: c.flag,
      assets: c.assets,
      powerCards: powerCardsOf(c),
    })),
    peek: {
      used: !!peek,
      peekedCountry: peek?.peekedCountry ?? null,
      peekedPrivateMission: peekedPrivate?.text ?? null,
      peekedPrivateMissionZh: peekedPrivate?.textZh ?? null,
    },
  };
}

export const gameRouter = createRouter({
  /** Everything the player dashboard needs, in one polling-friendly payload. */
  playerState: publicQuery
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ input }) => {
      const { player, room } = await requirePlayer(input.token);
      const d = await db();
      const facts = await buildFacts(d, room);
      const allDeals = await roomDeals(d, room.id);
      const roomPlayers = await d
        .select()
        .from(players)
        .where(eq(players.roomId, room.id));
      const claimed = claimedCountries(roomPlayers);
      const blocs = facts.currentBlocs;

      const myCountryName = player.countryName;
      const myData = myCountryName ? COUNTRY_BY_NAME[myCountryName] : null;

      const sent = allDeals.filter(
        (x) =>
          x.status === "pending" &&
          x.round === room.currentRound &&
          x.initiatorCountry === myCountryName,
      );
      const incoming = allDeals.filter(
        (x) =>
          x.status === "pending" &&
          x.round === room.currentRound &&
          x.targetCountry === myCountryName,
      );
      const signed = allDeals.filter(
        (x) =>
          x.status === "accepted" &&
          (x.initiatorCountry === myCountryName ||
            x.targetCountry === myCountryName),
      );

      const used = myCountryName
        ? await actionsUsed(d, room.id, room.currentRound, myCountryName)
        : 0;

      const accepted = allDeals.filter((x) => x.status === "accepted");
      const active = activeCountryData(room);
      // Only claimed countries have a delegate — their public missions are
      // the only ones visible/evaluated at the table.
      const claimedActive = claimedCountryData(active, claimed);

      return {
        room: {
          code: room.code,
          status: room.status,
          currentRound: room.currentRound,
          roundPhase: room.roundPhase,
        },
        activeCountries: activeCountriesOf(room),
        me: {
          name: player.name,
          isAdmin: player.isAdmin,
          countryName: myCountryName,
        },
        myCountry: myData,
        myMissions: myCountryName ? evaluateMissions(myCountryName, facts) : [],
        myDeals: {
          sent: sent.map(presentDeal),
          incoming: incoming.map(presentDeal),
          signed: signed.map((x) => ({
            ...presentDeal(x),
            partner:
              x.initiatorCountry === myCountryName
                ? x.targetCountry
                : x.initiatorCountry,
            myPoints:
              x.initiatorCountry === myCountryName
                ? x.initiatorPoints
                : x.targetPoints,
          })),
        },
        actions: {
          used,
          remaining: Math.max(0, MAX_DEAL_ACTIONS_PER_ROUND - used),
          max: MAX_DEAL_ACTIONS_PER_ROUND,
        },
        feed: accepted.map(feedEntry),
        publicMissions: claimedActive.map((c) => ({
          country: c.name,
          countryZh: c.nameZh ?? c.name,
          flag: c.flag,
          text: c.missions.find((m) => m.slot === "public")!.text,
          textZh:
            c.missions.find((m) => m.slot === "public")!.textZh ??
            c.missions.find((m) => m.slot === "public")!.text,
          status:
            evaluateMissions(c.name, facts).find((m) => m.slot === "public")
              ?.status ?? "on_track",
        })),
        // Current bloc of every active country — names only, no scores.
        blocs,
        espionage: myCountryName
          ? espionagePayload(myCountryName, facts, claimedActive)
          : null,
      };
    }),

  /** God view for the teacher dashboard. */
  adminState: publicQuery
    .input(z.object({ code: z.string().min(1), pin: z.string().min(1) }))
    .query(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      const d = await db();
      const facts = await buildFacts(d, room);
      const allDeals = await roomDeals(d, room.id);
      const roomPlayers = await d
        .select()
        .from(players)
        .where(eq(players.roomId, room.id))
        .orderBy(asc(players.id));

      const active = activeCountryData(room);
      // Unclaimed active countries keep their seat/bloc but have no delegate:
      // no missions, no score rows.
      const countries = await Promise.all(
        active.map(async (c) => {
          const holder = roomPlayers.find(
            (p) => !p.isAdmin && p.countryName === c.name,
          );
          const claimed = !!holder;
          return {
            country: c.name,
            countryZh: c.nameZh ?? c.name,
            flag: c.flag,
            bloc: facts.currentBlocs[c.name],
            claimed,
            playerName: holder?.name ?? null,
            playerId: holder?.id ?? null,
            missions: claimed ? evaluateMissions(c.name, facts) : [],
            score: claimed ? computeScore(c.name, facts) : emptyScore(c.name),
            actionsUsedThisRound:
              claimed && room.status === "playing"
                ? await actionsUsed(d, room.id, room.currentRound, c.name)
                : 0,
          };
        }),
      );

      const blocHistory = await d
        .select()
        .from(blocMemberships)
        .where(eq(blocMemberships.roomId, room.id))
        .orderBy(asc(blocMemberships.id));

      const log = await d
        .select()
        .from(activityLog)
        .where(eq(activityLog.roomId, room.id))
        .orderBy(desc(activityLog.id))
        .limit(200);

      return {
        room: {
          code: room.code,
          status: room.status,
          currentRound: room.currentRound,
          roundPhase: room.roundPhase,
        },
        activeCountries: activeCountriesOf(room),
        players: roomPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          isAdmin: p.isAdmin,
          countryName: p.countryName,
        })),
        countries,
        pendingDeals: allDeals
          .filter((x) => x.status === "pending")
          .map(presentDeal),
        allDeals: allDeals.map(presentDeal),
        blocHistory,
        activityLog: log.reverse(), // chronological
      };
    }),

  /**
   * Bloc choice, allowed only during the round_end phase. Players may join
   * one of the existing blocs or found a new one with a custom name.
   */
  chooseBloc: publicQuery
    .input(
      z.object({
        token: z.string().uuid(),
        blocName: z.string().trim().min(2).max(24),
      }),
    )
    .mutation(async ({ input }) => {
      const { player, room } = await requirePlayer(input.token);
      const myCountry = requireCountry(player);
      if (room.status !== "playing" || room.roundPhase !== "round_end") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bloc choice opens at the end of each round.",
        });
      }
      const d = await db();
      // Case-insensitive match against existing blocs keeps names canonical.
      const existing = await existingBlocNames(d, room);
      const match = existing.find(
        (b) => b.toLowerCase() === input.blocName.toLowerCase(),
      );
      const blocName = match ?? input.blocName;

      const blocs = await currentBlocs(d, room);
      if (blocs[myCountry] === blocName) {
        return { ok: true, blocName, changed: false };
      }
      await d.insert(blocMemberships).values({
        roomId: room.id,
        round: room.currentRound,
        country: myCountry,
        blocName,
      });
      await logActivity(
        d,
        room,
        "bloc_chosen",
        match
          ? `${myCountry} joined the ${blocName} bloc.`
          : `${myCountry} founded a new bloc: ${blocName}.`,
        {
          country: myCountry,
          bloc: blocName,
          founded: !match,
          round: room.currentRound,
        },
      );
      return { ok: true, blocName, changed: true };
    }),

  /**
   * End-game reveal: final blocs (biggest highlighted, ties included),
   * ranked scoreboard with per-country breakdown, and the full deal list.
   * Available to everyone once the game has ended.
   */
  finalResults: publicQuery.input(viewerInput).query(async ({ input }) => {
    const { room } = await requireViewer(input);
    if (room.status !== "ended") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "The game is not over yet — scores are still secret!",
      });
    }
    const d = await db();
    const facts = await buildFacts(d, room, { final: true });
    const allDeals = await roomDeals(d, room.id);
    const roomPlayers = await d
      .select()
      .from(players)
      .where(eq(players.roomId, room.id));
    const claimed = claimedCountries(roomPlayers);
    // Active roster only (unclaimed seats still sit in their blocs, but have
    // no delegate and earn no score).
    const active = activeCountryData(room);

    // Final blocs list ALL active members; unclaimed ones are flagged so the
    // frontend can dim them.
    const blocs = finalBlocSummaries(active, facts, claimed);

    // Ranked scoreboard over CLAIMED countries only.
    const scoreboard = claimedScoreboard(active, facts, claimed);

    return {
      roomCode: room.code,
      rounds: room.currentRound,
      activeCountries: activeCountriesOf(room),
      blocs,
      winner: scoreboard[0] ?? null,
      scoreboard,
      deals: allDeals.map(presentDeal),
    };
  }),
});
