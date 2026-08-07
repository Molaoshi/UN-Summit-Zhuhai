/**
 * deals router: send / accept / cancel. Each consumes 1 of the 3 deal
 * actions a country has per round (hard cap, CONFLICT error when exhausted).
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { dealActions, deals, players, type Deal } from "@db/schema";
import {
  COUNTRY_BY_NAME,
  DEAL_TYPES,
  MAX_DEAL_ACTIONS_PER_ROUND,
  dealTypeForPower,
} from "@contracts/game-data";
import { computeDealPoints } from "../lib/scoring";
import { createRouter, publicQuery } from "../middleware";
import {
  assertActionBudget,
  activeCountriesOf,
  currentBlocs,
  db,
  logActivity,
  requireCountry,
  requirePlayer,
} from "./helpers";

function assertDealPhase(room: { status: string; roundPhase: string }): void {
  if (room.status !== "playing") {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        room.status === "lobby"
          ? "The game has not started yet."
          : "The game has ended.",
    });
  }
  if (room.roundPhase !== "negotiation") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Deal actions are closed — round end phase.",
    });
  }
}

async function loadPendingDeal(
  d: Awaited<ReturnType<typeof db>>,
  roomId: number,
  dealId: number,
): Promise<Deal> {
  const deal = await d.query.deals.findFirst({
    where: and(eq(deals.id, dealId), eq(deals.roomId, roomId)),
  });
  if (!deal) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found." });
  }
  if (deal.status !== "pending") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This offer is no longer pending.",
    });
  }
  return deal;
}

async function recordAction(
  d: Awaited<ReturnType<typeof db>>,
  roomId: number,
  round: number,
  country: string,
  action: "send" | "accept" | "cancel",
  dealId: number,
): Promise<void> {
  await d.insert(dealActions).values({ roomId, round, country, action, dealId });
}

export const dealsRouter = createRouter({
  /** Offer one of YOUR power cards to another country. */
  send: publicQuery
    .input(
      z.object({
        token: z.string().uuid(),
        targetCountry: z.string().min(1),
        powerCard: z.string().min(1),
        note: z.string().trim().max(255).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { player, room } = await requirePlayer(input.token);
      assertDealPhase(room);
      const myCountry = requireCountry(player);

      const me = COUNTRY_BY_NAME[myCountry];
      const target = COUNTRY_BY_NAME[input.targetCountry];
      if (!target) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown target country.",
        });
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
          message: "You cannot make a deal with yourself.",
        });
      }
      const dealType = me ? dealTypeForPower(me, input.powerCard) : null;
      if (!dealType) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.powerCard} is not one of your power cards.`,
        });
      }
      const d = await db();
      // Target seat must be claimed by a living player.
      const targetPlayer = await d.query.players.findFirst({
        where: and(
          eq(players.roomId, room.id),
          eq(players.countryName, target.name),
        ),
      });
      if (!targetPlayer) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${target.name} has no player yet — no one can accept your offer.`,
        });
      }

      const usedBefore = await assertActionBudget(d, room, myCountry);
      const [{ id: dealId }] = await d
        .insert(deals)
        .values({
          roomId: room.id,
          round: room.currentRound,
          initiatorCountry: myCountry,
          targetCountry: target.name,
          dealType,
          powerCard: input.powerCard,
          note: input.note ?? null,
          status: "pending",
        })
        .$returningId();
      await recordAction(
        d,
        room.id,
        room.currentRound,
        myCountry,
        "send",
        dealId,
      );
      await logActivity(
        d,
        room,
        "deal_sent",
        `${myCountry} offers a ${DEAL_TYPES[dealType]} deal (${input.powerCard}) to ${target.name}.`,
        {
          a: myCountry,
          b: target.name,
          dealType,
          power: input.powerCard,
          round: room.currentRound,
        },
      );
      return {
        ok: true,
        dealId,
        actionsRemaining: MAX_DEAL_ACTIONS_PER_ROUND - (usedBefore + 1),
      };
    }),

  /** Target country accepts (signs) a pending offer. Points computed now. */
  accept: publicQuery
    .input(z.object({ token: z.string().uuid(), dealId: z.number().int() }))
    .mutation(async ({ input }) => {
      const { player, room } = await requirePlayer(input.token);
      assertDealPhase(room);
      const myCountry = requireCountry(player);
      const d = await db();
      const deal = await loadPendingDeal(d, room.id, input.dealId);

      if (deal.targetCountry !== myCountry) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the target country can accept this offer.",
        });
      }
      if (deal.round !== room.currentRound) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This offer is from a previous round and has expired.",
        });
      }
      await assertActionBudget(d, room, myCountry);

      // Points: bloc alignment AT SIGNING TIME (current blocs), with the
      // freeCrossBloc exemption handled inside the scoring engine.
      const blocs = await currentBlocs(d, room);
      const points = computeDealPoints(
        deal.initiatorCountry,
        deal.targetCountry,
        blocs,
      );
      await d
        .update(deals)
        .set({
          status: "accepted",
          initiatorPoints: points.initiatorPoints,
          targetPoints: points.targetPoints,
          resolvedAt: new Date(),
        })
        .where(eq(deals.id, deal.id));
      await recordAction(
        d,
        room.id,
        room.currentRound,
        myCountry,
        "accept",
        deal.id,
      );
      await logActivity(
        d,
        room,
        "deal_accepted",
        `${deal.initiatorCountry} signed a ${DEAL_TYPES[deal.dealType]} deal with ${deal.targetCountry}.`,
        {
          a: deal.initiatorCountry,
          b: deal.targetCountry,
          dealType: deal.dealType,
          power: deal.powerCard,
          round: deal.round,
        },
      );
      return { ok: true, points };
    }),

  /**
   * Initiator cancels their own pending offer, or the target rejects it.
   * Either way the actor spends 1 deal action.
   */
  cancel: publicQuery
    .input(z.object({ token: z.string().uuid(), dealId: z.number().int() }))
    .mutation(async ({ input }) => {
      const { player, room } = await requirePlayer(input.token);
      assertDealPhase(room);
      const myCountry = requireCountry(player);
      const d = await db();
      const deal = await loadPendingDeal(d, room.id, input.dealId);

      const isInitiator = deal.initiatorCountry === myCountry;
      const isTarget = deal.targetCountry === myCountry;
      if (!isInitiator && !isTarget) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the two countries in this deal can cancel it.",
        });
      }
      // Cleaning up an offer from a previous round is free (it expired when
      // the round advanced); only current-round cancels consume an action.
      const expired = deal.round !== room.currentRound;
      if (!expired) await assertActionBudget(d, room, myCountry);

      await d
        .update(deals)
        .set({ status: "cancelled", resolvedAt: new Date() })
        .where(eq(deals.id, deal.id));
      if (!expired) {
        await recordAction(
          d,
          room.id,
          room.currentRound,
          myCountry,
          "cancel",
          deal.id,
        );
      }
      await logActivity(
        d,
        room,
        "deal_cancelled",
        isTarget
          ? `${myCountry} rejected a ${DEAL_TYPES[deal.dealType]} offer from ${deal.initiatorCountry}.`
          : `${myCountry} cancelled their ${DEAL_TYPES[deal.dealType]} offer to ${deal.targetCountry}.`,
        {
          a: deal.initiatorCountry,
          b: deal.targetCountry,
          dealType: deal.dealType,
          power: deal.powerCard,
          by: myCountry,
          rejected: isTarget,
          round: deal.round,
        },
      );
      return { ok: true };
    }),
});
