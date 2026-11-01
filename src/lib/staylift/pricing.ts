import type { Offer, Reservation } from "./types.ts";

/**
 * What an offer costs for a stay. Shared by the guest page (the price shown)
 * and the server (the price charged), so they can never disagree.
 * qty = nights/mornings for nightly units, otherwise a count.
 */
export function computeAmount(
  offer: Pick<Offer, "priceCents" | "priceUnit">,
  res: Pick<Reservation, "nights" | "guests">,
  qty: number,
) {
  const q = Math.max(1, Math.floor(qty));
  switch (offer.priceUnit) {
    case "night":
      return offer.priceCents * Math.min(q, res.nights);
    case "person":
      return offer.priceCents * res.guests * q;
    case "person_night":
      return offer.priceCents * res.guests * Math.min(q, res.nights);
    default:
      return offer.priceCents * q;
  }
}

export function isNightly(offer: Pick<Offer, "priceUnit">) {
  return offer.priceUnit === "night" || offer.priceUnit === "person_night";
}
