/**
 * Real money, in one of two modes (mirrors the mailer):
 * - stripe — STRIPE_SECRET_KEY is set: auto-approve claims go through Stripe
 *   Checkout and money actually moves before arrival. Declines refund.
 * - demo   — no key: charges are simulated exactly as before (embedded dev
 *   database), so the demo keeps working with zero setup.
 * With a real database and no key, online payment is refused at the call site:
 * a hotel must never believe money arrived when it didn't.
 *
 * Stripe is called over its REST API with fetch — no SDK, form-encoded bodies —
 * so this runs anywhere the app runs.
 */
import { env } from "@/lib/env.server.ts";
import type { MarketId } from "./markets.ts";

const STRIPE_API = "https://api.stripe.com/v1";

export type PaymentsMode = "stripe" | "demo";

export function paymentsMode(): PaymentsMode {
  return env("STRIPE_SECRET_KEY") ? "stripe" : "demo";
}

/** Purchases need a way to actually collect: fine in demo, refused on a real database without a key. */
export function paymentsAvailable(realDatabase: boolean): boolean {
  return paymentsMode() === "stripe" || !realDatabase;
}

export function currencyFor(market: MarketId): "usd" | "gbp" | "eur" | "aed" {
  switch (market) {
    case "UK":
      return "gbp";
    case "EU":
      return "eur";
    case "AE":
      return "aed";
    default:
      return "usd";
  }
}

type StripeFailure = { error?: { message?: string } };

async function stripe<T>(path: string, params?: Record<string, string>): Promise<T> {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe isn't configured for this hotel.");
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? new URLSearchParams(params) : undefined,
  });
  const json = (await res.json()) as T & StripeFailure;
  if (!res.ok) throw new Error(json?.error?.message ?? `Stripe request failed (${res.status}).`);
  return json;
}

export type CheckoutSession = {
  id: string;
  url: string;
  payment_status?: string;
  payment_intent?: string | null;
};

export async function createCheckoutSession(input: {
  amountCents: number;
  currency: string;
  label: string;
  description?: string;
  orderId: string;
  /** Include {CHECKOUT_SESSION_ID} where Stripe should echo the session id. */
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSession> {
  const params: Record<string, string> = {
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.orderId,
    "metadata[order_id]": input.orderId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.currency,
    "line_items[0][price_data][unit_amount]": String(input.amountCents),
    "line_items[0][price_data][product_data][name]": input.label,
  };
  if (input.description) {
    params["line_items[0][price_data][product_data][description]"] = input.description;
  }
  return stripe<CheckoutSession>("/checkout/sessions", params);
}

export async function retrieveCheckoutSession(sessionId: string): Promise<CheckoutSession> {
  return stripe<CheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

export async function refundPaymentIntent(
  paymentIntentId: string,
): Promise<{ id: string; status?: string }> {
  return stripe("/refunds", { payment_intent: paymentIntentId });
}
