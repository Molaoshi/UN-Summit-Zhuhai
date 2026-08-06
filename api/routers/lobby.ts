/**
 * lobby router: seat map + claim/release of country seats.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { players } from "@db/schema";
import { COUNTRIES, COUNTRY_BY_NAME } from "@contracts/game-data";
import { createRouter, publicQuery } from "../middleware";
import {
  db,
  logActivity,
  requireAdmin,
  requirePlayer,
  requireViewer,
} from "./helpers";

const viewerInput = z.object({
  token: z.string().uuid().optional(),
  code: z.string().optional(),
  pin: z.string().optional(),
});

export const lobbyRouter = createRouter({
  /** Seat map: all 15 countries with claimed player names. */
  state: publicQuery.input(viewerInput).query(async ({ input }) => {
    const { room } = await requireViewer(input);
    const d = await db();
    const roomPlayers = await d
      .select()
      .from(players)
      .where(eq(players.roomId, room.id));

    const seats = COUNTRIES.map((c) => {
      const holder = roomPlayers.find((p) => p.countryName === c.name);
      return {
        country: c.name,
        flag: c.flag,
        startingBloc: c.startingBloc,
        claimedBy: holder?.name ?? null,
      };
    });

    return {
      status: room.status,
      currentRound: room.currentRound,
      roundPhase: room.roundPhase,
      seats,
      unseated: roomPlayers
        .filter((p) => !p.countryName && !p.isAdmin)
        .map((p) => p.name),
    };
  }),

  /** First-come claim of a country seat (lobby phase only). */
  claim: publicQuery
    .input(z.object({ token: z.string().uuid(), country: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { player, room } = await requirePlayer(input.token);
      if (room.status !== "lobby") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Seats can only be claimed in the lobby.",
        });
      }
      if (player.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The teacher runs the room and does not claim a country.",
        });
      }
      const country = COUNTRY_BY_NAME[input.country];
      if (!country) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown country.",
        });
      }
      if (player.countryName === country.name) {
        return { ok: true, country: country.name };
      }
      const d = await db();
      const holder = await d.query.players.findFirst({
        where: and(
          eq(players.roomId, room.id),
          eq(players.countryName, country.name),
        ),
      });
      if (holder) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${country.name} is already taken by ${holder.name}. Pick another country.`,
        });
      }
      // Release any seat this player already holds, then claim the new one.
      await d
        .update(players)
        .set({ countryName: country.name })
        .where(eq(players.id, player.id));
      await logActivity(
        d,
        room,
        "lobby",
        `${player.name} claimed ${country.flag} ${country.name}.`,
      );
      return { ok: true, country: country.name };
    }),

  /** Admin releases a claimed seat. */
  release: publicQuery
    .input(
      z.object({
        code: z.string().min(1),
        pin: z.string().min(1),
        country: z.string().min(1),
      }),
    )
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
        "lobby",
        `Teacher released ${input.country} (was ${holder.name}).`,
      );
      return { ok: true, released: true };
    }),
});
