import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  Car,
  Check,
  Clock3,
  Coffee,
  Plane,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckinFlow } from "@/components/checkin-flow";
import { completeStayCheckout, getStay, purchaseOffer, recordStayView, startOrderCheckout } from "@/lib/staylift/server";
import { formatDate, formatDateLong, money, priceHint, stayRange } from "@/lib/staylift/format";
import { computeAmount, isNightly } from "@/lib/staylift/pricing";
import type { Offer, OfferCategory } from "@/lib/staylift/types";

type StaySearch = { src?: "email" | "whatsapp" | "sms" | "qr"; offer?: string; checkout?: string };

export const Route = createFileRoute("/stay/$token")({
  // src = which message brought the guest here (attribution); offer = deep link from an email card;
  // checkout = an order waiting for its Stripe session to be verified on return.
  validateSearch: (search: Record<string, unknown>): StaySearch => {
    const out: StaySearch = {};
    if (search.src === "email" || search.src === "whatsapp" || search.src === "sms" || search.src === "qr") out.src = search.src;
    if (typeof search.offer === "string" && search.offer.length <= 64) out.offer = search.offer;
    if (typeof search.checkout === "string" && search.checkout.length <= 64) out.checkout = search.checkout;
    return out;
  },
  loader: ({ params }) => getStay({ data: { token: params.token } }),
  component: GuestStay,
});

const ICONS: Record<OfferCategory, typeof Coffee> = {
  upgrade: BedDouble,
  breakfast: Coffee,
  late_checkout: Clock3,
  early_checkin: Sunrise,
  parking: Car,
  spa: Sparkles,
  transfer: Plane,
  fb: Coffee,
};

function GuestStay() {
  const stay = Route.useLoaderData();
  const { token } = Route.useParams();
  const search = Route.useSearch();
  const router = useRouter();
  const reasons = new Map(stay.personalization.picks.map((p) => [p.offerId, p.reason]));
  const pickedOffers = stay.offers.filter((o) => reasons.has(o.id));
  const otherOffers = stay.offers.filter((o) => !reasons.has(o.id));
  const first = stay.reservation.guestName.split(" ")[0] ?? stay.reservation.guestName;
  const [picked, setPicked] = useState<Offer | null>(null);
  const [qty, setQty] = useState(1);
  const [paying, setPaying] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  // Approved-but-unpaid (gated) orders: the house said yes, payment happens here.
  const awaiting = stay.orders.filter((o) => o.status === "pending_payment");
  // Attribution only counts message touchpoints; a QR arrival is a check-in source instead.
  const touch = search.src === "qr" ? undefined : search.src;

  useEffect(() => {
    void recordStayView({ data: { token, source: touch } });
  }, [token, touch]);

  // Returning from Stripe Checkout: verify the session and settle the order.
  useEffect(() => {
    const orderId = search.checkout;
    if (!orderId) return;
    void (async () => {
      try {
        const res = await completeStayCheckout({ data: { token, orderId } });
        if (res.paid) {
          toast.success("Paid — the house has it. See you soon.");
          await router.invalidate();
        } else {
          toast.info("Payment isn't confirmed yet. If you just paid, refresh in a moment.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not verify the payment.");
      }
      void router.navigate({
        to: "/stay/$token",
        params: { token },
        search: search.src ? { src: search.src } : {},
        replace: true,
      });
    })();
    // Run once per return from Checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.checkout]);

  // Deep link from the booking email: open that offer straight away.
  useEffect(() => {
    if (!search.offer) return;
    const target = stay.offers.find((o) => o.id === search.offer);
    if (target) {
      setPicked(target);
      setQty(isNightly(target) ? stay.reservation.nights : 1);
    }
    // Only on arrival; later invalidations must not reopen the sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nights = stay.reservation.nights;
  const open = (offer: Offer) => {
    setPicked(offer);
    setQty(isNightly(offer) ? nights : 1);
  };
  const defaultQty = useMemo(() => (picked && isNightly(picked) ? nights : 1), [picked, nights]);

  // Same function the server charges with, so the shown total is the charged total.
  const amount = picked ? computeAmount(picked, stay.reservation, qty) : 0;
  const upgradeOpens = (() => {
    const t = Date.parse(`${stay.reservation.arrival}T00:00:00Z`) - 3 * 86_400_000;
    return new Date(t).toISOString().slice(0, 10);
  })();

  async function payOrder(orderId: string) {
    setPayingOrderId(orderId);
    try {
      const res = await startOrderCheckout({ data: { token, orderId } });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start payment.");
      setPayingOrderId(null);
    }
  }

  async function pay() {
    if (!picked) return;
    setPaying(true);
    try {
      const result = await purchaseOffer({
        data: { token, offerId: picked.id, qty, source: touch },
      });
      if ("checkoutUrl" in result && result.checkoutUrl) {
        // Stripe mode: follow the hosted checkout; the page verifies on return.
        window.location.href = result.checkoutUrl;
        return;
      }
      toast.success(
        result.autoApprove
          ? "Paid. We’ll have it ready."
          : result.confirmsFrom
            ? `Requested. Upgrades are confirmed from ${formatDate(result.confirmsFrom)}; you’re only charged if it’s confirmed.`
            : "Requested. The house will confirm shortly — you’re only charged if it’s confirmed.",
      );
      setPicked(null);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-dvh bg-linen">
      <header className="mx-auto flex max-w-lg items-center justify-between px-5 py-5">
        <div>
          <p className="font-display text-2xl font-medium tracking-tight">{stay.property.name}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-stone">{stay.property.city}</p>
        </div>
        <Link to="/" className="text-xs text-stone hover:text-ink">
          Staylift
        </Link>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-24 stagger-in">
        <p className="text-stone">{stay.checkin.returningGuest ? `Welcome back, ${first}` : `Hi ${first}`}</p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-tight">Your stay</h1>
        <p className="mt-3 text-lg text-ink">
          {stayRange(stay.reservation.arrival, stay.reservation.departure)}
        </p>
        <p className="text-stone">
          {stay.reservation.nights} night{stay.reservation.nights === 1 ? "" : "s"} ·{" "}
          {stay.reservation.guests} guest{stay.reservation.guests === 1 ? "" : "s"} ·{" "}
          {stay.reservation.roomTypeName}
        </p>

        {stay.orders.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-[0.16em] text-stone">On your stay</h2>
            <ul className="mt-3 space-y-2">
              {stay.orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between rounded-lg bg-moss px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-pine" />
                    {order.offerName}
                  </span>
                  <span className="text-sm tabular-nums text-stone">
                    {order.status === "pending_approval" ? "Requested" : money(order.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {stay.reservation.holdout ? null : (
        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.16em] text-stone">Picked for your stay</p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight">
            {stay.personalization.headline}
          </h2>
          <p className="mt-2 text-stone">
            Chosen from your dates, room and party. Nothing is charged until you choose it.
          </p>
          {stay.offers.length === 0 ? (
            <p className="mt-5 rounded-lg border border-line bg-cream px-4 py-8 text-sm text-stone">
              Everything available for this stay is already on the folio.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {pickedOffers.map((offer) => (
                <li key={offer.id}>
                  <OfferCard offer={offer} reason={reasons.get(offer.id)} onOpen={open} featured />
                </li>
              ))}
            </ul>
          )}
          {otherOffers.length > 0 ? (
            <>
              <h3 className="mt-8 text-xs uppercase tracking-[0.16em] text-stone">More for your stay</h3>
              <ul className="mt-3 space-y-2">
                {otherOffers.map((offer) => (
                  <li key={offer.id}>
                    <OfferCard offer={offer} onOpen={open} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
        )}

        {awaiting.length > 0 ? (
          <section className="mt-10 rounded-xl bg-moss p-5">
            <h2 className="font-display text-xl font-medium">Approved by the house</h2>
            <p className="mt-1 text-sm text-stone">These are held for you — paying now confirms them.</p>
            <ul className="mt-3 space-y-2">
              {awaiting.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-paper px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.offerName}</p>
                    <p className="text-xs text-stone">Approved · pay to confirm</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={payingOrderId === o.id}
                    onClick={() => void payOrder(o.id)}
                  >
                    {payingOrderId === o.id ? "Opening…" : `Pay ${money(o.amountCents)}`}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="checkin" className="mt-12 scroll-mt-6">
          <CheckinFlow
            token={token}
            hotel={stay.property.name}
            guestFirstName={first}
            guests={stay.reservation.guests}
            state={stay.checkin}
            config={stay.capture}
            source={search.src === "qr" ? "qr" : "online"}
          />
        </section>

        <p className="mt-10 text-center text-xs text-mist">
          Arranged by {stay.property.name} · Powered by Staylift
        </p>
      </main>

      {picked ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl bg-paper p-5 shadow-[var(--shadow-lift)] sm:p-6"
          >
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mb-3 inline-flex items-center gap-1 text-sm text-stone"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            <h3 className="font-display text-2xl font-medium">{picked.name}</h3>
            <p className="mt-2 text-sm text-stone">{picked.description}</p>
            <p className="mt-4 text-sm">
              {formatDateLong(stay.reservation.arrival)} –{" "}
              {formatDateLong(stay.reservation.departure)}
            </p>
            {isNightly(picked) && (
              <label className="mt-4 block text-sm text-stone">
                {picked.category === "breakfast" ? "Mornings" : "Nights"}
                <input
                  type="number"
                  min={1}
                  max={nights}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.min(nights, Math.max(1, Math.floor(Number(e.target.value) || defaultQty))))
                  }
                  className="mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 tabular-nums outline-none focus:border-pine"
                />
              </label>
            )}
            <div className="mt-5 flex items-end justify-between">
              <p className="text-stone">Total</p>
              <p className="font-display text-3xl tabular-nums">{money(amount)}</p>
            </div>
            {!picked.autoApprove ? (
              <Badge tone="amber" className="mt-3">
                {picked.category === "upgrade"
                  ? `Confirmed from ${formatDate(upgradeOpens)} · charged only if confirmed`
                  : "The house confirms this one · charged only if confirmed"}
              </Badge>
            ) : (
              <p className="mt-3 text-xs text-stone">
                {stay.payments === "stripe" ? "Instant · pay by card" : "Instant · charged to the card on file"}
              </p>
            )}
            <Button className="mt-5 w-full" onClick={() => void pay()} disabled={paying}>
              {paying
                ? "Working…"
                : picked.autoApprove
                  ? `Pay ${money(amount)}`
                  : `Request ${money(amount)}`}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OfferCard({
  offer,
  reason,
  onOpen,
  featured,
}: {
  offer: Offer;
  reason?: string;
  onOpen: (offer: Offer) => void;
  featured?: boolean;
}) {
  const Icon = ICONS[offer.category] ?? Sparkles;
  return (
    <button
      type="button"
      onClick={() => onOpen(offer)}
      className={
        featured
          ? "flex w-full items-stretch gap-4 rounded-xl bg-paper p-4 text-left shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-lift)]"
          : "flex w-full items-center gap-3 rounded-lg bg-cream/70 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-paper"
      }
    >
      <span
        className={
          featured
            ? "flex size-12 shrink-0 items-center justify-center rounded-md bg-cream text-pine"
            : "flex size-9 shrink-0 items-center justify-center rounded-md bg-paper text-pine"
        }
      >
        <Icon className={featured ? "size-5" : "size-4"} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={featured ? "font-display text-lg font-medium leading-tight" : "text-sm font-medium"}>
            {offer.name}
          </span>
          <span className="shrink-0 tabular-nums text-sm">
            {money(offer.priceCents)}
            <span className="text-stone">{priceHint(offer.priceUnit)}</span>
          </span>
        </span>
        <span className="mt-1 block text-sm text-stone">{reason ?? offer.shortLabel}</span>
      </span>
    </button>
  );
}
