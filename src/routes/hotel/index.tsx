import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Clock,
  Eye,
  EyeOff,
  MailWarning,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { decideOrder, getDashboard, getOverviewExtras, sendStayLink } from "@/lib/staylift/server";
import {
  formatDateLong,
  money,
  pctOf,
  stayRange,
} from "@/lib/staylift/format";
import type { OpenOfferGuest, SeriesBucket } from "@/lib/staylift/queries.ts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hotel/")({
  loader: async () => {
    const [data, extras] = await Promise.all([getDashboard(), getOverviewExtras()]);
    return { data, extras };
  },
  component: Overview,
});

type AttachPoint = SeriesBucket & { attach: number };

function Overview() {
  const { data, extras } = Route.useLoaderData();
  const router = useRouter();

  async function decide(orderId: string, decision: "approve" | "decline") {
    try {
      await decideOrder({ data: { orderId, decision } });
      toast.success(decision === "approve" ? "Approved. Payment captured." : "Declined. Guest notified.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update order.");
    }
  }

  const f = data.funnel;
  const totalViews = extras.viewSources.reduce((s, v) => s + v.n, 0);
  const emailViews = extras.viewSources.find((v) => v.source === "email")?.n ?? 0;
  const emailShare = totalViews ? emailViews / totalViews : 0;

  return (
    <div className="stagger-in">
      {/* greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-stone">{formatDateLong(data.today)}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-[42px]">
            Welcome back.
          </h1>
          <p className="mt-2 text-stone">
            {data.pendingCents > 0
              ? `${money(data.pendingCents)} in requests are waiting on the desk.`
              : "Nothing is waiting on the desk."}
          </p>
        </div>
        {data.property.settings.isDemo ? (
          <Link to="/stay/$token" params={{ token: "maya" }}>
            <Button variant="secondary">
              Open Maya's stay
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

      {/* three-column module grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* left rail of cards */}
        <div className="flex min-w-0 flex-col gap-4">
          <RevenueHero
            cents={data.pilotCents}
            todayCents={data.todayCents}
            rooms={data.property.rooms}
            city={data.property.city}
            since={formatDateLong(data.property.economics.launchedOn)}
          />
          <WeeklyRevenue thisWeekCents={extras.weekly.thisWeekCents} prevWeekCents={extras.weekly.prevWeekCents} />
          <TopOffers offers={extras.topOffers} />
        </div>

        {/* center column */}
        <div className="flex min-w-0 flex-col gap-4">
          <AttachChartCard weekly={extras.series.weekly} monthly={extras.series.monthly} />
          <RequestsFeed
            pending={data.pending.map((o) => ({
              id: o.id,
              guestName: o.guestName,
              offerName: o.offerName,
              forDate: o.forDate,
              forTime: o.forTime,
              amountCents: o.amountCents,
              locked: o.approvableFrom !== null,
              approvableFrom: o.approvableFrom,
            }))}
            onDecide={decide}
          />
        </div>

        {/* right rail */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2 xl:col-span-1">
          <OpenOffersCard extras={extras} />
          <ChannelShareCard channel={extras.channel} />
          <NeedsAttentionCard attention={extras.attention} pendingCents={data.pendingCents} />
        </div>
      </div>

      {/* annotated funnel */}
      <section className="mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Funnel</h2>
          <Link to="/hotel/roi" className="text-sm text-stone hover:text-ink">
            {data.holdoutBookings} holdout bookings → measured lift
          </Link>
        </div>
        <p className="mt-1 text-sm text-stone">
          Each step is a subset of the one before, so no step can pass 100%.
        </p>
        <ol className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <FunnelStep label="Bookings" value={f.bookings} note="treatment, since launch" />
          <FunnelStep
            label="Reached"
            value={f.reached}
            share={f.bookings ? f.reached / f.bookings : 0}
            of="of bookings"
            note={f.bookings ? `${pctOf(f.bookings ? f.reached / f.bookings : 0, 0)} reachable by email or WhatsApp` : undefined}
          />
          <FunnelStep
            label="Opened page"
            value={f.viewed}
            share={f.reached ? f.viewed / f.reached : 0}
            of="of reached"
            note={totalViews ? `${pctOf(emailShare, 0)} of page visits come from the booking email` : undefined}
          />
          <FunnelStep
            label="Bought"
            value={f.bought}
            share={f.viewed ? f.bought / f.viewed : 0}
            of="of openers"
            note={data.topOffer ? `top claim: ${data.topOffer.name}` : undefined}
          />
          <FunnelStep label="Revenue" value={money(f.pageRevenueCents, { compact: true })} note="desk sales tracked separately" />
        </ol>
      </section>

      {/* guest journey */}
      <section className="mt-4 rounded-2xl bg-pine p-5 text-pine-fg sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Guest journey · OTA bookings</h2>
          {data.property.settings.isDemo ? (
            <Link
              to="/hotel/email/$reservationId"
              params={{ reservationId: "res_maya" }}
              className="text-sm text-pine-fg/75 hover:text-pine-fg"
            >
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

      {/* arriving list */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">In house & arriving</h2>
          <Link to="/hotel/reservations" className="text-sm text-stone hover:text-ink">
            All stays
          </Link>
        </div>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]">
          {data.arriving.length === 0 ? (
            <li className="px-5 py-8 text-sm text-stone">No arrivals in the next three days.</li>
          ) : null}
          {data.arriving.map((res) => (
            <li key={res.id}>
              <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream">
                <Link
                  to="/stay/$token"
                  params={{ token: res.token }}
                  className="flex min-w-0 flex-1 items-center gap-3"
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
                <Link
                  to="/hotel/fulfillment"
                  search={{ guest: res.id }}
                  className="shrink-0 text-xs text-stone underline-offset-2 hover:text-ink hover:underline"
                >
                  Log sale
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- left cards */

function RevenueHero({
  cents,
  todayCents,
  rooms,
  city,
  since,
}: {
  cents: number;
  todayCents: number;
  rooms: number;
  city: string;
  since: string;
}) {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem("staylift-hide-amounts") === "1";
    } catch {
      return false;
    }
  });

  function toggleHidden() {
    setHidden((v) => {
      try {
        localStorage.setItem("staylift-hide-amounts", v ? "0" : "1");
      } catch {
        /* private mode: the toggle just won't persist */
      }
      return !v;
    });
  }
  const month = new Date().toLocaleDateString("en-US", { month: "long" });
  return (
    <section className="hotel-hero relative overflow-hidden rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-pine-fg/70">
            Upsell revenue · since {since}
          </p>
          <p
            className={cn(
              "mt-2 font-display text-[40px] font-semibold leading-none tabular-nums",
              hidden && "select-none blur-sm",
            )}
          >
            {money(cents)}
          </p>
          <p className="mt-2 text-sm text-pine-fg/75">
            {rooms} rooms · {city}
          </p>
        </div>
        <button
          type="button"
          aria-label={hidden ? "Show amounts" : "Hide amounts"}
          onClick={toggleHidden}
          className="rounded-lg p-1.5 text-pine-fg/70 transition-opacity hover:bg-white/10 hover:text-pine-fg"
        >
          {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-sm text-pine-fg/85">
        <span>
          Captured today{" "}
          <b className={cn("font-semibold tabular-nums", hidden && "select-none blur-sm")}>{money(todayCents)}</b>
        </span>
        <span>{month}</span>
      </div>
    </section>
  );
}

function WeeklyRevenue({ thisWeekCents, prevWeekCents }: { thisWeekCents: number; prevWeekCents: number }) {
  const delta = prevWeekCents > 0 ? ((thisWeekCents - prevWeekCents) / prevWeekCents) * 100 : null;
  return (
    <section className="rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      <p className="text-[11px] uppercase tracking-[0.14em] text-stone">Last 7 days</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-display text-2xl font-semibold tabular-nums">{money(thisWeekCents)}</p>
        {delta !== null ? <DeltaChip value={delta} /> : null}
      </div>
      <p className="mt-1 text-xs text-stone">
        {prevWeekCents > 0 ? "vs the previous 7 days" : "no paid orders the week before"}
      </p>
    </section>
  );
}

function TopOffers({ offers }: { offers: { name: string; cents: number; n: number }[] }) {
  return (
    <section className="rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold">Top offers</h2>
        <Link to="/hotel/analytics" className="text-xs text-stone hover:text-ink">
          All
        </Link>
      </div>
      {offers.length === 0 ? (
        <p className="mt-3 text-sm text-stone">No paid orders yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {offers.map((o) => (
            <li key={o.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 truncate">{o.name}</span>
              <span className="shrink-0 text-stone">
                <span className="tabular-nums text-pine">{o.n}</span> claims
              </span>
              <span className="w-14 shrink-0 text-right tabular-nums">{money(o.cents, { compact: true })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ----------------------------------------------------------- center cards */

function AttachChartCard({ weekly, monthly }: { weekly: SeriesBucket[]; monthly: SeriesBucket[] }) {
  const [granularity, setGranularity] = useState<"weekly" | "monthly">("weekly");
  const source = granularity === "weekly" ? weekly : monthly;
  const data: AttachPoint[] = source.map((d) => ({ ...d, attach: d.bookings ? d.bought / d.bookings : 0 }));
  const peakIdx = data.reduce(
    (best, d, i) => (d.bookings > 0 && d.attach > (data[best]?.attach ?? -1) ? i : best),
    0,
  );
  const peak = data[peakIdx];
  const prev = peakIdx > 0 ? data[peakIdx - 1] : null;
  const peakDeltaPts = peak && prev && prev.bookings > 0 ? (peak.attach - prev.attach) * 100 : null;
  const totalRevenue = data.reduce((s, d) => s + d.revenueCents, 0);
  const hasData = data.some((d) => d.bookings > 0);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-semibold">Attach rate</h2>
          {peakDeltaPts !== null && isFinite(peakDeltaPts) ? (
            <span className="rounded-full bg-moss px-2 py-0.5 text-xs font-semibold tabular-nums text-pine">
              {peakDeltaPts >= 0 ? "+" : "−"}
              {Math.abs(peakDeltaPts).toFixed(1)} pts vs prior
            </span>
          ) : null}
        </div>
        <div className="flex rounded-full bg-cream p-1">
          {(["weekly", "monthly"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                granularity === g ? "bg-paper text-ink shadow-[var(--shadow-border)]" : "text-stone hover:text-ink",
              )}
            >
              {g === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>
      {hasData ? (
        <div className="mt-4 h-56 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#6f675e", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                tickMargin={8}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                tick={{ fill: "#6f675e", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                cursor={{ fill: "rgba(196, 85, 46, 0.07)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as AttachPoint;
                  return (
                    <div className="rounded-xl border border-line bg-paper px-3 py-2 text-xs shadow-[var(--shadow-border)]">
                      <p className="font-medium text-ink">{d.label}</p>
                      <p className="text-stone">
                        {d.bought} of {d.bookings} bookings bought · {pctOf(d.attach, 1)}
                      </p>
                      <p className="text-stone">{money(d.revenueCents)} paid</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="attach" radius={[14, 14, 0, 0]} barSize={30}>
                {data.map((d, i) => (
                  <Cell
                    key={d.bucket}
                    fill="var(--series-a)"
                    fillOpacity={i === peakIdx && d.bookings > 0 ? 1 : 0.16}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-6 px-1 pb-4 text-sm text-stone">
          No bookings with offers since launch yet — the chart fills as the book arrives.
        </p>
      )}
      <p className="mt-3 text-xs text-stone">
        Share of bookings arriving in each {granularity === "weekly" ? "week" : "month"} that bought at
        least one extra · {money(totalRevenue)} paid on those stays.
      </p>
    </section>
  );
}

type FeedRequest = {
  id: string;
  guestName: string;
  offerName: string;
  forDate: string | null;
  forTime: string | null;
  amountCents: number;
  locked: boolean;
  approvableFrom: string | null;
};

function RequestsFeed({
  pending,
  onDecide,
}: {
  pending: FeedRequest[];
  onDecide: (id: string, decision: "approve" | "decline") => void;
}) {
  return (
    <section className="rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Booking requests</h2>
          <p className="mt-0.5 text-sm text-stone">Guest requests waiting for your response</p>
        </div>
        <Link to="/hotel/fulfillment" className="text-sm text-stone hover:text-ink">
          View all
        </Link>
      </div>
      {pending.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cream px-4 py-6 text-sm text-stone">
          Queue is clear. Instant-purchase offers settle on their own.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {pending.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-semibold text-stone">
                {o.guestName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {o.guestName}
                  <span className="ml-2 font-normal text-stone">{money(o.amountCents)}</span>
                </p>
                <p className="truncate text-xs text-stone">
                  {o.offerName}
                  {o.forTime ? ` · ${o.forTime}` : ""}
                  {o.forDate ? ` · ${o.forDate}` : ""}
                </p>
              </div>
              {o.locked ? (
                <Badge tone="amber">
                  <Clock className="mr-1 size-3" /> Opens {o.approvableFrom}
                </Badge>
              ) : (
                <Badge tone="amber">Pending</Badge>
              )}
              <div className="flex gap-1.5">
                <Button size="sm" disabled={o.locked} onClick={() => onDecide(o.id, "approve")}>
                  <Check className="size-3.5" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDecide(o.id, "decline")}>
                  <X className="size-3.5" />
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ right cards */

function OpenOffersCard({ extras }: { extras: Awaited<ReturnType<typeof getOverviewExtras>> }) {
  const { openOffers } = extras;
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function send(guest: OpenOfferGuest) {
    setBusyId(guest.reservationId);
    try {
      await sendStayLink({ data: { reservationId: guest.reservationId, channel: "email" } });
      toast.success(`Stay link sent to ${guest.guestName}.`);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the stay link.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Open offer value</h2>
          <p className="mt-0.5 text-xs text-stone">Reserved for arriving guests</p>
        </div>
        {openOffers.guestCount > 0 ? (
          <AvatarStack names={openOffers.guests.slice(0, 5).map((g) => g.guestName)} />
        ) : null}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{money(openOffers.totalCents)}</p>
      {openOffers.guestCount === 0 ? (
        <p className="mt-2 text-sm text-stone">
          Every stay in the book has its picks claimed — or the book is quiet right now.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-stone">
            {openOffers.guestCount} guest{openOffers.guestCount === 1 ? "" : "s"} with unclaimed picks
          </p>
          <ul className="mt-3 divide-y divide-line">
            {openOffers.guests.slice(0, 3).map((g) => (
              <li key={g.reservationId} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.guestName}</p>
                  <p className="truncate text-xs text-stone">
                    {g.arrival} · {g.offers.map((o) => o.name).join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  title={`Send ${g.guestName} their stay link`}
                  aria-label={`Send ${g.guestName} their stay link`}
                  disabled={busyId === g.reservationId}
                  onClick={() => void send(g)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-moss text-pine transition-colors hover:bg-pine hover:text-pine-fg disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          {openOffers.guestCount > 3 ? (
            <p className="mt-2 text-xs text-stone">+{openOffers.guestCount - 3} more guests</p>
          ) : null}
        </>
      )}
    </section>
  );
}

function ChannelShareCard({ channel }: { channel: { guestPageCents: number; deskCents: number; guestPageOrders: number; deskOrders: number } }) {
  const total = channel.guestPageCents + channel.deskCents;
  const share = total ? channel.guestPageCents / total : 0;
  return (
    <section className="rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-lg font-semibold">Stay-page share</h2>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-display text-3xl font-semibold tabular-nums">{pctOf(share, 0)}</p>
        <span className="text-xs text-stone">of upsell revenue</span>
      </div>
      <div className="mt-3 flex h-3 gap-[2px] overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-l-full bg-[var(--series-a)]" style={{ width: `${Math.max(share * 100, total ? 3 : 0)}%` }} />
        <div className="h-full flex-1 rounded-r-full bg-line" />
      </div>
      <dl className="mt-3 space-y-1 text-xs text-stone">
        <div className="flex justify-between">
          <dt className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--series-a)]" /> Guests buy on the stay page
          </dt>
          <dd className="tabular-nums">
            {money(channel.guestPageCents, { compact: true })} · {channel.guestPageOrders}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-line" /> Desk and phone sales
          </dt>
          <dd className="tabular-nums">
            {money(channel.deskCents, { compact: true })} · {channel.deskOrders}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-stone">Desk sales keep the holdout baseline honest.</p>
    </section>
  );
}

function NeedsAttentionCard({
  attention,
  pendingCents,
}: {
  attention: { pendingCount: number; expiringCount: number; expiringCents: number; bouncedCount: number };
  pendingCents: number;
}) {
  const rows = [
    {
      show: attention.pendingCount > 0,
      icon: ClipboardList,
      text: `${attention.pendingCount} request${attention.pendingCount === 1 ? "" : "s"} need a decision · ${money(pendingCents)}`,
      to: "/hotel/fulfillment" as const,
    },
    {
      show: attention.expiringCount > 0,
      icon: Clock,
      text: `${money(attention.expiringCents)} in unclaimed picks on stays starting within 3 days`,
      to: "/hotel/reservations" as const,
    },
    {
      show: attention.bouncedCount > 0,
      icon: MailWarning,
      text: `${attention.bouncedCount} bounced message${attention.bouncedCount === 1 ? "" : "s"} to chase`,
      to: "/hotel/reservations" as const,
    },
  ].filter((r) => r.show);

  return (
    <section className="rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-lg font-semibold">Needs attention</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone">Nothing needs you. The desk is clear.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <li key={r.text}>
                <Link to={r.to} className="flex items-start gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-cream">
                  <Icon className="mt-0.5 size-4 shrink-0 text-amber" strokeWidth={1.75} />
                  <span className="flex-1 text-ink">{r.text}</span>
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-stone" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- shared */

function AvatarStack({ names }: { names: string[] }) {
  const init = (n: string) =>
    n
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  return (
    <div className="flex shrink-0">
      {names.slice(0, 4).map((n, i) => (
        <span
          key={i}
          title={n}
          className="-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-paper bg-moss text-[10px] font-semibold text-pine first:ml-0"
        >
          {init(n)}
        </span>
      ))}
      {names.length > 4 ? (
        <span className="-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-paper bg-cream text-[10px] font-semibold text-stone">
          +{names.length - 4}
        </span>
      ) : null}
    </div>
  );
}

function DeltaChip({ value }: { value: number }) {
  if (!isFinite(value)) return null;
  const up = value >= 0;
  return (
    <Badge tone={up ? "good" : "rose"}>
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  );
}

/* ------------------------------------------- carried-over lower sections */

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
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
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
  note,
}: {
  label: string;
  value: string | number;
  share?: number;
  of?: string;
  note?: string;
}) {
  return (
    <li>
      <p className="text-xs uppercase tracking-[0.14em] text-stone">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      {share !== undefined ? (
        <Badge tone="quiet" className="mt-2">
          {pctOf(share, share >= 0.1 ? 0 : 1)} {of}
        </Badge>
      ) : null}
      {note ? <p className="mt-1.5 text-xs leading-snug text-stone">{note}</p> : null}
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
        : { tone: "good" as const, label: "Solid", note: "300+ OTA check-ins since launch." };
  const allPass = gate.gates.every((g) => g.pass);
  const maxStep = Math.max(1, ...gate.steps.map((s) => s.n));
  return (
    <section className="mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">Contact capture · phase B gate</h2>
        <span className="flex items-center gap-2">
          <Badge tone={evidence.tone}>{evidence.label}</Badge>
          <Badge tone={allPass ? "good" : "amber"}>{allPass ? "Gate passed" : "Not yet"}</Badge>
        </span>
      </div>
      <p className="mt-1 text-sm text-stone">
        Since {formatDateLong(gate.launchedOn)} · {gate.after.otaCompleted} OTA check-ins. {evidence.note}
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {gate.gates.map((g) => (
          <li key={g.id} className={g.pass ? "rounded-xl bg-[#e2f1e8] px-4 py-3" : "rounded-xl bg-amber-soft px-4 py-3"}>
            <p className="text-xs uppercase tracking-[0.14em] text-stone">{g.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
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
                <span
                  className="block h-2 rounded-full bg-pine"
                  style={{ width: `${(s.n / maxStep) * 100}%` }}
                />
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
