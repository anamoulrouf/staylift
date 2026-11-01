/**
 * Client-side helpers for routes that need a signed-in staff member.
 * Server functions throw "Unauthorized" (signed out) or "No hotel yet"; these
 * turn that into the right redirect.
 */
import { redirect } from "@tanstack/react-router";

export function isUnauthorized(err: unknown) {
  return err instanceof Error && (err.message === "Unauthorized" || (err as { status?: number }).status === 401);
}

export function toLogin(next: string) {
  return redirect({ to: "/login", search: { next } });
}

export function isNoHotel(err: unknown) {
  return err instanceof Error && err.message === "No hotel yet";
}
