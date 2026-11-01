import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PendingCard } from "@/components/pending-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  decideOrder,
  listFulfillment,
  listOffers,
  listReservations,
  logDeskSale,
  refundOrder,
} from "@/lib/staylift/server";
import { formatDate, money, priceHint, stayRange } from "@/lib/staylift/format";
import { computeAmount, isNightly } from "@/lib/staylift/pricing";

export const Route = createFileRoute("/hotel/fulfillment")({
  // guest = prefill the desk-sale logger from an arrivals "Log sale" link.
  validateSearch: (search: Record<string, unknown>): { guest?: string } => {
    const out: { guest?: string } = {};
    if (typeof search.guest === "string" && search.guest.length <= 64) out.guest = search.guest;
    return out;
  },
  loader: async () => {
    const [orders, book, offerData] = await Promise.all([
      listFulfillment(),
      listReservations({ data: {} }),
      listOffers(),
    ]);
    return { ...orders, book, offers: offerData.offers };
  },
  component: RequestsPage,
});

function RequestsPage() {
  const { pending, awaiting, paid, book, offers, payments } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();

  const todayStats = useMemo(() => {
    const isToday = (iso: string | null) => Boolean(iso && new Date(iso).toDateString() === new Date().toDateString());
    const approvedToday = paid.filter((o) => isToday(o.paidAt));
    return {
      pendingCents: pending.reduce((s, o) => s + o.amountCents, 0),
      approvedToday: approvedToday.length,
      capturedTodayCents: approvedToday.reduce((s, o) => s + o.amountCents, 0),
    };
  }, [pending, paid]);

  async function decide(orderId: string, decision: "approve" | "decline") {
    try {
      const result = await decideOrder({ data: { orderId, decision } });
      toast.success(
        decision === "decline"
          ? "Request declined. Inventory released."
          : "awaitingPayment" in result && result.awaitingPayment
            ? "Approved — the guest pays from their stay page."
            : "Guest notified. Payment captured. Revenue recorded.",
      );
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function refund(orderId: string) {
    try {
      await refundOrder({ data: { orderId } });
      toast.success("Refunded — inventory released.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not refund.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl stagger-in">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Requests</h1>
      <p className="mt-2 max-w-2xl text-stone">
        Guest requests with approvals and the desk log. Staff see every purchase immediately, and
        the guest hears back if the house says no. Front-desk sales are logged here too — without
        them the holdout baseline reads as zero and the lift looks bigger than it is.
      </p>

      <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="Waiting on you" value={String(pending.length)} hint={`${money(todayStats.pendingCents)} in requests`} />
        <Kpi label="Approved today" value={String(todayStats.approvedToday)} hint="decisions captured" />
        <Kpi label="Captured today" value={money(todayStats.capturedTodayCents)} hint="page and desk" />
      </dl>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Pending review</h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-cream px-4 py-8 text-sm text-stone">
            Queue is clear.
          </p>
        ) : (
          <>
            {/* desktop table */}
            <div className="mt-3 hidden overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)] md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-[0.12em] text-stone">
                    <th className="px-5 py-3 font-medium">Guest</th>
                    <th className="px-3 py-3 font-medium">Request</th>
                    <th className="px-3 py-3 font-medium">Stay</th>
                    <th className="px-3 py-3 font-medium">Platform · booking ID</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pending.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-medium">{o.guestName}</td>
                      <td className="px-3 py-3">
                        {o.offerName}
                        <span className="block text-xs tabular-nums text-stone">{money(o.amountCents)}</span>
                      </td>
                      <td className="px-3 py-3 text-stone">{stayRange(o.arrival, o.departure)}</td>
                      <td className="px-3 py-3 text-stone">
                        {o.platform}
                        <span className="block text-xs">{o.bookingRef}</span>
                      </td>
                      <td className="px-3 py-3">
                        {o.approvableFrom ? (
                          <Badge tone="amber">Opens {o.approvableFrom}</Badge>
                        ) : (
                          <Badge tone="amber">Pending</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" disabled={Boolean(o.approvableFrom)} onClick={() => void decide(o.id, "approve")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void decide(o.id, "decline")}>
                            Decline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* mobile cards */}
            <ul className="mt-3 space-y-3 md:hidden">
              {pending.map((o) => (
                <PendingCard key={o.id} order={o} onDecide={(id, d) => void decide(id, d)} large />
              ))}
            </ul>
          </>
        )}
      </section>

      <DeskSale
        stays={book.reservations.filter((r) => r.status !== "departed")}
        offers={offers}
        initialStayId={search.guest}
        onLogged={() => router.invalidate()}
      />

      {awaiting.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Awaiting guest payment</h2>
          <p className="mt-1 text-sm text-stone">
            Approved offers the guest hasn't paid yet — they pay from their stay page.
          </p>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]">
            {awaiting.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{order.guestName}</p>
                  <p className="text-sm text-stone">
                    {order.offerName}
                    {order.forDate ? ` · ${formatDate(order.forDate)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="amber">Awaiting payment</Badge>
                  <span className="w-16 text-right text-sm tabular-nums">{money(order.amountCents)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h2 className="mt-10 font-display text-xl font-semibold">On the books · last 7 days</h2>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]">
        {paid.length === 0 ? (
          <li className="px-5 py-6 text-sm text-stone">Nothing paid in the last week.</li>
        ) : null}
        {paid.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <p className="font-medium">{order.guestName}</p>
              <p className="text-sm text-stone">
                {order.offerName}
                {order.forDate ? ` · ${formatDate(order.forDate)}` : ""}
                {order.forTime ? ` · ${order.forTime}` : ""}
                <span className="ml-2 text-xs">
                  {order.platform} · {order.bookingRef}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="quiet">{order.channel === "desk" ? "Desk" : "Stay page"}</Badge>
              <Badge tone="good">{order.status === "fulfilled" ? "Fulfilled" : "Paid"}</Badge>
              {payments === "stripe" && order.channel === "guest_page" ? (
                <Button size="sm" variant="outline" onClick={() => void refund(order.id)}>
                  Refund
                </Button>
              ) : null}
              <span className="w-16 text-right text-sm tabular-nums">{money(order.amountCents)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-4 shadow-[var(--shadow-border)]">
      <dt className="text-xs uppercase tracking-[0.14em] text-stone">{label}</dt>
      <dd className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
    </div>
  );
}

type StayOption = {
  id: string;
  guestName: string;
  nights: number;
  guests: number;
  holdout: boolean;
  roomTypeName: string;
};

type OfferOption = {
  id: string;
  name: string;
  priceCents: number;
  priceUnit: "stay" | "night" | "person" | "person_night";
  inventory: number | null;
};

function DeskSale({
  stays,
  offers,
  onLogged,
  initialStayId,
}: {
  stays: StayOption[];
  offers: OfferOption[];
  onLogged: () => void;
  initialStayId?: string;
}) {
  const [stayId, setStayId] = useState(() =>
    initialStayId && stays.some((s) => s.id === initialStayId) ? initialStayId : (stays[0]?.id ?? ""),
  );
  const [offerId, setOfferId] = useState(offers[0]?.id ?? "");
  const [qty, setQty] = useState(() =>
    offers[0] && isNightly(offers[0]) && stays[0] ? stays[0].nights : 1,
  );
  const [busy, setBusy] = useState(false);
  const stay = stays.find((s) => s.id === stayId);
  const offer = offers.find((o) => o.id === offerId);
  const amount = useMemo(
    () => (stay && offer ? computeAmount(offer, stay, qty) : 0),
    [stay, offer, qty],
  );

  async function log() {
    if (!stay || !offer) return;
    setBusy(true);
    try {
      const res = await logDeskSale({ data: { reservationId: stay.id, offerId: offer.id, qty } });
      toast.success(
        `Logged ${money(res.amountCents)} desk sale${res.holdout ? " — counts toward the holdout baseline" : ""}.`,
      );
      onLogged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not log sale.");
    } finally {
      setBusy(false);
    }
  }

  if (stays.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
      <h2 className="font-display text-xl font-semibold">Log a desk sale</h2>
      <p className="mt-1 text-sm text-stone">
        Sold at the desk, by phone or in person — for any guest, holdout included.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1.2fr_0.6fr]">
        <label className="block text-sm text-stone">
          Guest
          <select
            value={stayId}
            onChange={(e) => {
              setStayId(e.target.value);
              const next = stays.find((x) => x.id === e.target.value);
              setQty(offer && isNightly(offer) && next ? next.nights : 1);
            }}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-pine"
          >
            {stays.map((s) => (
              <option key={s.id} value={s.id}>
                {s.guestName} · {s.roomTypeName}
                {s.holdout ? " · holdout" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-stone">
          Item
          <select
            value={offerId}
            onChange={(e) => {
              setOfferId(e.target.value);
              const next = offers.find((x) => x.id === e.target.value);
              setQty(next && isNightly(next) && stay ? stay.nights : 1);
            }}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-pine"
          >
            {offers.map((o) => (
              <option key={o.id} value={o.id} disabled={o.inventory === 0}>
                {o.name} · {money(o.priceCents)}
                {priceHint(o.priceUnit)}
                {o.inventory === 0 ? " · sold out" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-stone">
          {offer && isNightly(offer) ? "Nights" : "Qty"}
          <input
            type="number"
            min={1}
            max={offer && isNightly(offer) && stay ? stay.nights : 14}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-cream px-3 tabular-nums text-ink outline-none focus:border-pine"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button onClick={() => void log()} disabled={busy || !stay || !offer}>
          {busy ? "Logging…" : `Log ${money(amount)}`}
        </Button>
        {stay?.holdout ? <Badge tone="quiet">Holdout guest</Badge> : null}
      </div>
    </section>
  );
}
