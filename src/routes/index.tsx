import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Mark } from "@/components/mark";
import { SiteNav } from "@/components/site-nav";
import { CountUp, MaskLines, Reveal } from "@/components/landing/reveal";
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

const HERO_LINES = ["Upsell", "Revenue", "You can prove."];

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
    <div className="landing-scope min-h-dvh bg-paper font-sans text-ink">
      <SiteNav
        overDark
        links={(dark) => (
          <>
            <Link
              to="/roi"
              className={dark ? "hidden text-sm text-white/80 hover:text-white md:inline-block" : "hidden text-sm text-stone hover:text-ink md:inline-block"}
            >
              ROI
            </Link>
            <Link
              to="/hotel"
              className={dark ? "hidden text-sm text-white/80 hover:text-white md:inline-block" : "hidden text-sm text-stone hover:text-ink md:inline-block"}
            >
              <span className="sm:hidden">Dashboard</span>
              <span className="hidden sm:inline">Open the dashboard</span>
            </Link>
            <Link
              to="/stay/$token"
              params={{ token: "maya" }}
              className={dark ? "fd-pill fd-pill--white" : "fd-pill fd-pill--charcoal"}
            >
              Guest demo
              <span className="fd-pill-arrow">
                <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
          </>
        )}
      />

      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="fd-dark relative min-h-dvh overflow-hidden bg-[var(--fd-black)] text-white">
        <img
          src="/img/foundation/homerender-desktop.jpg"
          width={2783}
          height={1863}
          alt="Isometric render of a hotel property"
          fetchPriority="high"
          className="fd-zoom absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/45" />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-24 sm:px-8 sm:pb-10">
          <MaskLines lines={HERO_LINES} />
          <h1 className="mt-6 max-w-xl text-xl font-normal leading-snug tracking-[-0.01em] sm:text-2xl">
            Unlocking upsell revenue for{" "}
            <span className="font-bold">20–80 room independent hotels</span>
          </h1>
          <p className="mt-3 text-sm text-white/70">
            Demo property: The Marlowe, 42 rooms, Austin. Live book, live orders, live
            attribution.
          </p>
          {/* mobile CTAs — Foundation hides the desktop violet bar below 768px */}
          <div className="mt-6 flex flex-wrap gap-3 md:hidden">
            <Link to="/hotel" className="fd-pill fd-pill--violet">
              Open the desk
              <span className="fd-pill-arrow">
                <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
            <Link to="/roi" className="fd-pill fd-pill--white">
              Run your numbers
              <span className="fd-pill-arrow">
                <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
          </div>
        </div>

        <Link to="/hotel" className="fd-bar absolute bottom-0 right-0 hidden w-[33vw] md:flex">
          <span className="fd-bar-label uppercase">Open the hotel desk</span>
          <span className="fd-bar-arrow">
            <ArrowUpRight className="size-5" />
          </span>
        </Link>
      </section>

      <main>
        {/* ── the loop — full-bleed render background ─────────────────── */}
        <section className="relative overflow-hidden bg-white text-ink">
          <img
            src="/img/foundation/rental-1.jpg"
            width={2267}
            height={1600}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 size-full object-cover object-right"
          />
          <div className="relative w-full px-5 py-24 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-xl bg-white/70 p-6 backdrop-blur-sm md:bg-transparent md:p-0 md:backdrop-blur-none">
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                  The loop
                </p>
                <p className="mt-6 text-[17px] leading-[1.4] text-stone">
                  Staylift sells the upgrades, breakfast and late checkout you already have
                  through a no-app stay page — from a CSV or forwarded confirmations, no PMS
                  project. Then it measures the lift against a holdout, so you pay for revenue
                  that wouldn’t have happened anyway.
                </p>
                <ol className="mt-12 space-y-6">
                  {[LOOP[1], LOOP[2], LOOP[3], LOOP[5]].map((step, i) => (
                    <li key={step.title} className="flex gap-5 border-t border-ink/15 pt-5">
                      <span className="font-mono text-sm text-stone">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="fd-display text-lg sm:text-xl">{step.title}</p>
                        <p className="mt-1.5 text-sm text-stone">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link to="/roi" className="fd-pill fd-pill--charcoal mt-10">
                  Run your numbers
                  <span className="fd-pill-arrow">
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── pillars ─────────────────────────────────────────────────── */}
        <Pillar
          img="/img/foundation/rental-apartment.jpg"
          imgAlt="Render of a rental apartment building"
          titleA="Stay"
          titleB="Page"
          chips={["No app", "No account", "One tap from the email"]}
          specs={[
            { k: "Guests", v: "No app, no account — the page just opens" },
            { k: "Offers", v: "Three picks for this stay, each with the reason" },
            { k: "Entry", v: "One tap from the booking email" },
          ]}
        />
        <Pillar
          img="/img/foundation/rental-3.jpg"
          imgAlt="Render of modern houses on a green base"
          titleA="Desk"
          titleB="Queue"
          chips={["Instant vs approval", "Human judgment", "Fulfillment funnel"]}
          specs={[
            { k: "Instant", v: "Breakfast buys on the spot" },
            { k: "Approval", v: "Spa and late checkout need a human" },
            { k: "Queue", v: "Orders land in Fulfillment" },
          ]}
        />
        <Pillar
          img="/img/foundation/rental-2.jpg"
          imgAlt="Render of a brick house with a dark roof"
          titleA="Measured"
          titleB="Lift"
          chips={["Holdout baseline", "Net of fees", "Not a case study"]}
          specs={[
            { k: "Holdout", v: "A random slice gets check-in, no offers" },
            { k: "Lift", v: "The difference — not a vendor case study" },
            { k: "Fees", v: "Net of card costs and our price" },
          ]}
        />

        {/* ── the point — manifesto + demo-book numbers ───────────────── */}
        <section className="bg-[var(--fd-violet)] text-white">
          <div className="w-full px-5 py-24 sm:px-8 lg:px-12 xl:px-16">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1a1a1a]">
                The point
              </p>
              <h2 className="fd-display fd-mid-line mt-8 max-w-4xl">
                Marketplace, loyalty, CRM, and AI matching
              </h2>
              <p className="mt-6 text-lg text-white/90">
                If this loop does not print money, they should not exist.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Stat
                tone="white"
                value={<CountUp to={87} suffix="%" />}
                label="of upsell revenue bought on the stay page"
              />
              <Stat
                tone="blue"
                value={<CountUp to={561} />}
                label="treatment bookings since launch"
              />
              <Stat
                tone="green"
                value={<CountUp to={2.3} prefix="$" suffix="k" decimals={1} />}
                label="captured on stay pages"
              />
              <Stat
                tone="charcoal"
                value={<CountUp to={2} />}
                label="messages per booking — hard cap"
              />
              <Stat tone="concrete" value="01" label="mission: revenue you can prove" />
            </div>

            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]">
              From the live demo book · The Marlowe, Austin
            </p>
          </div>
        </section>

        {/* ── ROI teaser — full width on desktop ──────────────────────── */}
        <section className="bg-linen text-ink">
          <div className="w-full px-5 py-24 sm:px-8 lg:px-12 xl:px-16">
            <Reveal>
              <MaskLines lines={["Worth", "After fees."]} className="fd-mid-line" />
              <p className="mt-6 max-w-xl text-stone">
                Net of what you’d have sold at the desk anyway (70% incremental), card fees
                and our price (plan A: $1/room/month + 7%). Not a 41× case study.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-12 lg:grid-cols-2">
              <Reveal className="space-y-6">
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
                          ? "h-10 bg-[var(--fd-charcoal)] px-4 text-sm font-medium text-white"
                          : "h-10 bg-[var(--fd-concrete)] px-4 text-sm text-ink hover:bg-[#e2e6ec]"
                      }
                    >
                      {SCENARIOS[id].label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-stone">{SCENARIOS[scenario].blurb}</p>
              </Reveal>
              <Reveal delay={100}>
                <div className="fd-dark flex h-full flex-col bg-[var(--fd-charcoal)] p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                    Hotel net gain per year · {SCENARIOS[scenario].label.toLowerCase()}
                  </p>
                  <p className="fd-display mt-6 text-6xl tabular-nums sm:text-7xl">
                    {usd(math.hotelNet, { sign: true })}
                  </p>
                  <p className="mt-3 text-sm text-white/70">
                    {math.totalCost > 0 ? `${Math.round(math.roi * 100)}% ROI on fees and card costs` : ""}
                  </p>
                  <dl className="mt-auto space-y-2 pt-10 text-sm">
                    <Row k="Bookings a year" v={count(math.bookings)} />
                    <Row k={`Buying bookings (${pctOf(math.conversionOfReachable)} of reachable)`} v={count(math.buyers)} />
                    <Row k="Upsell revenue" v={usd(math.gross)} />
                    <Row k="Incremental × 60% margin" v={usd(math.incrementalContribution)} />
                    <Row k="Staylift + card fees" v={`−${usd(math.totalCost)}`} />
                  </dl>
                  <Link to="/roi" search={fullModel} className="fd-bar mt-8 flex w-full">
                    <span className="fd-bar-label uppercase">Open the full ROI calculator</span>
                    <span className="fd-bar-arrow">
                      <ArrowRight className="size-5" />
                    </span>
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── demo index ──────────────────────────────────────────────── */}
        <section className="bg-paper text-ink">
          <div className="w-full px-5 py-24 sm:px-8 lg:px-12 xl:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
              Walk the product
            </p>
            <div className="mt-8">
              <DemoRow
                no="01"
                title="Maya stay"
                note="Upcoming · OTA — upgrade, breakfast, transfer"
                to="/stay/$token"
                params={{ token: "maya" }}
              />
              <DemoRow
                no="02"
                title="Sofia stay"
                note="Departing · request — late checkout on the desk"
                to="/stay/$token"
                params={{ token: "sofia" }}
              />
              <DemoRow
                no="03"
                title="Elena email"
                note="Booking email — leads with breakfast, an airport car and the spa"
                to="/hotel/email/$reservationId"
                params={{ reservationId: "res_elena" }}
              />
              <DemoRow
                no="04"
                title="Fulfillment"
                note="Staff queue — spa and late checkout need a human"
                to="/hotel/fulfillment"
              />
            </div>
          </div>
        </section>

        {/* ── CTA — full-bleed dusk render ────────────────────────────── */}
        <section className="fd-dark relative overflow-hidden bg-[var(--fd-charcoal)] text-white">
          <img
            src="/img/foundation/cta.jpg"
            width={2784}
            height={1563}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/20" />
          <div className="relative w-full px-5 py-28 sm:px-8 lg:px-12 xl:px-16">
            <MaskLines lines={["See it", "live."]} />
            <p className="mt-6 max-w-xl text-white/80">
              The Marlowe is running right now — live book, live orders, live attribution.
              Walk in as the hotelier, or check in as a guest.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/hotel" className="fd-pill fd-pill--violet h-12 px-6 text-base">
                Open the hotel desk
                <span className="fd-pill-arrow">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
              <Link to="/stay/$token" params={{ token: "maya" }} className="fd-pill fd-pill--white h-12 px-6 text-base">
                Guest demo
                <span className="fd-pill-arrow">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
              <Link
                to="/roi"
                className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                ROI calculator
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── footer — full-bleed render background ─────────────────────── */}
      <footer className="relative overflow-hidden bg-white text-ink">
        <img
          src="/img/foundation/footer.jpg"
          width={2267}
          height={1600}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 size-full object-cover object-right-bottom"
        />
        <div className="relative flex min-h-[80svh] flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-8 px-5 pt-16 sm:px-8 lg:px-12 xl:px-16">
            <nav className="space-y-2 text-[clamp(1.1rem,1.6vw,1.6rem)]">
              <p>
                <Link to="/roi" className="hover:underline">
                  ROI calculator
                </Link>
              </p>
              <p>
                <Link to="/hotel" className="hover:underline">
                  Hotel desk
                </Link>
              </p>
              <p>
                <Link to="/stay/$token" params={{ token: "maya" }} className="hover:underline">
                  Guest demo
                </Link>
              </p>
              <p className="pt-4 text-sm text-stone">
                The Marlowe, Austin — live demo book.
                <br />
                Not a guest-experience suite.
              </p>
            </nav>
          </div>
          <div className="px-5 pb-40 sm:px-8 lg:px-12 xl:px-16">
            <p className="fd-display fd-giant whitespace-nowrap">Staylift®</p>
          </div>
          <Link
            to="/hotel"
            className="fd-bar absolute bottom-16 right-0 z-20 hidden w-[30vw] md:flex"
          >
            <span className="fd-bar-label uppercase">Staylift® — Open the hotel desk</span>
            <span className="fd-bar-arrow">
              <ArrowUpRight className="size-5" />
            </span>
          </Link>
          <div className="relative flex flex-wrap justify-between gap-3 border-t border-ink/15 bg-white/80 px-5 py-6 text-xs text-stone backdrop-blur-sm sm:px-8 lg:px-12 xl:px-16">
            <p>© 2026 Staylift · Built for 20–80 room independent hotels. Not a guest-experience suite.</p>
            <p>Demo data: The Marlowe, Austin — live book, live orders. Imagery: placeholder renders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── pieces ──────────────────────────────────────────────────────────── */

function Stat({
  tone,
  value,
  label,
}: {
  tone: "white" | "blue" | "green" | "charcoal" | "concrete";
  value: React.ReactNode;
  label: string;
}) {
  return (
    <Reveal className={`fd-stat fd-stat--${tone}`}>
      <p className="fd-display text-[clamp(3rem,4.5vw,4.75rem)] leading-none">{value}</p>
      <p className="fd-stat-row text-sm">{label}</p>
    </Reveal>
  );
}

/**
 * Full-bleed light band: the render's own tinted backdrop carries the section,
 * copy sits left where the render leaves room, building right. No scrim —
 * these images are lit for it.
 */
function Pillar({
  img,
  imgAlt,
  titleA,
  titleB,
  chips,
  specs,
  imgPosition,
}: {
  img: string;
  imgAlt: string;
  titleA: string;
  titleB: string;
  chips: string[];
  specs: { k: string; v: string }[];
  imgPosition?: string;
}) {
  return (
    <section className="relative min-h-[80svh] overflow-hidden bg-linen text-ink">
      <img
        src={img}
        width={2267}
        height={1600}
        alt={imgAlt}
        loading="lazy"
        style={imgPosition ? { objectPosition: imgPosition } : undefined}
        className="absolute inset-0 size-full object-cover object-right"
      />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-16 sm:px-8 lg:px-12 xl:px-16">
        <MaskLines lines={[titleA, titleB]} className="fd-mid-line" />
        <div className="mt-6 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="fd-chip fd-chip--ink">
              {chip}
            </span>
          ))}
        </div>
        <Reveal className="mt-8 max-w-sm">
          <dl className="fd-spec fd-spec--ink space-y-3 text-sm">
            {specs.map((s) => (
              <div key={s.k} className="flex justify-between gap-6 pt-3 first:pt-0">
                <dt className="font-semibold uppercase tracking-wide">{s.k}</dt>
                <dd className="text-right text-stone">{s.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function DemoRow({
  no,
  title,
  note,
  to,
  params,
}: {
  no: string;
  title: string;
  note: string;
  to: "/stay/$token" | "/hotel/fulfillment" | "/hotel/email/$reservationId";
  params?: { token: string } | { reservationId: string };
}) {
  return (
    <Link
      to={to}
      params={params}
      className="fd-row group flex flex-wrap items-center justify-between gap-3 border-t border-line px-2 py-6 sm:px-4"
    >
      <span className="font-mono text-sm text-stone group-hover:text-white/60">{no}</span>
      <p className="fd-display min-w-0 flex-1 text-2xl sm:text-4xl">{title}</p>
      <p className="text-sm text-stone group-hover:text-white/70">{note}</p>
      <ArrowUpRight className="size-5 shrink-0 transition-transform duration-150 group-hover:-translate-y-1 group-hover:translate-x-1" />
    </Link>
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
        <span className="font-medium tabular-nums text-ink">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="fd-range mt-4"
      />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-white/15 pt-2">
      <dt className="text-white/60">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
