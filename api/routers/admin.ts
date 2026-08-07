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
import { planAssignSeat, planSetAssistant } from "../lib/seating";
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

  /**
   * Teacher promotes/demotes a joined player as an "Admin Assistant": a
   * read-only spectator of the admin dashboard (max 4 per room). Promoting
   * releases the player's country seat; demoting returns them to unseated.
   * The room's admin player cannot be an assistant.
   */
  setAssistant: publicQuery
    .input(
      z.object({
        ...adminAuth,
        playerId: z.number().int().positive(),
        assistant: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      const d = await db();
      const roomPlayers = await d
        .select()
        .from(players)
        .where(eq(players.roomId, room.id));
      const plan = planSetAssistant(roomPlayers, input.playerId, input.assistant);
      if (!plan.ok) {
        throw new TRPCError({
          code:
            plan.reason === "player_not_found"
              ? "NOT_FOUND"
              : plan.reason === "player_is_admin"
                ? "FORBIDDEN"
                : "CONFLICT",
          message:
            plan.reason === "player_not_found"
              ? "No player with that id in this room."
              : plan.reason === "player_is_admin"
                ? "The teacher runs the room and cannot be an assistant."
                : "This room already has the maximum of 4 admin assistants.",
        });
      }
      if (!plan.noop) {
        await d
          .update(players)
          .set(
            input.assistant
              ? { isAssistant: true, countryName: null }
              : { isAssistant: false, countryName: null },
          )
          .where(eq(players.id, plan.player.id));
      }
      await logActivity(
        d,
        room,
        "assistant_set",
        input.assistant
          ? `${plan.player.name} is now an admin assistant (read-only dashboard view)` +
              `${plan.releasedCountry ? `; released ${plan.releasedCountry}` : ""}.`
          : `${plan.player.name} is no longer an admin assistant.`,
        { player: plan.player.name, assistant: input.assistant },
      );
      return {
        ok: true,
        changed: !plan.noop,
        playerId: plan.player.id,
        playerName: plan.player.name,
        assistant: input.assistant,
        releasedCountry: plan.releasedCountry,
      };
    }),

  /**
   * Teacher assigns a logged-in player to a country seat. Works in the lobby
   * AND mid-game (late joiners). If the country is held by another player
   * they are released; if the player already holds another seat they move.
   */
  assignSeat: publicQuery
    .input(
      z.object({
        ...adminAuth,
        playerId: z.number().int().positive(),
        country: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await requireAdmin(input.code, input.pin);
      if (room.status === "ended") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "The game has ended — seats are locked.",
        });
      }
      const country = COUNTRY_BY_NAME[input.country];
      if (!country) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown country." });
      }
      const d = await db();
      const roomPlayers = await d
        .select()
        .from(players)
        .where(eq(players.roomId, room.id));
      const plan = planAssignSeat(
        roomPlayers,
        input.playerId,
        country.name,
        activeCountriesOf(room),
      );
      if (!plan.ok) {
        throw new TRPCError({
          code:
            plan.reason === "player_not_found"
              ? "NOT_FOUND"
              : plan.reason === "player_is_admin"
                ? "FORBIDDEN"
                : "BAD_REQUEST",
          message:
            plan.reason === "player_not_found"
              ? "No player with that id in this room."
              : plan.reason === "player_is_admin"
                ? "The teacher runs the room and does not take a seat."
                : `${country.name} is not in this game's roster.`,
        });
      }
      if (!plan.noop) {
        // Evict the current holder first (unique room+country index).
        if (plan.evictedPlayer) {
          await d
            .update(players)
            .set({ countryName: null })
            .where(eq(players.id, plan.evictedPlayer.id));
        }
        // Seating an assistant converts them back to a regular player.
        await d
          .update(players)
          .set({ countryName: country.name, isAssistant: false })
          .where(eq(players.id, plan.player.id));
      } else if (plan.clearsAssistant) {
        await d
          .update(players)
          .set({ isAssistant: false })
          .where(eq(players.id, plan.player.id));
      }
      const evicted = plan.evictedPlayer;
      const moved = plan.previousCountry && plan.previousCountry !== country.name;
      await logActivity(
        d,
        room,
        "seat_assigned",
        `Teacher seated ${plan.player.name} as ${country.flag} ${country.name}` +
          `${moved ? ` (moved from ${plan.previousCountry})` : ""}` +
          `${evicted ? `; ${evicted.name} was released` : ""}.`,
        {
          player: plan.player.name,
          country: country.name,
          by: "admin",
          previousCountry: plan.previousCountry,
          evictedPlayer: evicted?.name ?? null,
        },
      );
      return {
        ok: true,
        changed: !plan.noop,
        playerId: plan.player.id,
        playerName: plan.player.name,
        country: country.name,
        previousCountry: plan.previousCountry,
        evictedPlayer: evicted ? { id: evicted.id, name: evicted.name } : null,
      };
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
