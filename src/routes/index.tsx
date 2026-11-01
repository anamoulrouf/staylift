import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { count, pctOf, usd } from "@/lib/staylift/format";
import {
  DEFAULT_INPUTS,
  PLANS,
  SCENARIOS,
  computeHotel,
  withScenario,
  type ScenarioId,
} from "@/lib/staylift/roi";
import { DEFAULT_STATE, encodeState } from "@/lib/staylift/roi-url";

export const Route = createFileRoute("/")({
  component: Landing,
});

const LOOP = [
  { title: "Booking from an OTA", body: "Booking.com, Expedia or Agoda — from a CSV or a forwarded confirmation. No PMS project." },
  { title: "Personalised booking email", body: "Sent automatically: confirmation, online check-in, and three offers picked for this stay, each with the reason." },
  { title: "Personalised stay page", body: "No app, no account. Leads with the same picks; one tap from the email opens the offer." },
  { title: "Offer booked", body: "Instant purchase, or a request the desk confirms. Charged only when confirmed." },
  { title: "Hotelier dashboard", body: "The order lands in Fulfillment; the journey funnel shows emailed → opened → booked → revenue." },
  { title: "Proof", body: "A random holdout gets check-in but no offers. The difference is the lift — not a vendor case study." },
];

function Landing() {
  const [rooms, setRooms] = useState(42);
  const [occ, setOcc] = useState(62);
  const [stay, setStay] = useState(2.1);
  const [scenario, setScenario] = useState<ScenarioId>("conservative");

  const inputs = useMemo(
    () =>
      withScenario(
        { ...DEFAULT_INPUTS, rooms, occupancyPct: occ, avgStayNights: stay },
        scenario,
      ),
    [rooms, occ, stay, scenario],
  );
  const math = useMemo(() => computeHotel(inputs, PLANS.A), [inputs]);
  const fullModel = encodeState({ ...DEFAULT_STATE, inputs });

  return (
    <div className="min-h-dvh bg-linen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Mark />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/roi">
            <Button variant="ghost" size="sm">
              ROI
            </Button>
          </Link>
          <Link to="/hotel">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/stay/$token" params={{ token: "maya" }}>
            <Button size="sm">
              Guest page
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-10 sm:pt-16 stagger-in">
          <p className="text-xs uppercase tracking-[0.2em] text-stone">
            For 20–80 room independent hotels
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-7xl">
            Upsell revenue you can prove.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-stone">
            Staylift sells the upgrades, breakfast and late checkout you already have through a
            no-app stay page — from a CSV or forwarded confirmations, no PMS project. Then it
            measures the lift against a holdout, so you pay for revenue that wouldn’t have
            happened anyway.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/stay/$token" params={{ token: "maya" }}>
              <Button size="lg">
                Try Maya’s stay
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/hotel">
              <Button size="lg" variant="secondary">
                Open the hotel desk
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-stone">
            Demo property: The Marlowe, 42 rooms, Austin. Live book, live orders, live
            attribution.
          </p>
        </section>

        <section className="border-y border-line bg-cream/60">
          <div className="mx-auto grid max-w-5xl gap-8 px-5 py-14 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-medium tracking-tight">
                The guest journey
              </h2>
              <p className="mt-3 text-stone">
                Marketplace, loyalty, CRM, and “AI matching” come later. If this loop does
                not print money, they should not exist.
              </p>
            </div>
            <ol className="space-y-5">
              {LOOP.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="w-8 shrink-0 font-mono text-sm text-mist">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-sm text-stone">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="font-display text-3xl font-medium tracking-tight">
            What it’s worth to you, after fees
          </h2>
          <p className="mt-3 max-w-xl text-stone">
            Net of what you’d have sold at the desk anyway (70% incremental), card fees and our
            price (plan A: $1/room/month + 7%). Not a 41× case study.
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <Slider label="Rooms" value={rooms} min={20} max={80} onChange={setRooms} />
              <Slider label="Occupancy %" value={occ} min={30} max={95} onChange={setOcc} />
              <Slider
                label="Average stay (nights)"
                value={stay}
                min={1}
                max={4}
                step={0.1}
                onChange={setStay}
              />
              <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Scenario">
                {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={scenario === id}
                    onClick={() => setScenario(id)}
                    className={
                      scenario === id
                        ? "h-10 rounded-full bg-pine px-4 text-sm text-pine-fg"
                        : "h-10 rounded-full bg-paper px-4 text-sm shadow-[var(--shadow-border)]"
                    }
                  >
                    {SCENARIOS[id].label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-stone">{SCENARIOS[scenario].blurb}</p>
            </div>
            <div className="rounded-xl bg-pine p-6 text-pine-fg">
              <p className="text-xs uppercase tracking-[0.18em] text-pine-fg/70">
                Hotel net gain per year · {SCENARIOS[scenario].label.toLowerCase()}
              </p>
              <p className="mt-4 font-display text-5xl font-medium tabular-nums">
                {usd(math.hotelNet, { sign: true })}
              </p>
              <p className="mt-2 text-sm text-pine-fg/80">
                {math.totalCost > 0 ? `${Math.round(math.roi * 100)}% ROI on fees and card costs` : ""}
              </p>
              <dl className="mt-8 space-y-2 text-sm">
                <Row k="Bookings a year" v={count(math.bookings)} />
                <Row k={`Buying bookings (${pctOf(math.conversionOfReachable)} of reachable)`} v={count(math.buyers)} />
                <Row k="Upsell revenue" v={usd(math.gross)} />
                <Row k="Incremental × 60% margin" v={usd(math.incrementalContribution)} />
                <Row k="Staylift + card fees" v={`−${usd(math.totalCost)}`} />
              </dl>
              <Link to="/roi" search={fullModel}>
                <Button variant="secondary" className="mt-6 w-full">
                  Open the full ROI calculator
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-cream/60">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="font-display text-3xl font-medium tracking-tight">
              Walk the product
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Walk
                to="/stay/$token"
                params={{ token: "maya" }}
                kicker="Upcoming · OTA"
                title="Maya Chen"
                body="Just booked a Standard. Upgrade, breakfast, transfer. Capture her real email at check-in."
              />
              <Walk
                to="/stay/$token"
                params={{ token: "sofia" }}
                kicker="Departing · request"
                title="Sofia Alves"
                body="Late checkout is waiting on the desk. Approve it in Fulfillment and watch revenue move."
              />
              <Walk
                to="/hotel/email/$reservationId"
                params={{ reservationId: "res_elena" }}
                kicker="Booking email"
                title="Elena Rossi"
                body="Booked direct, celebrating, flying in. Her email leads with breakfast, an airport car and the spa — and says why."
              />
              <Walk
                to="/hotel/fulfillment"
                kicker="Staff queue"
                title="Fulfillment"
                body="Spa and late checkout need a human. Breakfast does not. That distinction is the product."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-sm text-stone">
          <Mark />
          <p>Built for 20–80 room independent hotels. Not a guest-experience suite.</p>
        </div>
      </footer>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span className="text-stone">{label}</span>
        <span className="tabular-nums">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-11 w-full accent-pine"
      />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-pine-fg/70">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

function Walk({
  to,
  params,
  kicker,
  title,
  body,
}: {
  to: "/stay/$token" | "/hotel/fulfillment" | "/hotel/email/$reservationId";
  params?: { token: string } | { reservationId: string };
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      params={params}
      className="rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-lift)]"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-stone">{kicker}</p>
      <p className="mt-2 font-display text-2xl font-medium">{title}</p>
      <p className="mt-2 text-sm text-stone">{body}</p>
    </Link>
  );
}
