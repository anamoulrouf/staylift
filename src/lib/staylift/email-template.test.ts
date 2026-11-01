import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emailModeFor, renderBookingEmail, type EmailInput } from "./email-template.ts";
import type { Offer } from "./types.ts";

const breakfast: Offer = {
  id: "off_breakfast",
  name: "Breakfast for two",
  shortLabel: "House kitchen",
  description: "",
  category: "breakfast",
  priceCents: 2400,
  priceUnit: "night",
  inventory: null,
  cutoffHours: 12,
  autoApprove: true,
  ownerType: "HOTEL",
  active: true,
  fromRoomTypeId: null,
  toRoomTypeId: null,
  sortOrder: 2,
};

const input = (mode: EmailInput["mode"]): EmailInput => ({
  property: { name: "The Marlowe", city: "Austin" },
  reservation: {
    guestName: "Maya <Chen>",
    arrival: "2026-10-14",
    departure: "2026-10-17",
    nights: 3,
    guests: 2,
    roomTypeName: "Standard Queen",
    bookingRef: "BK-441902",
    source: "Booking.com",
  },
  picks: [{ offer: breakfast, reason: "For two, all three mornings" }],
  headline: "Picked for the two of you: 3 nights in Austin",
  stayUrl: "https://example.test/stay/maya",
  mode,
});

describe("booking email", () => {
  it("chooses the mode from the recipient", () => {
    assert.equal(emailModeFor({ holdout: false, emailKind: "real" }), "full");
    assert.equal(emailModeFor({ holdout: false, emailKind: "masked" }), "light");
    assert.equal(emailModeFor({ holdout: true, emailKind: "real" }), "service");
    assert.equal(emailModeFor({ holdout: false, emailKind: "none" }), null);
  });

  it("full mode shows the price and a deep link to the offer", () => {
    const e = renderBookingEmail(input("full"));
    assert.match(e.html, /\$24/);
    assert.match(e.html, /offer=off_breakfast/);
    assert.match(e.html, /src=email/);
    assert.match(e.subject, /^Maya, your Austin stay is confirmed \(Oct 14–Oct 17\)$/);
  });

  it("light mode names the picks but shows no prices or per-offer links", () => {
    const e = renderBookingEmail(input("light"));
    assert.match(e.html, /For two, all three mornings/);
    assert.doesNotMatch(e.html, /\$24/);
    assert.doesNotMatch(e.html, /offer=off_breakfast/);
  });

  it("service mode (holdout) has no offers at all", () => {
    const e = renderBookingEmail(input("service"));
    assert.doesNotMatch(e.html, /Picked for your stay/);
    assert.doesNotMatch(e.text, /Breakfast/);
    assert.match(e.html, /Check in online/);
  });

  it("escapes guest-supplied text", () => {
    const e = renderBookingEmail(input("full"));
    assert.match(e.html, /Hi Maya,/);
    const odd = renderBookingEmail({ ...input("full"), reservation: { ...input("full").reservation, guestName: "<b>Maya</b> X" } });
    assert.doesNotMatch(odd.html, /<b>Maya<\/b>/);
    assert.match(odd.html, /&lt;b&gt;Maya&lt;\/b&gt;/);
  });
});
