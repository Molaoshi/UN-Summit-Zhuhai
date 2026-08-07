/**
 * Seed script. "UN Summit: Zhuhai" keeps all static game data (countries,
 * assets, power cards, missions) in contracts/game-data.ts — there is nothing
 * to insert into the database at seed time. Rooms seed their own starting
 * bloc memberships when created.
 */
async function seed() {
  console.log(
    "Nothing to seed: game data lives in contracts/game-data.ts; " +
      "tables are created by the boot-time ensure-schema step.",
  );
  process.exit(0);
}

seed();
