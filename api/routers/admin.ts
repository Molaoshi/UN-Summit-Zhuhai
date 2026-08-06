/**
 * admin router: teacher controls. All procedures authenticate with the
 * room code + 4-digit admin PIN and log every state change.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  missionOverrides,
  players,
  rooms,
  scoreAdjustments,
} from "@db/schema";
import { COUNTRY_BY_NAME } from "@contracts/game-data";
import { createRouter, publicQuery } from "../middleware";
import { db, logActivity, requireAdmin } from "./helpers";

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
        "game",
        "The UN Summit is open! Round 1 begins — declare your public missions.",
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
          "game",
          `Round ${room.currentRound} is ending — choose your blocs!`,
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
        "game",
        `Round ${nextRound} begins. You have 3 new deal actions.`,
      );
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
        "game",
        "The Summit has ended. Final scores are revealed!",
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
        "admin",
        `Teacher marked ${input.country}'s ${input.slot} mission as ${input.status}${input.note ? ` (${input.note})` : ""}.`,
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
        "admin",
        `Teacher adjusted ${input.country}'s score by ${sign}${input.delta}: ${input.reason}.`,
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
        "admin",
        `Teacher released ${input.country} (was ${holder.name}).`,
      );
      return { ok: true, released: true };
    }),
});
