/**
 * admin router: teacher controls. All procedures authenticate with the
 * room code + 4-digit admin PIN and log every state change.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, lt } from "drizzle-orm";
import {
  deals,
  missionOverrides,
  players,
  rooms,
  scoreAdjustments,
} from "@db/schema";
import { COUNTRY_BY_NAME, resolveActiveCountries } from "@contracts/game-data";
import { createRouter, publicQuery } from "../middleware";
import { activeCountriesOf, db, logActivity, requireAdmin } from "./helpers";

const adminAuth = { code: z.string().min(1), pin: z.string().min(1) };

export const adminRouter = createRouter({
  /** lobby -> playing, round 1, negotiation phase. */
  startGame: publicQuery
    .input(z.object(adminAuth))
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      if (room.status !== "lobby") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "The game has already started.",
        });
      }
      const d = await db();
      await d
        .update(rooms)
        .set({ status: "playing", currentRound: 1, roundPhase: "negotiation" })
        .where(eq(rooms.id, room.id));
      const updated = { ...room, status: "playing" as const, currentRound: 1 };
      await logActivity(
        d,
        updated,
        "game_started",
        "The UN Summit is open! Round 1 begins — declare your public missions.",
        { round: 1 },
      );
      return { ok: true, status: "playing" as const, currentRound: 1 };
    }),

  /**
   * One-button round flow:
   *  - negotiation  -> round_end   (bloc choice + last deal actions)
   *  - round_end    -> next round, negotiation
   */
  endRound: publicQuery
    .input(z.object(adminAuth))
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      if (room.status !== "playing") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            room.status === "lobby"
              ? "Start the game first."
              : "The game has ended.",
        });
      }
      const d = await db();
      if (room.roundPhase === "negotiation") {
        await d
          .update(rooms)
          .set({ roundPhase: "round_end" })
          .where(eq(rooms.id, room.id));
        await logActivity(
          d,
          room,
          "round_closed",
          `Round ${room.currentRound} is ending — choose your blocs!`,
          { round: room.currentRound },
        );
        return { ok: true, roundPhase: "round_end" as const, currentRound: room.currentRound };
      }
      const nextRound = room.currentRound + 1;
      await d
        .update(rooms)
        .set({ roundPhase: "negotiation", currentRound: nextRound })
        .where(eq(rooms.id, room.id));
      const updated = { ...room, currentRound: nextRound };
      await logActivity(
        d,
        updated,
        "round_started",
        `Round ${nextRound} begins. You have 3 new deal actions.`,
        { round: nextRound },
      );
      // Expire stale pending offers from earlier rounds.
      const staleFilter = and(
        eq(deals.roomId, room.id),
        eq(deals.status, "pending"),
        lt(deals.round, nextRound),
      );
      const stale = await d.select({ id: deals.id }).from(deals).where(staleFilter);
      if (stale.length > 0) {
        await d
          .update(deals)
          .set({ status: "cancelled", resolvedAt: new Date() })
          .where(staleFilter);
        await logActivity(
          d,
          updated,
          "offers_expired",
          `${stale.length} unsigned offer(s) expired.`,
          { count: stale.length, round: nextRound },
        );
      }
      return { ok: true, roundPhase: "negotiation" as const, currentRound: nextRound };
    }),

  /** playing -> ended. Final mission statuses are evaluated with final=true. */
  endGame: publicQuery
    .input(z.object(adminAuth))
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      if (room.status !== "playing") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "The game is not running.",
        });
      }
      const d = await db();
      await d
        .update(rooms)
        .set({ status: "ended" })
        .where(eq(rooms.id, room.id));
      await logActivity(
        d,
        room,
        "game_ended",
        "The Summit has ended. Final scores are revealed!",
        {},
      );
      return { ok: true, status: "ended" as const };
    }),

  /** Manually mark a mission completed/failed (latest override wins). */
  overrideMission: publicQuery
    .input(
      z.object({
        ...adminAuth,
        country: z.string().min(1),
        slot: z.enum(["public", "private", "bonus"]),
        status: z.enum(["completed", "failed"]),
        note: z.string().trim().max(255).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      if (!COUNTRY_BY_NAME[input.country]) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown country." });
      }
      const d = await db();
      await d.insert(missionOverrides).values({
        roomId: room.id,
        country: input.country,
        missionSlot: input.slot,
        status: input.status,
        note: input.note ?? null,
      });
      await logActivity(
        d,
        room,
        "override_mission",
        `Teacher marked ${input.country}'s ${input.slot} mission as ${input.status}${input.note ? ` (${input.note})` : ""}.`,
        {
          country: input.country,
          slot: input.slot,
          status: input.status,
          note: input.note ?? null,
        },
      );
      return { ok: true };
    }),

  /** Adjust a country's score by ±N with a reason. */
  adjustScore: publicQuery
    .input(
      z.object({
        ...adminAuth,
        country: z.string().min(1),
        delta: z.number().int().min(-100).max(100),
        reason: z.string().trim().min(1).max(255),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      if (!COUNTRY_BY_NAME[input.country]) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown country." });
      }
      const d = await db();
      await d.insert(scoreAdjustments).values({
        roomId: room.id,
        country: input.country,
        delta: input.delta,
        reason: input.reason,
      });
      const sign = input.delta >= 0 ? "+" : "";
      await logActivity(
        d,
        room,
        "adjust_score",
        `Teacher adjusted ${input.country}'s score by ${sign}${input.delta}: ${input.reason}.`,
        { country: input.country, delta: input.delta, reason: input.reason },
      );
      return { ok: true };
    }),

  /** Release a claimed seat (works in lobby and mid-game). */
  releaseSeat: publicQuery
    .input(z.object({ ...adminAuth, country: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      const d = await db();
      const holder = await d.query.players.findFirst({
        where: and(
          eq(players.roomId, room.id),
          eq(players.countryName, input.country),
        ),
      });
      if (!holder) return { ok: true, released: false };
      await d
        .update(players)
        .set({ countryName: null })
        .where(eq(players.id, holder.id));
      await logActivity(
        d,
        room,
        "seat_released",
        `Teacher released ${input.country} (was ${holder.name}).`,
        { country: input.country, player: holder.name },
      );
      return { ok: true, released: true };
    }),

  /**
   * Teacher picks the country roster (lobby phase only, for small classes).
   * USA/China are locked in; missing mission dependencies are auto-added.
   * Players holding newly-removed countries are unclaimed (logged).
   */
  setCountries: publicQuery
    .input(
      z.object({
        ...adminAuth,
        countries: z.array(z.string().trim().min(1)).min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      if (room.status !== "lobby") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "The country roster can only be changed in the lobby.",
        });
      }
      const roster = resolveActiveCountries(input.countries);
      if (!roster.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: roster.error });
      }
      const d = await db();

      // Unclaim players whose country just left the roster.
      const previous = activeCountriesOf(room);
      const next = new Set(roster.countries);
      const removed = previous.filter((c) => !next.has(c));
      const unclaimed: { country: string; player: string }[] = [];
      for (const country of removed) {
        const holder = await d.query.players.findFirst({
          where: and(
            eq(players.roomId, room.id),
            eq(players.countryName, country),
          ),
        });
        if (!holder) continue;
        await d
          .update(players)
          .set({ countryName: null })
          .where(eq(players.id, holder.id));
        unclaimed.push({ country, player: holder.name });
      }

      await d
        .update(rooms)
        .set({ activeCountries: roster.countries })
        .where(eq(rooms.id, room.id));

      await logActivity(
        d,
        room,
        "countries_updated",
        `Teacher set the country roster (${roster.countries.length} countries)` +
          `${roster.added.length ? `; auto-added ${roster.added.join(", ")} (mission dependencies)` : ""}` +
          `${unclaimed.length ? `; released ${unclaimed.map((u) => `${u.country} (was ${u.player})`).join(", ")}` : ""}.`,
        {
          countries: roster.countries,
          added: roster.added,
          removed,
          unclaimed,
        },
      );
      return {
        ok: true,
        activeCountries: roster.countries,
        addedCountries: roster.added,
        unclaimed,
      };
    }),
});
