/**
 * Hotel-scoped database access (server-only).
 *
 *   withTenant(propertyId, sql => …)
 *     Runs `fn` in ONE transaction that
 *       1. sets app.property_id = propertyId (transaction-local), and
 *       2. switches to the non-owner role staylift_app,
 *     so row-level security (migrations 0007/0008) only shows that hotel's rows
 *     and new rows default to that hotel. Any error rolls the whole call back.
 *
 *   systemSql()
 *     The owner connection (no RLS). Only for work that must look across hotels
 *     before a hotel is known: sign-in, membership lookups, guest-link token
 *     resolution, invitations, scheduled purges. Never pass it to queries.ts.
 *
 * Inside `fn`, use only the `sql` it receives. Calling getSql() inside would wait
 * on the open transaction (PGLite has one connection) and never return.
 */
import { dbSource, getPglite, getSql, type Sql } from "@/lib/db";

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Runner = <T>(text: string, params: unknown[]) => Promise<T[]>;

function toSql(run: Runner): Sql {
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => run<T>(text, params);
  return sql;
}

const PROPERTY_ID_RE = /^[a-z0-9_-]{1,64}$/i;

const globalRef = globalThis as typeof globalThis & {
  __stayliftTenantPool__?: Promise<import("pg").Pool>;
};

function tenantPool(): Promise<import("pg").Pool> {
  globalRef.__stayliftTenantPool__ ??= (async () => {
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    return new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  })().catch((err) => {
    globalRef.__stayliftTenantPool__ = undefined;
    throw err;
  });
  return globalRef.__stayliftTenantPool__;
}

export async function withTenant<T>(propertyId: string, fn: (sql: Sql) => Promise<T>): Promise<T> {
  if (!PROPERTY_ID_RE.test(propertyId)) throw new Error("Invalid hotel id.");

  if (dbSource === "pglite") {
    const pg = await getPglite();
    return pg.transaction(async (tx) => {
      await tx.query("select set_config('app.property_id', $1, true)", [propertyId]);
      await tx.exec("set local role staylift_app");
      return fn(toSql(async <R>(text: string, params: unknown[]) => (await tx.query<R>(text, params)).rows));
    });
  }

  const pool = await tenantPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.property_id', $1, true)", [propertyId]);
    await client.query("set local role staylift_app");
    const result = await fn(
      toSql(async <R>(text: string, params: unknown[]) => (await client.query(text, params)).rows as R[]),
    );
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/** Owner connection, bypasses RLS. See the module note for when it is allowed. */
export function systemSql(): Promise<Sql> {
  return getSql();
}
