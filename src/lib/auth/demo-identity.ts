/**
 * Open-access demo identity — who a signed-out visitor is when
 * `STAYLIFT_OPEN_ACCESS` is on (the default).
 *
 * Open access exists so the deployed app can be explored with NO sign-in wall:
 * every authed server function resolves the caller to this one shared identity,
 * which is idempotently bootstrapped as an owner member of the demo hotel (see
 * `demo-identity.server.ts`). Real sessions always win — this is only the
 * fallback when `getSessionUser` finds nobody.
 *
 * Suffix-free module (like `providers.ts`) so BOTH the client graph and server
 * graph can import the constants — `src/lib/staylift/server.ts` is imported by
 * client routes, and this file must stay free of pg/server-only imports.
 * The `process.env` read inside the function body is guarded the same way
 * `demoEnabled()` in `src/lib/staylift/access.ts` guards it.
 */

/** Stable id of the shared demo visitor. Must never collide with a real user id. */
export const DEMO_USER_ID = "demo-visitor";
export const DEMO_USER_NAME = "Demo Visitor";
export const DEMO_USER_EMAIL = "demo@staylift.app";

/**
 * True unless explicitly switched off with `STAYLIFT_OPEN_ACCESS=off` — default
 * ON so dev and the deployed build are explorable with zero env setup. Set the
 * flag to `"off"` (locally, or as a Vercel env var) to restore the exact
 * 401 → /login wall.
 */
export function demoAccessEnabled(): boolean {
  const flag =
    typeof process !== "undefined"
      ? process.env.STAYLIFT_OPEN_ACCESS?.trim().toLowerCase()
      : undefined;
  return flag !== "off";
}
