/**
 * Shared helpers for the game routers: auth (player token / admin code+pin),
 * fact assembly for the scoring engine, deal-action budget, activity log.
 */
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import {
  activityLog,
  blocMemberships,
  dealActions,
  deals,
  espionagePeeks,
  missionOverrides,
  players,
  rooms,
  scoreAdjustments,
  type Player,
  type Room,
} from "@db/schema";
import {
  COUNTRIES,
  MAX_DEAL_ACTIONS_PER_ROUND,
  type MissionSlot,
} from "@contracts/game-data";
import type {
  AdjustmentFact,
  DealFact,
  GameFacts,
  OverrideFact,
  PeekFact,
} from "../lib/scoring";
import { getDb } from "../queries/connection";
import { ensureSchema } from "../lib/ensure-schema";

export type Db = ReturnType<typeof getDb>;

/** Lazily ensure the schema exists, then hand out the drizzle instance. */
export async function db(): Promise<Db> {
  await ensureSchema();
  return getDb();
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function requirePlayer(
  token: string,
): Promise<{ player: Player; room: Room }> {
  const d = await db();
  const player = await d.query.players.findFirst({
    where: eq(players.token, token),
  });
  if (!player) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid session token. Please join the room again.",
    });
  }
  const room = await d.query.rooms.findFirst({
    where: eq(rooms.id, player.roomId),
  });
  if (!room) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Room not found." });
  }
  return { player, room };
}

export async function requireAdmin(code: string, pin: string): Promise<Room> {
  const d = await db();
  const room = await d.query.rooms.findFirst({
    where: eq(rooms.code, code.trim().toUpperCase()),
  });
  if (!room || room.adminPin !== pin.trim()) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Wrong room code or admin PIN.",
    });
  }
  return room;
}

/** Auth for read endpoints that accept either a player token or admin code+pin. */
export async function requireViewer(input: {
  token?: string;
  code?: string;
  pin?: string;
}): Promise<{ room: Room; player: Player | null }> {
  if (input.token) {
    const { player, room } = await requirePlayer(input.token);
    return { room, player };
  }
  if (input.code && input.pin) {
    const room = await requireAdmin(input.code, input.pin);
    return { room, player: null };
  }
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: "Provide a player token or the room code + admin PIN.",
  });
}

/** The player must have claimed a country seat. */
export function requireCountry(player: Player): string {
  if (!player.countryName) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Claim a country first.",
    });
  }
  return player.countryName;
}

// ── Activity log ───────────────────────────────────────────────────────────

export async function logActivity(
  d: Db,
  room: Room,
  kind: string,
  message: string,
): Promise<void> {
  await d.insert(activityLog).values({
    roomId: room.id,
    round: room.currentRound,
    kind,
    message,
  });
}

// ── Deal action budget (3 per country per round) ───────────────────────────

export async function actionsUsed(
  d: Db,
  roomId: number,
  round: number,
  country: string,
): Promise<number> {
  const rows = await d
    .select({ id: dealActions.id })
    .from(dealActions)
    .where(
      and(
        eq(dealActions.roomId, roomId),
        eq(dealActions.round, round),
        eq(dealActions.country, country),
      ),
    );
  return rows.length;
}

/** Throws a 409-style CONFLICT error when the country has no actions left.
 *  Returns the number of actions used so far this round. */
export async function assertActionBudget(
  d: Db,
  room: Room,
  country: string,
): Promise<number> {
  const used = await actionsUsed(d, room.id, room.currentRound, country);
  if (used >= MAX_DEAL_ACTIONS_PER_ROUND) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `No deal actions left this round (${MAX_DEAL_ACTIONS_PER_ROUND}/${MAX_DEAL_ACTIONS_PER_ROUND} used). Wait for the next round.`,
    });
  }
  return used;
}

// ── Blocs ──────────────────────────────────────────────────────────────────

/** Current bloc per country = each country's latest membership row. */
export async function currentBlocs(
  d: Db,
  roomId: number,
): Promise<Record<string, string>> {
  const rows = await d
    .select()
    .from(blocMemberships)
    .where(eq(blocMemberships.roomId, roomId))
    .orderBy(asc(blocMemberships.id));
  const map: Record<string, string> = {};
  for (const row of rows) map[row.country] = row.blocName; // latest wins
  // Fallback for countries with no row yet: their starting bloc.
  for (const c of COUNTRIES) {
    if (!map[c.name]) map[c.name] = c.startingBloc;
  }
  return map;
}

/** All distinct bloc names in this room (starting blocs + custom). */
export async function existingBlocNames(
  d: Db,
  roomId: number,
): Promise<string[]> {
  const rows = await d
    .select({ blocName: blocMemberships.blocName })
    .from(blocMemberships)
    .where(eq(blocMemberships.roomId, roomId));
  const names = new Set(rows.map((r) => r.blocName));
  for (const c of COUNTRIES) names.add(c.startingBloc);
  return [...names];
}

// ── Fact assembly for the scoring engine ───────────────────────────────────

export async function buildFacts(
  d: Db,
  room: Room,
  opts?: { final?: boolean },
): Promise<GameFacts> {
  const accepted = await d
    .select()
    .from(deals)
    .where(and(eq(deals.roomId, room.id), eq(deals.status, "accepted")))
    .orderBy(asc(deals.id));

  const dealFacts: DealFact[] = accepted.map((row) => ({
    id: row.id,
    round: row.round,
    initiatorCountry: row.initiatorCountry,
    targetCountry: row.targetCountry,
    dealType: row.dealType,
    powerCard: row.powerCard,
    initiatorPoints: row.initiatorPoints,
    targetPoints: row.targetPoints,
  }));

  const blocs = await currentBlocs(d, room.id);

  const peekRows = await d
    .select()
    .from(espionagePeeks)
    .where(eq(espionagePeeks.roomId, room.id));
  const peekFacts: PeekFact[] = peekRows.map((p) => ({
    country: p.country,
    peekedCountry: p.peekedCountry,
  }));

  const overrideRows = await d
    .select()
    .from(missionOverrides)
    .where(eq(missionOverrides.roomId, room.id))
    .orderBy(asc(missionOverrides.id));
  // Latest row per (country, slot) wins.
  const latest = new Map<string, OverrideFact>();
  for (const o of overrideRows) {
    latest.set(`${o.country}:${o.missionSlot}`, {
      country: o.country,
      missionSlot: o.missionSlot as MissionSlot,
      status: o.status,
    });
  }

  const adjustmentRows = await d
    .select()
    .from(scoreAdjustments)
    .where(eq(scoreAdjustments.roomId, room.id));
  const adjustmentFacts: AdjustmentFact[] = adjustmentRows.map((a) => ({
    country: a.country,
    delta: a.delta,
  }));

  return {
    deals: dealFacts,
    currentBlocs: blocs,
    peeks: peekFacts,
    overrides: [...latest.values()],
    adjustments: adjustmentFacts,
    final: opts?.final ?? room.status === "ended",
  };
}
