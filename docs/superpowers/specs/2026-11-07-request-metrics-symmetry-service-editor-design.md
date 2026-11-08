# Dashboard round: request metrics, grid symmetry, logo dedup, service editor

Date: 2026-11-07 · Status: approved in chat (see decisions), implemented same day

## Problem

Four user-raised gaps on the staff side:

1. The Booking requests card shows only the live queue — no week/month/fiscal
   numbers for how requests flow.
2. The Overview's three card columns end at different heights, leaving a hole
   under "Top offers".
3. The Staylift mark appears twice on the desktop header (icon rail + beside
   the hotel crest) with the same link.
4. The Service library is read-only: hotels can pause a service but not add or
   edit one.

## Decisions (user-confirmed)

- Metrics: "full desk picture" — received (+$ asked), approval rate, captured
  revenue, still-open, plus per-day volume bars in the week view.
- Fiscal = calendar quarter (no fiscal-year setting; YAGNI until asked).
- Service editor: inline panel (no dialog dependency), create + edit, no
  delete (Pause covers it).

## Design

### Request metrics (one new aggregate)

`requestStats()` in `queries.ts` — single SQL pass over `orders` (holdout
stays excluded, like every Overview stat) computing per period bucket
(`date_trunc('week'|'month'|'quarter', now())`):

- received / requestedCents — by `created_at`
- approved — `decided_at` in period, status `paid|fulfilled|pending_payment`
- declined — `decided_at` in period, status `declined`
- capturedCents — decided in period and `status in ('paid','fulfilled')`
  (approval isn't money until it settles)

Plus `daily`: trailing-7-day received counts via `generate_series` (for the
week view's mini bars). Returned as `OverviewExtras.requestStats` — no new
endpoint; the loader already fetches `overviewExtras`. UI switches buckets
client-side (no refetch), matching the Attach rate card's Weekly/Monthly
pattern. Approval rate renders as a pill (moss ≥70%, amber below).

### Symmetry: two bands, not three ragged stacks

Grid items are placed per band instead of three independent flex columns:

- Band 1: Revenue hero | Attach rate | Open offer value
- Band 2: Last 7 days + Top offers | Booking requests (+ metrics) |
  Stay-page share + Needs attention

Grid implicit rows give each band a shared height (`h-full`/`flex-1` on the
card roots). At `lg` (2-col) the right cell spans both columns; below `lg`
everything stacks in DOM order.

### Logo dedup

Delete the header Staylift mark (`hotel-shell.tsx`) — the icon rail already
carries it with the same `/` link. It was `hidden lg:block`, so mobile (which
never showed it) is unaffected.

### Service library add/edit

- `saveOffer` server fn (`editOffers` role — same gate as `toggleOffer`),
  zod-validated, audited (`offer.create` / `offer.update`), tenant-scoped by
  the RLS transaction: updates match `where id`, so a forged id is a no-op.
- `q.saveOffer`: update path returns the id (missing id → explicit error);
  create path mints `off_<random12>` server-side and appends at
  `sort_order = max + 10`. Insert omits `property_id` (RLS default).
- `roomTypes()` + `listOffers.roomTypes` feed the upgrade from → to picker
  (upgrade is a room-type swap; other categories hide the picks).
- UI: "New service" button opens the inline panel above the grid; each card
  gains an Edit button (both behind `canEdit`). Fields: name, category,
  description, price $ + unit (per night / per stay), inventory (blank =
  unlimited), cutoff (3–72h or none), Instant vs Needs approval.
  Validation client-side (toast) + server-side (zod).

## Verification

Typecheck + build + unit tests; browser QA on dev and built output: all three
period buckets toggle, metrics sane vs the fulfillment page, band edges align
at desktop and 390px, create → edit → pause → reactivate a service
end-to-end, header shows exactly one Staylift mark on desktop.

## Out of scope (deliberate)

Delete services (Pause suffices), configurable fiscal-year start month,
person/person_night price units in the editor.
