/**
 * Small in-memory rate limiter for public, unauthenticated actions (booking
 * lookup from the desk QR, sending verification codes). Per server instance:
 * enough to stop casual guessing; a shared store (e.g. Upstash) is the upgrade
 * when traffic spreads across many instances.
 *
 * `.server.ts`: imports @tanstack/react-start/server, which must never reach
 * the browser bundle. Import it dynamically inside handlers.
 */
import { getRequest } from "@tanstack/react-start/server";

const store = globalThis as typeof globalThis & { __stayliftRate__?: Map<string, number[]> };

/**
 * The client's address as the hosting proxy saw it. x-real-ip is set by the
 * platform (Vercel); otherwise take the LAST x-forwarded-for hop, which our own
 * proxy appended — the first hop is whatever the client claimed.
 */
export function clientKey(): string {
  const req = getRequest();
  const real = req?.headers.get("x-real-ip")?.trim();
  const hops = req?.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean) ?? [];
  return real || hops[hops.length - 1] || "local";
}

/** Throws when `key` has made `max` calls within `windowMs`. */
export function limit(action: string, max: number, windowMs: number, key = clientKey()) {
  store.__stayliftRate__ ??= new Map();
  const map = store.__stayliftRate__;
  const id = `${action}:${key}`;
  const now = Date.now();
  const hits = (map.get(id) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) throw new Error("Too many attempts. Wait a few minutes and try again.");
  hits.push(now);
  map.set(id, hits);
  if (map.size > 5000) {
    for (const [k, v] of map) if (v.every((t) => now - t >= windowMs)) map.delete(k);
  }
}

/** This request's own origin (https://host), for links built during server rendering. */
export function requestOrigin(): string | undefined {
  const req = getRequest();
  if (!req) return undefined;
  try {
    const url = new URL(req.url);
    const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
    return `${proto}://${host}`;
  } catch {
    return undefined;
  }
}
