/**
 * Server-side bootstrap for the shared demo identity (server-only).
 *
 * `demoIdentityUserId()` returns `DEMO_USER_ID` after making sure, idempotently,
 * that the identity can actually use the app:
 *   1. a `"user"` row (so names/emails render in the shell and team page —
 *      camelCase quoted columns per migrations/0001_auth.sql; bare
 *      `on conflict do nothing` covers both the PK and the unique email),
 *   2. an `owner` membership in the demo hotel (full access by design — every
 *      dashboard screen must work signed-out; `memberships.user_id` has no FK
 *      on purpose, see migrations/0007_tenancy_security.sql),
 *   3. an `user_settings` row pointing at the demo hotel (so
 *      `access.staffContext` resolves the active property immediately).
 *
 * The promise is memoized on `globalThis` (same pattern as `tenant-db.ts`) so
 * the work runs once per serverless instance, not once per request. All writes
 * are idempotent, so concurrent cold starts are safe; a failed bootstrap clears
 * the memo so the next request retries.
 *
 * Uses the owner connection (`systemSql`) — this runs before any hotel is known,
 * exactly like sign-in and membership lookups.
 */
import { systemSql } from "@/lib/staylift/tenant-db";
import { DEMO_USER_EMAIL, DEMO_USER_ID, DEMO_USER_NAME } from "./demo-identity";

const globalRef = globalThis as typeof globalThis & {
  __stayliftDemoIdentity__?: Promise<string>;
};

async function bootstrap(): Promise<string> {
  const sql = await systemSql();

  await sql`
    insert into "user" ("id", "name", "email", "emailVerified")
    values (${DEMO_USER_ID}, ${DEMO_USER_NAME}, ${DEMO_USER_EMAIL}, true)
    on conflict do nothing
  `;

  const demo = await sql.query<{ id: string }>(
    `select id from properties where is_demo order by id limit 1`,
  );
  const propertyId = demo[0]?.id;
  if (!propertyId) {
    throw new Error(
      "Open access is on but this database has no demo hotel. " +
        "Set STAYLIFT_OPEN_ACCESS=off to restore the sign-in wall.",
    );
  }

  await sql`
    insert into memberships (user_id, property_id, role)
    values (${DEMO_USER_ID}, ${propertyId}, 'owner')
    on conflict (user_id, property_id) do nothing
  `;
  await sql`
    insert into user_settings (user_id, active_property_id)
    values (${DEMO_USER_ID}, ${propertyId})
    on conflict (user_id) do update set active_property_id = excluded.active_property_id
  `;

  return DEMO_USER_ID;
}

/** The shared demo user id, bootstrapping its rows on first use. */
export function demoIdentityUserId(): Promise<string> {
  globalRef.__stayliftDemoIdentity__ ??= bootstrap().catch((err) => {
    globalRef.__stayliftDemoIdentity__ = undefined;
    throw err;
  });
  return globalRef.__stayliftDemoIdentity__;
}
