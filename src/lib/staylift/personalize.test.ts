import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { includesWeekendNight, personalize } from "./personalize.ts";
import type { Offer, OfferCategory } from "./types.ts";

function offer(id: string, category: OfferCategory, sortOrder: number): Offer {
  return {
    id,
    name: id,
    shortLabel: id === "up" ? "Deluxe Courtyard" : id,
    description: "",
    category,
    priceCents: 1000,
    priceUnit: "stay",
    inventory: null,
    cutoffHours: null,
    autoApprove: true,
    ownerType: "HOTEL",
    active: true,
    fromRoomTypeId: null,
    toRoomTypeId: null,
    sortOrder,
  };
}

const OFFERS = [
  offer("up", "upgrade", 1),
  offer("bf", "breakfast", 2),
  offer("park", "parking", 5),
  offer("spa", "spa", 6),
  offer("car", "transfer", 7),
];

const base = {
  arrival: "2026-10-12", // Monday: Mon–Wed nights
  nights: 3,
  guests: 2,
  roomTypeId: "rt_standard",
  source: "Booking.com",
  notes: "",
};

describe("personalize", () => {
  it("a couple in a standard room for 3 nights gets upgrade and breakfast first", () => {
    const p = personalize(base, OFFERS, { today: "2026-10-02", city: "Austin" });
    assert.deepEqual(p.picks.map((x) => x.offerId).slice(0, 2).sort(), ["bf", "up"]);
    assert.ok(p.picks.some((x) => x.reason === "For two, all three mornings"));
    assert.equal(p.headline, "Picked for the two of you: 3 nights in Austin");
  });

  it("notes change the order and the reason", () => {
    const p = personalize({ ...base, guests: 1, notes: "Driving from Dallas, anniversary" }, OFFERS, {
      today: "2026-10-02",
      city: "Austin",
    });
    assert.equal(p.picks[0].offerId, "up");
    assert.match(p.picks[0].reason, /occasion/);
    assert.ok(p.picks.some((x) => x.offerId === "park" && /driving/i.test(x.reason)));
  });

  it("weekend stays lift the spa", () => {
    const weekday = personalize({ ...base, guests: 1, roomTypeId: "rt_suite" }, OFFERS, { today: "2026-10-02", city: "Austin" });
    const weekend = personalize({ ...base, guests: 1, roomTypeId: "rt_suite", arrival: "2026-10-16" }, OFFERS, {
      today: "2026-10-02",
      city: "Austin",
    });
    const rank = (p: ReturnType<typeof personalize>) => [...p.picks.map((x) => x.offerId), ...p.restIds].indexOf("spa");
    assert.ok(rank(weekend) < rank(weekday));
  });

  it("is deterministic and covers every offer exactly once", () => {
    const a = personalize(base, OFFERS, { today: "2026-10-02", city: "Austin" });
    const b = personalize(base, OFFERS, { today: "2026-10-02", city: "Austin" });
    assert.deepEqual(a, b);
    const all = [...a.picks.map((x) => x.offerId), ...a.restIds].sort();
    assert.deepEqual(all, OFFERS.map((o) => o.id).sort());
  });

  it("detects weekend nights", () => {
    assert.equal(includesWeekendNight("2026-10-14", 2), false); // Wed, Thu nights
    assert.equal(includesWeekendNight("2026-10-15", 2), true); // Thu, Fri nights
    assert.equal(includesWeekendNight("2026-10-18", 1), false); // Sunday night
  });
});
