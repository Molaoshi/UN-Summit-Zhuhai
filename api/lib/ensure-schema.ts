/**
 * Boot-time schema ensure for "UN Summit: Zhuhai".
 *
 * The deployment sandbox cannot reach the MySQL privatelink endpoint from the
 * dev machine, so `drizzle-kit push` cannot run there. Instead we apply
 * idempotent `CREATE TABLE IF NOT EXISTS` / index DDL on server boot (and lazily
 * on first DB use), matching db/schema.ts exactly (mirrors the drizzle-kit
 * generated migration in db/migrations/0000_*.sql).
 *
 * This is infrastructure DDL — an approved exception to the "no raw SQL" rule.
 * All application queries remain Drizzle-based.
 */
import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";

// `serial` = bigint unsigned auto_increment (drizzle MySQL mapping).
// MySQL has no CREATE INDEX IF NOT EXISTS, so index statements carry
// `ignoreDuplicate` and error 1061 (duplicate key name) is swallowed.
type DdlStatement = { ddl: string; ignoreDuplicate?: boolean };

const DDL_STATEMENTS: DdlStatement[] = [
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`rooms\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`code\` varchar(6) NOT NULL,
	\`admin_pin\` varchar(4) NOT NULL,
	\`status\` enum('lobby','playing','ended') NOT NULL DEFAULT 'lobby',
	\`current_round\` int NOT NULL DEFAULT 0,
	\`round_phase\` enum('negotiation','round_end') NOT NULL DEFAULT 'negotiation',
	\`active_countries\` json,
	\`created_at\` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT \`rooms_id\` PRIMARY KEY(\`id\`),
	CONSTRAINT \`rooms_code_unique\` UNIQUE(\`code\`)
)`,
  },
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`players\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`room_id\` bigint unsigned NOT NULL,
	\`token\` varchar(36) NOT NULL,
	\`name\` varchar(64) NOT NULL,
	\`country_name\` varchar(32),
	\`is_admin\` boolean NOT NULL DEFAULT false,
	\`created_at\` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT \`players_id\` PRIMARY KEY(\`id\`),
	CONSTRAINT \`players_token_unique\` UNIQUE(\`token\`),
	CONSTRAINT \`players_room_country_unique\` UNIQUE(\`room_id\`,\`country_name\`)
)`,
  },
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`deals\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`room_id\` bigint unsigned NOT NULL,
	\`round\` int NOT NULL,
	\`initiator_country\` varchar(32) NOT NULL,
	\`target_country\` varchar(32) NOT NULL,
	\`deal_type\` enum('military','resources','energy','tech') NOT NULL,
	\`power_card\` varchar(64) NOT NULL,
	\`note\` varchar(255),
	\`status\` enum('pending','accepted','cancelled') NOT NULL DEFAULT 'pending',
	\`initiator_points\` int,
	\`target_points\` int,
	\`created_at\` timestamp NOT NULL DEFAULT (now()),
	\`resolved_at\` timestamp,
	CONSTRAINT \`deals_id\` PRIMARY KEY(\`id\`)
)`,
  },
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`deal_actions\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`room_id\` bigint unsigned NOT NULL,
	\`round\` int NOT NULL,
	\`country\` varchar(32) NOT NULL,
	\`action\` enum('send','accept','cancel') NOT NULL,
	\`deal_id\` bigint unsigned NOT NULL,
	\`created_at\` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT \`deal_actions_id\` PRIMARY KEY(\`id\`)
)`,
  },
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`bloc_memberships\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`room_id\` bigint unsigned NOT NULL,
	\`round\` int NOT NULL,
	\`country\` varchar(32) NOT NULL,
	\`bloc_name\` varchar(24) NOT NULL,
	CONSTRAINT \`bloc_memberships_id\` PRIMARY KEY(\`id\`)
)`,
  },
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`espionage_peeks\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`room_id\` bigint unsigned NOT NULL,
	\`country\` varchar(32) NOT NULL,
	\`peeked_country\` varchar(32) NOT NULL,
	\`created_at\` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT \`espionage_peeks_id\` PRIMARY KEY(\`id\`)
)`,
  },
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`mission_overrides\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`room_id\` bigint unsigned NOT NULL,
	\`country\` varchar(32) NOT NULL,
	\`mission_slot\` enum('public','private','bonus') NOT NULL,
	\`status\` enum('completed','failed') NOT NULL,
	\`note\` varchar(255),
	\`created_at\` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT \`mission_overrides_id\` PRIMARY KEY(\`id\`)
)`,
  },
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`score_adjustments\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`room_id\` bigint unsigned NOT NULL,
	\`country\` varchar(32) NOT NULL,
	\`delta\` int NOT NULL,
	\`reason\` varchar(255) NOT NULL,
	\`created_at\` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT \`score_adjustments_id\` PRIMARY KEY(\`id\`)
)`,
  },
  {
    ddl: `CREATE TABLE IF NOT EXISTS \`activity_log\` (
	\`id\` bigint unsigned AUTO_INCREMENT NOT NULL,
	\`room_id\` bigint unsigned NOT NULL,
	\`round\` int NOT NULL,
	\`kind\` varchar(32) NOT NULL,
	\`message\` varchar(500) NOT NULL,
	\`params\` json,
	\`created_at\` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT \`activity_log_id\` PRIMARY KEY(\`id\`)
)`,
  },
  { ddl: `CREATE INDEX \`players_room_idx\` ON \`players\` (\`room_id\`)`, ignoreDuplicate: true },
  { ddl: `CREATE INDEX \`deals_room_idx\` ON \`deals\` (\`room_id\`)`, ignoreDuplicate: true },
  { ddl: `CREATE INDEX \`deal_actions_room_round_country_idx\` ON \`deal_actions\` (\`room_id\`,\`round\`,\`country\`)`, ignoreDuplicate: true },
  { ddl: `CREATE INDEX \`bloc_memberships_room_idx\` ON \`bloc_memberships\` (\`room_id\`)`, ignoreDuplicate: true },
  { ddl: `CREATE INDEX \`espionage_peeks_room_idx\` ON \`espionage_peeks\` (\`room_id\`)`, ignoreDuplicate: true },
  { ddl: `CREATE INDEX \`mission_overrides_room_idx\` ON \`mission_overrides\` (\`room_id\`)`, ignoreDuplicate: true },
  { ddl: `CREATE INDEX \`score_adjustments_room_idx\` ON \`score_adjustments\` (\`room_id\`)`, ignoreDuplicate: true },
  { ddl: `CREATE INDEX \`activity_log_room_idx\` ON \`activity_log\` (\`room_id\`)`, ignoreDuplicate: true },
];

/**
 * Columns added after the first live deploy. `CREATE TABLE IF NOT EXISTS`
 * never alters an existing table, so on the live Railway database we inspect
 * information_schema and ALTER TABLE only the columns that are missing.
 * (Same approved raw-DDL exception as the CREATE TABLE statements above.)
 */
const ENSURE_COLUMNS: { table: string; column: string; ddl: string }[] = [
  {
    table: "rooms",
    column: "active_countries",
    ddl: "ALTER TABLE `rooms` ADD COLUMN `active_countries` json NULL AFTER `round_phase`",
  },
  {
    table: "activity_log",
    column: "params",
    ddl: "ALTER TABLE `activity_log` ADD COLUMN `params` json NULL AFTER `message`",
  },
];

async function ensureColumns(): Promise<void> {
  const db = getDb();
  for (const col of ENSURE_COLUMNS) {
    // SELECT DATABASE() pins the check to the connected schema.
    const res = (await db.execute(
      sql.raw(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS ` +
          `WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${col.table}' ` +
          `AND COLUMN_NAME = '${col.column}'`,
      ),
    )) as unknown;
    // mysql2 returns [rows, fields]; tolerate a bare rows array too.
    const rows: { COLUMN_NAME?: string }[] = Array.isArray(res)
      ? Array.isArray(res[0])
        ? (res[0] as { COLUMN_NAME?: string }[])
        : (res as { COLUMN_NAME?: string }[])
      : [];
    if (rows.some((r) => r && r.COLUMN_NAME === col.column)) continue;
    await db.execute(sql.raw(col.ddl));
    console.log(`[ensure-schema] added column ${col.table}.${col.column}`);
  }
}

let ensured = false;
let inflight: Promise<boolean> | null = null;

/** Walk an error and its .cause chain (drizzle wraps driver errors). */
function* errChain(err: unknown): Generator<{ errno?: number; message?: string }> {
  let cur: unknown = err;
  for (let depth = 0; cur && depth < 6; depth++) {
    yield cur as { errno?: number; message?: string };
    cur = (cur as { cause?: unknown }).cause;
  }
}

function isDuplicateIndexError(err: unknown): boolean {
  for (const e of errChain(err)) {
    if (
      e?.errno === 1061 ||
      (typeof e?.message === "string" && e.message.includes("Duplicate key name"))
    ) {
      return true;
    }
  }
  return false;
}

function isDuplicateColumnError(err: unknown): boolean {
  for (const e of errChain(err)) {
    if (
      e?.errno === 1060 ||
      (typeof e?.message === "string" && e.message.includes("Duplicate column name"))
    ) {
      return true;
    }
  }
  return false;
}

async function runEnsure(): Promise<boolean> {
  const db = getDb();
  for (const stmt of DDL_STATEMENTS) {
    try {
      await db.execute(sql.raw(stmt.ddl));
    } catch (err) {
      if (stmt.ignoreDuplicate && isDuplicateIndexError(err)) continue;
      throw err;
    }
  }
  // Evolve pre-existing live tables (CREATE TABLE IF NOT EXISTS never adds
  // columns to an existing table). Duplicate-column (1060) can happen when
  // two instances race the same ALTER — harmless, treat as done.
  try {
    await ensureColumns();
  } catch (err) {
    if (!isDuplicateColumnError(err)) throw err;
  }
  return true;
}

/**
 * Idempotent. Never throws: if the DB is briefly unreachable we log the
 * failure and allow a retry on the next call (request or boot retry).
 * Returns true when the schema is confirmed present.
 */
export async function ensureSchema(): Promise<boolean> {
  if (ensured) return true;
  if (!inflight) {
    inflight = runEnsure()
      .then(() => {
        ensured = true;
        console.log("[ensure-schema] game tables verified/created");
        return true;
      })
      .catch((err) => {
        inflight = null; // allow retry on next call
        console.error(
          "[ensure-schema] failed (will retry on next request):",
          err instanceof Error ? err.message : err,
        );
        return false;
      });
  }
  return inflight;
}
