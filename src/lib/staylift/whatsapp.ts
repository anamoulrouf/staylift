/**
 * WhatsApp via the Meta Cloud API, one of two modes (mirrors the mailer):
 * - cloud-api — WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set: utility
 *   template messages (check-in codes, stay links) actually send, with the
 *   modelled cost recorded per message like every other channel.
 * - dev       — no credentials: codes and links surface in the UI instead,
 *   exactly as before.
 * With a real database and no credentials the call site refuses: a hotel must
 * never believe a message went out.
 *
 * Templates must exist (and be approved) in the hotel's Meta WhatsApp account;
 * their names come from env because every WABA names them differently. The
 * defaults match the two utility templates the product needs:
 *   verify_code — body params: [code, ttl minutes]
 *   stay_link   — body params: [hotel name, url]
 */
import { env } from "@/lib/env.server.ts";

const GRAPH = "https://graph.facebook.com/v21.0";

export type WhatsAppMode = "cloud-api" | "dev";

export function whatsappStatus(): { mode: WhatsAppMode } {
  return env("WHATSAPP_TOKEN") && env("WHATSAPP_PHONE_NUMBER_ID")
    ? { mode: "cloud-api" }
    : { mode: "dev" };
}

export const WHATSAPP_TEMPLATES = {
  code: () => env("WHATSAPP_TEMPLATE_CODE") ?? "verify_code",
  stayLink: () => env("WHATSAPP_TEMPLATE_STAY_LINK") ?? "stay_link",
};

/** Modelled utility cost per message; Meta's real rate depends on market. */
export function whatsappCostCents(): number {
  const raw = Number(env("WHATSAPP_UTILITY_COST_CENTS"));
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

export async function sendWhatsAppTemplate(input: {
  /** E.164; the Cloud API wants it without the leading +. */
  to: string;
  template: string;
  params: string[];
}): Promise<{ ok: true; messageId: string }> {
  const token = env("WHATSAPP_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("WhatsApp isn't connected for this hotel yet.");
  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: input.to.replace(/^\+/, ""),
      type: "template",
      template: {
        name: input.template,
        language: { code: env("WHATSAPP_LANG") ?? "en" },
        components: [
          { type: "body", parameters: input.params.map((text) => ({ type: "text", text })) },
        ],
      },
    }),
  });
  const json = (await res.json()) as { messages?: { id: string }[]; error?: { message?: string } };
  if (!res.ok || !json.messages?.[0]) {
    throw new Error(json?.error?.message ?? "WhatsApp send failed.");
  }
  return { ok: true, messageId: json.messages[0].id };
}
