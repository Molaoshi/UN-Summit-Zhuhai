/**
 * room router: create / join / resume.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { blocMemberships, players, rooms } from "@db/schema";
import { resolveActiveCountries } from "@contracts/game-data";
import { createRouter, publicQuery } from "../middleware";
import { activeCountryData, db, logActivity, requirePlayer } from "./helpers";

// Unambiguous room-code alphabet: no 0/O, no 1/I.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4 digits
}

export const roomRouter = createRouter({
  /** Teacher creates a room. Returns the admin session. */
  create: publicQuery
    .input(
      z.object({
        teacherName: z.string().trim().min(1).max(64),
        /** Optional teacher-selected roster for small classes (default: all 15). */
        activeCountries: z.array(z.string().trim().min(1)).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const d = await db();

      const roster = resolveActiveCountries(input.activeCountries);
      if (!roster.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: roster.error });
      }

      // Generate a unique 6-char code (retry on the rare collision).
      let code = randomCode();
      for (let tries = 0; tries < 10; tries++) {
        const clash = await d.query.rooms.findFirst({
          where: eq(rooms.code, code),
        });
        if (!clash) break;
        code = randomCode();
      }
      const adminPin = randomPin();

      const [{ id: roomId }] = await d
        .insert(rooms)
        .values({
          code,
          adminPin,
          status: "lobby",
          currentRound: 0,
          activeCountries: roster.countries,
        })
        .$returningId();

      const token = randomUUID();
      await d.insert(players).values({
        roomId,
        token,
        name: input.teacherName,
        isAdmin: true,
      });

      // Seed round-0 bloc memberships with the starting blocs of the
      // ACTIVE countries only.
      const room = (await d.query.rooms.findFirst({
        where: eq(rooms.id, roomId),
      }))!;
      await d.insert(blocMemberships).values(
        activeCountryData(room).map((c) => ({
          roomId,
          round: 0,
          country: c.name,
          blocName: c.startingBloc,
        })),
      );

      await logActivity(
        d,
        room,
        "room_created",
        `Room created by ${input.teacherName}. Welcome to the UN Summit!`,
        { teacher: input.teacherName, countries: roster.countries },
      );

      return {
        token,
        roomCode: code,
        adminPin,
        activeCountries: roster.countries,
        addedCountries: roster.added,
      };
    }),

  /** Student joins a room with code + display name (seat claimed later). */
  join: publicQuery
    .input(
      z.object({
        code: z.string().trim().min(4).max(8),
        name: z.string().trim().min(1).max(64),
      }),
    )
    .mutation(async ({ input }) => {
      const d = await db();
      const code = input.code.toUpperCase();
      const room = await d.query.rooms.findFirst({
        where: eq(rooms.code, code),
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No room with that code. Check the code and try again.",
        });
      }
      if (room.status !== "lobby") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            room.status === "ended"
              ? "This game has already ended."
              : "This game already started — ask your teacher.",
        });
      }
      const nameTaken = await d.query.players.findFirst({
        where: and(eq(players.roomId, room.id), eq(players.name, input.name)),
      });
      if (nameTaken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That name is already taken in this room. Add your initial?",
        });
      }
      const token = randomUUID();
      await d.insert(players).values({
        roomId: room.id,
        token,
        name: input.name,
        isAdmin: false,
      });
      await logActivity(d, room, "player_joined", `${input.name} joined the room.`, {
        player: input.name,
      });
      // Seat is claimed later in the lobby, so country/flag are undefined here
      // (the scaffolded landing page expects these keys on the response).
      return {
        token,
        roomCode: room.code,
        country: undefined as string | undefined,
        flag: undefined as string | undefined,
      };
    }),

  /** Restore a session from a stored token (page refresh). */
  resume: publicQuery
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ input }) => {
      const { player, room } = await requirePlayer(input.token);
      return {
        roomCode: room.code,
        status: room.status,
        currentRound: room.currentRound,
        roundPhase: room.roundPhase,
        player: {
          name: player.name,
          isAdmin: player.isAdmin,
          countryName: player.countryName,
        },
      };
    }),
});
