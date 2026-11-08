import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBookingEmail, sendBookingEmail } from "@/lib/staylift/server";
import { formatDate, money, priceHint, stayRange } from "@/lib/staylift/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hotel/email/$reservationId")({
  loader: ({ params }) =>
    getBookingEmail({
      data: {
        reservationId: params.reservationId,
        origin: typeof window === "undefined" ? undefined : window.location.origin,
      },
    }),
  component: EmailPreview,
});

const MODE_COPY = {
  full: "Guest's own address: offer cards with prices and one-tap links straight to each offer.",
  light:
    "OTA relay address: everything stays about this reservation — the picks and why, no prices, one link to the stay page.",
  service: "Holdout booking: confirmation and check-in only, so the control group never sees an offer.",
} as const;

function EmailPreview() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [width, setWidth] = useState<"desktop" | "phone">("desktop");
  const [view, setView] = useState<"html" | "text">("html");
  const [sending, setSending] = useState(false);
  const r = data.reservation;

  async function send() {
    setSending(true);
    try {
      const res = await sendBookingEmail({
        data: { reservationId: r.id, origin: window.location.origin },
      });
      toast.success(`Sent: “${res.subject}”`);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="guest-scope mx-auto max-w-6xl">
      <Link to="/hotel/reservations" className="text-sm text-stone hover:text-ink">
        ← Reservations
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-stone">Step 2 of the journey · booking email</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {r.guestName}
          </h1>
          <p className="mt-1 text-stone">
            {stayRange(r.arrival, r.departure)} · {r.roomTypeName} · {r.bookingRef} via {r.source}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/stay/$token" params={{ token: r.token }} search={{ src: "email" }}>
            <Button variant="secondary">Open landing page</Button>
          </Link>
          <Button onClick={() => void send()} disabled={sending || !data.email || Boolean(data.sentAt)}>
            {data.sentAt ? `Sent ${formatDate(data.sentAt)}` : sending ? "Sending…" : "Send now"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="min-w-0 rounded-xl bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5">
          {data.email ? (
            <>
              <dl className="space-y-1.5 border-b border-line pb-4 text-sm">
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-stone">To</dt>
                  <dd>{data.recipient}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-stone">Subject</dt>
                  <dd className="font-medium">{data.email.subject}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-stone">Preview</dt>
                  <dd className="text-stone">{data.email.preheader}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-md bg-cream p-1" role="tablist" aria-label="Format">
                  {(["html", "text"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="tab"
                      aria-selected={view === v}
                      onClick={() => setView(v)}
                      className={cn("h-8 rounded-sm px-3 text-sm", view === v ? "bg-paper shadow-[var(--shadow-border)]" : "text-stone")}
                    >
                      {v === "html" ? "Email" : "Plain text"}
                    </button>
                  ))}
                </div>
                {view === "html" ? (
                  <div className="inline-flex rounded-md bg-cream p-1" role="tablist" aria-label="Width">
                    {(["desktop", "phone"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={width === v}
                        onClick={() => setWidth(v)}
                        className={cn("h-8 rounded-sm px-3 text-sm", width === v ? "bg-paper shadow-[var(--shadow-border)]" : "text-stone")}
                      >
                        {v === "desktop" ? "Desktop" : "Phone"}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {view === "html" ? (
                <div className="mt-4 flex justify-center overflow-hidden rounded-lg bg-linen">
                  <iframe
                    title="Booking email preview"
                    srcDoc={data.email.html}
                    sandbox=""
                    className="h-[900px] border-0 bg-linen"
                    style={{ width: width === "desktop" ? "100%" : 375, maxWidth: "100%" }}
                  />
                </div>
              ) : (
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-cream p-4 text-sm leading-relaxed">
                  {data.email.text}
                </pre>
              )}
            </>
          ) : (
            <p className="py-10 text-center text-stone">
              No email address on this booking — it gets the WhatsApp check-in link instead, if a valid
              phone exists.
            </p>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-medium">Email version</h2>
              <Badge tone={data.mode === "full" ? "pine" : data.mode === "light" ? "amber" : "quiet"}>
                {data.modeLabel}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-stone">{data.mode ? MODE_COPY[data.mode] : "Not emailable."}</p>
          </section>

          <section className="rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-lg font-medium">Why these offers</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {data.signals.map((s) => (
                <li key={s}>
                  <Badge tone="quiet">{s}</Badge>
                </li>
              ))}
            </ul>
            <ol className="mt-4 space-y-3">
              {data.picks.map((p, i) => (
                <li key={p.offerId} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">
                      {i + 1}. {p.name}
                    </span>
                    <span className="tabular-nums text-stone">
                      {money(p.priceCents)}
                      {priceHint(p.priceUnit)}
                    </span>
                  </div>
                  <p className="text-stone">{p.reason}</p>
                  <p className="text-xs text-mist">score {p.score}</p>
                </li>
              ))}
            </ol>
            {data.mode === "service" ? (
              <p className="mt-3 text-xs text-stone">Picks are shown here for staff only; this guest won’t see them.</p>
            ) : null}
          </section>

          <section className="rounded-xl bg-paper p-5 text-sm text-stone shadow-[var(--shadow-border)]">
            Sends automatically when a booking is ingested. Links carry <code className="text-ink">src=email</code>,
            so the landing-page visit and any offer bought on it count toward the email in the journey
            funnel on Overview.
          </section>
        </aside>
      </div>
    </div>
  );
}
