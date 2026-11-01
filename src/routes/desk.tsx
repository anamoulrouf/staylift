import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CheckinFlow } from "@/components/checkin-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { stayRange } from "@/lib/staylift/format";
import { getDeskArrivals, getStay } from "@/lib/staylift/server";
import { isUnauthorized, toLogin } from "@/lib/staylift/session";

/**
 * Front-desk tablet. Staff pick the arriving guest, hand over the tablet, and
 * the guest runs the same check-in step they'd see on their phone (source:
 * desk_tablet). When they finish, the screen returns to the arrivals list.
 */
export const Route = createFileRoute("/desk")({
  loader: async () => {
    try {
      return await getDeskArrivals({ data: {} });
    } catch (err) {
      if (isUnauthorized(err)) throw toLogin("/desk");
      if (err instanceof Error && err.message === "No hotel yet") throw redirect({ to: "/onboarding" });
      throw err;
    }
  },
  component: Desk,
});

type Stay = Awaited<ReturnType<typeof getStay>>;

function Desk() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [active, setActive] = useState<{ token: string; stay: Stay } | null>(null);
  const [showQr, setShowQr] = useState(false);

  async function open(token: string) {
    try {
      const stay = await getStay({ data: { token } });
      setActive({ token, stay });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open this stay.");
    }
  }

  async function reset() {
    setActive(null);
    await router.invalidate();
  }

  if (active) {
    const first = active.stay.reservation.guestName.split(" ")[0] ?? "";
    return (
      <main className="min-h-dvh bg-linen px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-display text-2xl font-medium">{data.property.name}</p>
              <p className="text-sm text-stone">{stayRange(active.stay.reservation.arrival, active.stay.reservation.departure)}</p>
            </div>
            <button type="button" onClick={() => void reset()} className="rounded-md px-3 py-2 text-xs text-mist hover:bg-cream hover:text-stone">
              Staff: cancel
            </button>
          </div>
          <CheckinFlow
            token={active.token}
            hotel={data.property.name}
            guestFirstName={first}
            guests={active.stay.reservation.guests}
            state={active.stay.checkin}
            config={active.stay.capture}
            source="desk_tablet"
            kiosk
            onDone={() => void reset()}
          />
        </div>
      </main>
    );
  }

  const open_ = data.arrivals.filter((a) => !a.completed);
  const done = data.arrivals.filter((a) => a.completed);

  return (
    <main className="min-h-dvh bg-linen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/hotel" className="inline-flex items-center gap-1 text-sm text-stone hover:text-ink">
            <ArrowLeft className="size-4" /> Back to the hotel
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setShowQr((v) => !v)}>
            <QrCode className="size-4" /> {showQr ? "Hide QR" : "Show check-in QR"}
          </Button>
        </div>
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight">Check-in desk</h1>
        <p className="mt-2 text-stone">
          Tap the guest in front of you, then hand them the tablet. It returns here when they finish.
        </p>

        {showQr ? (
          <section className="mt-6 flex flex-col items-center gap-4 rounded-xl bg-paper p-6 text-center shadow-[var(--shadow-border)] sm:flex-row sm:text-left">
            <div className="size-44 shrink-0" dangerouslySetInnerHTML={{ __html: data.qr.svg }} />
            <div>
              <p className="font-display text-xl font-medium">Check in on your phone</p>
              <p className="mt-1 text-sm text-stone">Scan, then enter your last name and booking reference.</p>
              <p className="mt-3 break-all font-mono text-xs text-mist">{data.qr.url}</p>
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.16em] text-stone">To check in ({open_.length})</h2>
          {open_.length === 0 ? (
            <p className="mt-3 rounded-lg border border-line bg-cream px-4 py-8 text-center text-stone">Everyone due is checked in.</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {open_.map((a) => (
                <li key={a.reservationId}>
                  <button
                    type="button"
                    onClick={() => void open(a.token)}
                    className="flex min-h-20 w-full flex-col items-start rounded-xl bg-paper px-5 py-4 text-left shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]"
                  >
                    <span className="font-display text-xl font-medium">{a.guestName}</span>
                    <span className="mt-1 text-sm text-stone">
                      {stayRange(a.arrival, a.departure)} · {a.room} · {a.source}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {done.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-[0.16em] text-stone">Checked in ({done.length})</h2>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-border)]">
              {done.map((a) => (
                <li key={a.reservationId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="flex items-center gap-2">
                    <Check className="size-4 text-pine" /> {a.guestName}
                  </span>
                  <Badge tone={a.verified ? "pine" : "quiet"}>{a.verified ? "Own contact" : "No contact"}</Badge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
