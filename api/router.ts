import { createRouter, publicQuery } from "./middleware";
import { roomRouter } from "./routers/room";
import { lobbyRouter } from "./routers/lobby";
import { gameRouter } from "./routers/game";
import { dealsRouter } from "./routers/deals";
import { espionageRouter } from "./routers/espionage";
import { adminRouter } from "./routers/admin";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  room: roomRouter,
  lobby: lobbyRouter,
  game: gameRouter,
  deals: dealsRouter,
  espionage: espionageRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
