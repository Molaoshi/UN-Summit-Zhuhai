/**
 * espionage router: the one-time private-mission peek.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { espionagePeeks, players } from "@db/schema";
import { COUNTRY_BY_NAME } from "@contracts/game-data";
import { createRouter, publicQuery } from "../middleware";
import {
  activeCountriesOf,
  db,
  logActivity,
  requireCountry,
  requirePlayer,
} from "./helpers";

export const espionageRouter = createRouter({
  /**
   * Espionage countries (Sweden, Japan, Germany, Brazil) may ONE-TIME reveal
   * one country's private mission. Locked in afterwards.
   */
  peek: publicQuery
    .input(
      z.object({ token: z.string().uuid(), country: z.string().min(1) }),
    )
    .mutation(async ({ input }) => {
      const { player, room } = await requirePlayer(input.token);
      const myCountry = requireCountry(player);
      const me = COUNTRY_BY_NAME[myCountry];
      if (!me?.hasEspionage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your country has no Espionage ability.",
        });
      }
      if (room.status === "ended") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "The game has ended.",
        });
      }
      const target = COUNTRY_BY_NAME[input.country];
      if (!target) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown country." });
      }
      if (!activeCountriesOf(room).includes(target.name)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${target.name} is not in this game's roster.`,
        });
      }
      if (target.name === myCountry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already know your own private mission!",
        });
      }
      const d = await db();
      // Only claimed countries have a delegate with secrets worth stealing.
      const targetPlayer = await d.query.players.findFirst({
        where: and(
          eq(players.roomId, room.id),
          eq(players.countryName, target.name),
        ),
      });
      if (!targetPlayer) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${target.name} has no delegate yet — there is no secret file to peek at.`,
        });
      }
      const existing = await d.query.espionagePeeks.findFirst({
        where: and(
          eq(espionagePeeks.roomId, room.id),
          eq(espionagePeeks.country, myCountry),
        ),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already used your one-time peek on ${existing.peekedCountry}.`,
        });
      }
      await d.insert(espionagePeeks).values({
        roomId: room.id,
        country: myCountry,
        peekedCountry: target.name,
      });
      const privateMission = target.missions.find(
        (m) => m.slot === "private",
      )!;
      await logActivity(
        d,
        room,
        "espionage_peek",
        `${myCountry} used Espionage to peek at ${target.name}'s secret file.`,
        { country: myCountry, target: target.name },
      );
      return {
        ok: true,
        peekedCountry: target.name,
        privateMission: privateMission.text,
        privateMissionZh: privateMission.textZh ?? privateMission.text,
      };
    }),
});
