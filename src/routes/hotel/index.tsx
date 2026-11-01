import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PendingCard } from "@/components/pending-card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { decideOrder, getDashboard } from "@/lib/staylift/server";
import { formatDateLong, money, pctOf, stayRange } from "@/lib/staylift/format";

export const Route = createFileRoute("/hotel/")({
  loader: () => getDashboard(),
  component: Overview,
});

function Overview() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const f = data.funnel;

  async function decide(orderId: string, decision: "approve" | "decline") {
    try {
      await decideOrder({ data: { orderId, decision } });
      toast.success(decision === "approve" ? "Approved. Payment captured." : "Declined. Guest notified.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update order.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl stagger-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-stone">
            Today at {data.property.name} · {formatDateLong(data.today)}
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            {money(data.todayCents)}
          </h1>
          <p className="mt-2 text-stone">
            Captured today, page and desk
            {data.pendingCents > 0 ? ` · ${money(data.pendingCents)} awaiting approval` : ""}
          </p>
        </div>
        {data.property.settings.isDemo ? (
          <Link to="/stay/$token" params={{ token: "maya" }}>
            <Button variant="secondary">
              Open Maya’s stay
              <ArrowUpRight className="size-4" />
            </Button>
          </Link>
        ) : (
          <Link to="/desk">
            <Button variant="secondary">
              Check-in tablet
              <ArrowUpRight className="size-4" />
            </Button>
          </Link>
        )}
      </div>

      <p className="mt-8 text-xs uppercase tracking-[0.14em] text-stone">
        Pilot to date · since {formatDateLong(data.property.economics.launchedOn)} · bookings that saw offers
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Page revenue" value={money(data.pilotCents)} hint="paid or fulfilled" />
        <Stat
          label="Per booking"
          value={`$${data.revenuePerBooking.toFixed(2)}`}
          hint={`$${data.revenuePerNight.toFixed(2)} per occupied night`}
        />
        <Stat label="Attach rate" value={pctOf(data.attachRate)} hint="bookings that bought" />
        <Stat
          label="Top offer"
          value={data.topOffer?.name ?? "—"}
          hint={data.topOffer ? money(data.topOffer.cents) : undefined}
        />
      </dl>

      <section className="mt-6 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-medium">Funnel</h2>
          <Link to="/hotel/roi" className="text-sm text-stone hover:text-ink">
            {data.holdoutBookings} holdout bookings → measured lift
          </Link>
        </div>
        <p className="mt-1 text-sm text-stone">
          Each step is a subset of the one before, so no step can pass 100%.
        </p>
        <ol className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <FunnelStep label="Bookings" value={f.bookings} />
          <FunnelStep label="Reached" value={f.reached} share={f.bookings ? f.reached / f.bookings : 0} of="of bookings" />
          <FunnelStep label="Opened page" value={f.viewed} share={f.reached ? f.viewed / f.reached : 0} of="of reached" />
          <FunnelStep label="Bought" value={f.bought} share={f.viewed ? f.bought / f.viewed : 0} of="of openers" />
          <FunnelStep label="Revenue" value={money(f.pageRevenueCents, { compact: true })} />
        </ol>
      </section>

      <section className="mt-6 rounded-xl bg-pine p-5 text-pine-fg sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-medium">Guest journey · OTA bookings</h2>
          {data.property.settings.isDemo ? (
            <Link to="/hotel/email/$reservationId" params={{ reservationId: "res_maya" }} className="text-sm text-pine-fg/75 hover:text-pine-fg">
              See the booking email →
            </Link>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-pine-fg/75">
          Booking from an OTA → personalised booking email → personalised stay page → offer booked → this dashboard.
        </p>
        <ol className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <JourneyStep n={1} label="OTA bookings" value={data.journey.otaBookings.toLocaleString("en-US")} />
          <JourneyStep
            n={2}
            label="Emailed"
            value={data.journey.emailed.toLocaleString("en-US")}
            share={data.journey.otaBookings ? data.journey.emailed / data.journey.otaBookings : 0}
            of="of bookings"
          />
          <JourneyStep
            n={3}
            label="Opened page"
            value={data.journey.clicked.toLocaleString("en-US")}
            share={data.journey.emailed ? data.journey.clicked / data.journey.emailed : 0}
            of="of emailed"
          />
          <JourneyStep
            n={4}
            label="Booked offer"
            value={data.journey.booked.toLocaleString("en-US")}
            share={data.journey.clicked ? data.journey.booked / data.journey.clicked : 0}
            of="of visitors"
          />
          <JourneyStep n={5} label="Email revenue" value={money(data.journey.revenueCents)} />
        </ol>
        <p className="mt-5 text-xs text-pine-fg/70">
          Counted only when each step follows the one before: a page visit counts if it came from the
          email link, a purchase if it happened on that visit. Holdout bookings are excluded.
        </p>
      </section>

      <CaptureGatePanel gate={data.capture} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-medium">Needs a decision</h2>
            <Link to="/hotel/fulfillment" className="text-sm text-stone hover:text-ink">
              All orders
            </Link>
          </div>
          {data.pending.length === 0 ? (
            <p className="rounded-lg border border-line bg-cream px-4 py-8 text-sm text-stone">
              No pending requests. Instant-purchase offers settle on their own.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.pending.map((order) => (
                <PendingCard key={order.id} order={order} onDecide={decide} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-medium">In house & arriving</h2>
            <Link to="/hotel/reservations" className="text-sm text-stone hover:text-ink">
              All stays
            </Link>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-lg bg-paper shadow-[var(--shadow-border)]">
            {data.arriving.map((res) => (
              <li key={res.id}>
                <Link
                  to="/stay/$token"
                  params={{ token: res.token }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-cream"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{res.guestName}</p>
                    <p className="truncate text-sm text-stone">
                      {stayRange(res.arrival, res.departure)} · {res.roomTypeName}
                    </p>
                  </div>
                  {res.holdout ? <Badge tone="quiet">Holdout</Badge> : null}
                  <StatusPill status={res.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-paper px-4 py-4 shadow-[var(--shadow-border)]">
      <dt className="text-xs uppercase tracking-[0.14em] text-stone">{label}</dt>
      <dd className="mt-2 truncate font-display text-2xl font-medium tabular-nums tracking-tight">
        {value}
      </dd>
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
    </div>
  );
}

function JourneyStep({
  n,
  label,
  value,
  share,
  of,
}: {
  n: number;
  label: string;
  value: string;
  share?: number;
  of?: string;
}) {
  return (
    <li>
      <p className="text-xs uppercase tracking-[0.14em] text-pine-fg/70">
        <span className="tabular-nums">{n}</span> · {label}
      </p>
      <p className="mt-1 font-display text-2xl font-medium tabular-nums">{value}</p>
      {share !== undefined ? (
        <p className="mt-1 text-xs text-pine-fg/75">
          {pctOf(share, share >= 0.1 ? 0 : 1)} {of}
        </p>
      ) : null}
    </li>
  );
}

function FunnelStep({
  label,
  value,
  share,
  of,
}: {
  label: string;
  value: string | number;
  share?: number;
  of?: string;
}) {
  return (
    <li>
      <p className="text-xs uppercase tracking-[0.14em] text-stone">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      {share !== undefined ? (
        <Badge tone="quiet" className="mt-2">
          {pctOf(share, share >= 0.1 ? 0 : 1)} {of}
        </Badge>
      ) : null}
    </li>
  );
}

const STEP_LABEL: Record<string, string> = {
  started: "Started",
  celebration: "Celebration asked",
  party: "Party step",
  code_sent: "Code sent",
  verified: "Contact verified",
  consented: "Opted in",
  completed: "Completed",
};

function CaptureGatePanel({ gate }: { gate: Awaited<ReturnType<typeof getDashboard>>["capture"] }) {
  if (!gate.launchedOn) return null;
  const evidence =
    gate.evidence === "too_few"
      ? { tone: "rose" as const, label: "Too early", note: "Fewer than 50 OTA check-ins since launch." }
      : gate.evidence === "directional"
        ? { tone: "amber" as const, label: "Directional", note: "Enough to see the direction; firm after ~300 OTA check-ins." }
        : { tone: "pine" as const, label: "Solid", note: "300+ OTA check-ins since launch." };
  const allPass = gate.gates.every((g) => g.pass);
  const maxStep = Math.max(1, ...gate.steps.map((s) => s.n));
  return (
    <section className="mt-6 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-medium">Contact capture · phase B gate</h2>
        <span className="flex items-center gap-2">
          <Badge tone={evidence.tone}>{evidence.label}</Badge>
          <Badge tone={allPass ? "pine" : "amber"}>{allPass ? "Gate passed" : "Not yet"}</Badge>
        </span>
      </div>
      <p className="mt-1 text-sm text-stone">
        Since {formatDateLong(gate.launchedOn)} · {gate.after.otaCompleted} OTA check-ins. {evidence.note}
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {gate.gates.map((g) => (
          <li key={g.id} className={g.pass ? "rounded-lg bg-moss px-4 py-3" : "rounded-lg bg-amber-soft px-4 py-3"}>
            <p className="text-xs uppercase tracking-[0.14em] text-stone">{g.label}</p>
            <p className="mt-1 font-display text-2xl font-medium tabular-nums">
              {g.id === "completion"
                ? `${g.value > 0 ? "−" : "+"}${Math.abs(g.value).toFixed(1)} pts`
                : `${g.value.toFixed(0)}%`}
            </p>
            <p className="text-xs text-stone">
              {g.target} · {g.pass ? "pass" : "below target"}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone">
        Check-in completion {gate.baseline.completionPct.toFixed(1)}% before launch ({gate.baseline.completed} of{" "}
        {gate.baseline.arrivals} arrivals) vs {gate.after.completionPct.toFixed(1)}% since ({gate.after.completed} of{" "}
        {gate.after.arrivals}). Own contact = verified by code; marketable = opted in to email or WhatsApp offers.
      </p>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-stone">Where guests drop off</summary>
        <ol className="mt-3 space-y-1.5">
          {gate.steps.map((s) => (
            <li key={s.step} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm">
              <span className="text-stone">{STEP_LABEL[s.step] ?? s.step}</span>
              <span className="h-2 rounded-full bg-cream">
                <span className="block h-2 rounded-full bg-pine" style={{ width: `${(s.n / maxStep) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{s.n}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-stone">
          Completed via {gate.bySource.map((b) => `${b.source === "desk_tablet" ? "desk tablet" : b.source === "qr" ? "QR" : "online"} ${b.n}`).join(" · ")}
        </p>
      </details>
    </section>
  );
}
