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
} from "@/lib/staylift/server";
import { formatDate, money, priceHint } from "@/lib/staylift/format";
import { computeAmount, isNightly } from "@/lib/staylift/pricing";

export const Route = createFileRoute("/hotel/fulfillment")({
  loader: async () => {
    const [orders, book, offerData] = await Promise.all([
      listFulfillment(),
      listReservations({ data: {} }),
      listOffers(),
    ]);
    return { ...orders, book, offers: offerData.offers };
  },
  component: FulfillmentPage,
});

function FulfillmentPage() {
  const { pending, paid, book, offers } = Route.useLoaderData();
  const router = useRouter();

  async function decide(orderId: string, decision: "approve" | "decline") {
    try {
      await decideOrder({ data: { orderId, decision } });
      toast.success(
        decision === "approve"
          ? "Guest notified. Payment captured. Revenue recorded."
          : "Request declined. Inventory released.",
      );
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Fulfillment</h1>
      <p className="mt-2 max-w-2xl text-stone">
        Staff see every purchase immediately, and the guest hears back if the house says no.
        Front-desk sales are logged here too — without them the holdout baseline reads as zero
        and the lift looks bigger than it is.
      </p>

      <h2 className="mt-8 font-display text-xl font-medium">New requests</h2>
      {pending.length === 0 ? (
        <p className="mt-3 rounded-lg border border-line bg-cream px-4 py-8 text-sm text-stone">
          Queue is clear.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {pending.map((order) => (
            <PendingCard key={order.id} order={order} onDecide={(id, d) => void decide(id, d)} large />
          ))}
        </ul>
      )}

      <DeskSale
        stays={book.reservations.filter((r) => r.status !== "departed")}
        offers={offers}
        onLogged={() => router.invalidate()}
      />

      <h2 className="mt-10 font-display text-xl font-medium">On the books · last 7 days</h2>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-border)]">
        {paid.length === 0 ? (
          <li className="px-5 py-6 text-sm text-stone">Nothing paid in the last week.</li>
        ) : null}
        {paid.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-medium">{order.guestName}</p>
              <p className="text-sm text-stone">
                {order.offerName}
                {order.forDate ? ` · ${formatDate(order.forDate)}` : ""}
                {order.forTime ? ` · ${order.forTime}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="quiet">{order.channel === "desk" ? "Desk" : "Stay page"}</Badge>
              <Badge tone="pine">{order.status === "fulfilled" ? "Fulfilled" : "Paid"}</Badge>
              <span className="w-16 text-right text-sm tabular-nums">{money(order.amountCents)}</span>
            </div>
          </li>
        ))}
      </ul>
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
}: {
  stays: StayOption[];
  offers: OfferOption[];
  onLogged: () => void;
}) {
  const [stayId, setStayId] = useState(stays[0]?.id ?? "");
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
    <section className="mt-10 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
      <h2 className="font-display text-xl font-medium">Log a desk sale</h2>
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
            className="mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-pine"
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
              const next = offers.find((o) => o.id === e.target.value);
              setQty(next && isNightly(next) && stay ? stay.nights : 1);
            }}
            className="mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-pine"
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
            className="mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 tabular-nums text-ink outline-none focus:border-pine"
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
