/**
 * Database access.
 *
 * One async interface, two drivers:
 *
 *   * no DATABASE_URL   ->  SQLite file at ./data/365step.db (better-sqlite3)
 *   * DATABASE_URL set  ->  PostgreSQL / Supabase (postgres.js)
 *
 * Queries are written once with `?` placeholders; for Postgres they are
 * rewritten to $1..$n. The schema is applied when the driver is created, so a
 * fresh database (or a fresh /tmp on a serverless cold start) just works.
 *
 * Server-only. Imported by server components, server actions and scripts, so
 * it avoids Next-specific imports.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import path from "node:path";

import { SCHEMA } from "./schema";

export type SqlParam = string | number | null;
export type Row = Record<string, unknown>;

interface Executor {
  all(sql: string, params: SqlParam[]): Promise<Row[]>;
  run(sql: string, params: SqlParam[]): Promise<void>;
}

interface Driver extends Executor {
  dialect: "sqlite" | "postgres";
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  exec(sql: string): Promise<void>;
}

/** The executor an open transaction has reserved, scoped to its async call tree. */
const txContext = new AsyncLocalStorage<Executor>();

function toPgPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// --------------------------------------------------------------- sqlite ----

async function createSqliteDriver(): Promise<Driver> {
  const { default: Database } = await import("better-sqlite3");

  // Serverless hosts only allow writes to /tmp. That copy is ephemeral and not
  // shared between instances: fine for a first look, not for real users. Set
  // DATABASE_URL for that.
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const file =
    process.env.SQLITE_PATH ??
    (isServerless ? "/tmp/365step.db" : path.join(process.cwd(), "data", "365step.db"));
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  const executor: Executor = {
    async all(sql, params) {
      return db.prepare(sql).all(...params) as Row[];
    },
    async run(sql, params) {
      db.prepare(sql).run(...params);
    },
  };

  // better-sqlite3 has one connection and cannot wrap async work in its own
  // transaction helper. Transactions are queued so two requests never share
  // one BEGIN; plain reads outside a transaction run immediately.
  let queue: Promise<unknown> = Promise.resolve();

  return {
    dialect: "sqlite",
    ...executor,
    transaction<T>(fn: () => Promise<T>): Promise<T> {
      if (txContext.getStore()) return fn();
      const result = queue.then(async () => {
        db.exec("BEGIN IMMEDIATE");
        try {
          const value = await txContext.run(executor, fn);
          db.exec("COMMIT");
          return value;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      });
      queue = result.catch(() => undefined);
      return result;
    },
    async exec(sql) {
      db.exec(sql);
    },
  };
}

// ------------------------------------------------------------- postgres ----

type PgConnection = { unsafe(q: string, p?: unknown[]): Promise<unknown> };
type PgPool = PgConnection & { reserve(): Promise<PgConnection & { release(): void }> };

async function createPostgresDriver(url: string): Promise<Driver> {
  const { default: postgres } = await import("postgres");

  const local = url.includes("localhost") || url.includes("127.0.0.1");
  const pool = postgres(url, {
    // Pages read in parallel; a few more connections keep those reads from queueing.
    max: 10,
    idle_timeout: 20,
    prepare: false, // Supabase's transaction pooler cannot hold prepared statements
    ssl: local ? false : "require",
    onnotice: () => {}, // "relation already exists, skipping" on every cold start
  }) as unknown as PgPool;

  await pool.unsafe(SCHEMA);

  const wrap = (conn: PgConnection): Executor => ({
    async all(sql, params) {
      return (await conn.unsafe(toPgPlaceholders(sql), params)) as Row[];
    },
    async run(sql, params) {
      await conn.unsafe(toPgPlaceholders(sql), params);
    },
  });
  const poolExecutor = wrap(pool);

  return {
    dialect: "postgres",
    ...poolExecutor,
    async transaction(fn) {
      if (txContext.getStore()) return fn();
      const held = await pool.reserve();
      try {
        await held.unsafe("BEGIN");
        try {
          const result = await txContext.run(wrap(held), fn);
          await held.unsafe("COMMIT");
          return result;
        } catch (error) {
          await held.unsafe("ROLLBACK");
          throw error;
        }
      } finally {
        held.release();
      }
    },
    async exec(sql) {
      await pool.unsafe(sql);
    },
  };
}

// -------------------------------------------------------------- singleton ---

const globalForDb = globalThis as unknown as { __step365Driver?: Promise<Driver> };

function driver(): Promise<Driver> {
  if (!globalForDb.__step365Driver) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    const created = url ? createPostgresDriver(url) : createSqliteDriver();
    // A failed connection should be retried on the next request, not cached forever.
    created.catch(() => {
      globalForDb.__step365Driver = undefined;
    });
    globalForDb.__step365Driver = created;
  }
  return globalForDb.__step365Driver;
}

export async function dialect(): Promise<"sqlite" | "postgres"> {
  return (await driver()).dialect;
}

export async function all<T = Row>(sql: string, params: SqlParam[] = []): Promise<T[]> {
  const target = txContext.getStore() ?? (await driver());
  return (await target.all(sql, params)) as T[];
}

export async function one<T = Row>(sql: string, params: SqlParam[] = []): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

export async function run(sql: string, params: SqlParam[] = []): Promise<void> {
  const target = txContext.getStore() ?? (await driver());
  await target.run(sql, params);
}

/** A single numeric aggregate (COUNT, SUM, ...), coerced past driver types. */
export async function scalar(sql: string, params: SqlParam[] = []): Promise<number> {
  const row = await one<Row>(sql, params);
  if (!row) return 0;
  const value = Object.values(row)[0];
  return value === null || value === undefined ? 0 : Number(value);
}

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  return (await driver()).transaction(fn);
}

export async function exec(sql: string): Promise<void> {
  await (await driver()).exec(sql);
}

// ----------------------------------------------------------------- helpers --

export function json<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function str(value: unknown, fallback = ""): string {
  return value === null || value === undefined ? fallback : String(value);
}
