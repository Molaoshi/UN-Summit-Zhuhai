import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  int,
  boolean,
  timestamp,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ── Game engine tables: "UN Summit: Zhuhai" ────────────────────────────────
// Countries/blocs/missions are static and live in contracts/game-data.ts.
// FK columns referencing a serial() PK use bigint unsigned (mode: "number").

export const rooms = mysqlTable("rooms", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  adminPin: varchar("admin_pin", { length: 4 }).notNull(),
  status: mysqlEnum("status", ["lobby", "playing", "ended"])
    .notNull()
    .default("lobby"),
  currentRound: int("current_round").notNull().default(0),
  roundPhase: mysqlEnum("round_phase", ["negotiation", "round_end"])
    .notNull()
    .default("negotiation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const players = mysqlTable(
  "players",
  {
    id: serial("id").primaryKey(),
    roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
    token: varchar("token", { length: 36 }).notNull().unique(),
    name: varchar("name", { length: 64 }).notNull(),
    // Nullable until the player claims a seat; unique per room (NULLs allowed).
    countryName: varchar("country_name", { length: 32 }),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("players_room_country_unique").on(
      table.roomId,
      table.countryName,
    ),
    index("players_room_idx").on(table.roomId),
  ],
);

export const deals = mysqlTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
    round: int("round").notNull(),
    initiatorCountry: varchar("initiator_country", { length: 32 }).notNull(),
    targetCountry: varchar("target_country", { length: 32 }).notNull(),
    dealType: mysqlEnum("deal_type", [
      "military",
      "resources",
      "energy",
      "tech",
    ]).notNull(),
    powerCard: varchar("power_card", { length: 64 }).notNull(),
    note: varchar("note", { length: 255 }),
    status: mysqlEnum("status", ["pending", "accepted", "cancelled"])
      .notNull()
      .default("pending"),
    // Points persisted at accept time (bloc alignment at signing matters).
    initiatorPoints: int("initiator_points"),
    targetPoints: int("target_points"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [index("deals_room_idx").on(table.roomId)],
);

// One row per deal action (send/accept/cancel) — feeds the 3-per-round cap.
export const dealActions = mysqlTable(
  "deal_actions",
  {
    id: serial("id").primaryKey(),
    roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
    round: int("round").notNull(),
    country: varchar("country", { length: 32 }).notNull(),
    action: mysqlEnum("action", ["send", "accept", "cancel"]).notNull(),
    dealId: bigint("deal_id", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("deal_actions_room_round_country_idx").on(
      table.roomId,
      table.round,
      table.country,
    ),
  ],
);

// History rows per round; the current bloc of a country is its latest row.
export const blocMemberships = mysqlTable(
  "bloc_memberships",
  {
    id: serial("id").primaryKey(),
    roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
    round: int("round").notNull(),
    country: varchar("country", { length: 32 }).notNull(),
    blocName: varchar("bloc_name", { length: 24 }).notNull(),
  },
  (table) => [index("bloc_memberships_room_idx").on(table.roomId)],
);

// One per room+country, enforced in code.
export const espionagePeeks = mysqlTable(
  "espionage_peeks",
  {
    id: serial("id").primaryKey(),
    roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
    country: varchar("country", { length: 32 }).notNull(),
    peekedCountry: varchar("peeked_country", { length: 32 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("espionage_peeks_room_idx").on(table.roomId)],
);

// Admin manual mission overrides; latest row per (room, country, slot) wins.
export const missionOverrides = mysqlTable(
  "mission_overrides",
  {
    id: serial("id").primaryKey(),
    roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
    country: varchar("country", { length: 32 }).notNull(),
    missionSlot: mysqlEnum("mission_slot", [
      "public",
      "private",
      "bonus",
    ]).notNull(),
    status: mysqlEnum("status", ["completed", "failed"]).notNull(),
    note: varchar("note", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("mission_overrides_room_idx").on(table.roomId)],
);

export const scoreAdjustments = mysqlTable(
  "score_adjustments",
  {
    id: serial("id").primaryKey(),
    roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
    country: varchar("country", { length: 32 }).notNull(),
    delta: int("delta").notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("score_adjustments_room_idx").on(table.roomId)],
);

export const activityLog = mysqlTable(
  "activity_log",
  {
    id: serial("id").primaryKey(),
    roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
    round: int("round").notNull(),
    kind: varchar("kind", { length: 32 }).notNull(),
    message: varchar("message", { length: 500 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("activity_log_room_idx").on(table.roomId)],
);

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type DealAction = typeof dealActions.$inferSelect;
export type BlocMembership = typeof blocMemberships.$inferSelect;
export type EspionagePeek = typeof espionagePeeks.$inferSelect;
export type MissionOverride = typeof missionOverrides.$inferSelect;
export type ScoreAdjustment = typeof scoreAdjustments.$inferSelect;
export type ActivityLogRow = typeof activityLog.$inferSelect;
