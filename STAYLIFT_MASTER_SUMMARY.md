# Staylift — Master Summary (reference)

*As of 2 October 2026. Companion to the change log `claude/staylift-precision-rebuild.md`. The change log says **what changed in the code**. This doc covers **why it changed, how it was checked, where things live, and what comes next**.*

---

## 1. What Staylift is

Staylift is a SaaS product that helps hotels earn more from each booking by selling extras: upgrades, breakfast, spa, transfers, parking, late check-out and early check-in.

The core loop, now built end to end:

**OTA booking → personalised booking email → personalised stay page → guest books an offer → hotelier dashboard**

Proof that it works comes from a **random holdout**. 20% of bookings get check-in only, so the hotel sees the lift it actually gained, not just the revenue that passed through the page.

---

## 2. Timeline of the work

| # | Request | Outcome |
|---|---|---|
| 1 | Review the pasted plans, enrich them, iterate to 10/10 | Strategy and plan **v6**: ROI model, pricing rule, guarantee, holdout design |
| 2 | "Rebuild it more precise and make it better with ROI calculator" (Grok workspace zip) | Precision fixes, ROI engine, `/roi` calculator, `/hotel/roi` measured ROI |
| 3 | "Rebuild here" | Copied into the Mac folder `Desktop/AI Tools/Hotelier/staylift` |
| 4 | "Not working" (screen shared) | `start-staylift.command` launcher; fixed the migration that wasn't applying; dev server confirmed running |
| 5 | Guest journey: OTA → email → landing page → offer → dashboard | Booking email template (3 modes), personalisation rules, deep links, source attribution, journey funnel |
| 6 | Solve OTA guest reach first + guest profiles + occasion retargeting + friends and family; plan first | Plan v1 → v2 |
| 7 | Rate and iterate the plan to 10/10 | **Plan v3**, approved ("I like the V3") |
| 8 | Summarise | In-chat summary, then this doc |

Also published: **Staylift ROI Calculator** artifact, https://claude.ai/artifact/PxQkEg5fgq62oiQUvxoYRn (a standalone version of `/roi`).

---

## 3. Business model and ROI logic (plan v6)

### 3.1 Per-hotel model
```
bookings / yr   = rooms × occupancy × 365 ÷ avg stay (nights)
reachable       = bookings × reach rate
viewers         = reachable × view rate
buyers          = viewers × buy rate
gross ancillary = buyers × orders per buyer × avg spend
incremental     = gross × incrementality
hotel net       = incremental × margin − platform fees − card fees (% + fixed)
```
- **Break-even** is linear in buyers.
- **Pricing rule:** a plan is offered only if net is positive in the *conservative* scenario **and** the *base* scenario returns at least $2 per $1 of fees.
- **Guarantee:** incremental revenue must be at least 2× Staylift fees over 90 days.

### 3.2 Defaults
- **Hotel:** 80 rooms · 50% occupancy · 2-night stay · 70% reach · 1.2 orders per buyer · 60% margin · 70% incrementality · 3.5% card fee · $0 fixed card fee.
- **Scenarios (view / buy / spend):**
  - Conservative: 50% / 10% / $35
  - Base: 50% / 16% / $45
  - Upside: 50% / 20% / $60
- **Plans ($/room/month, $ base, % revenue share):**
  - A: 1 / 0 / 7%
  - B: 4 / 0 / 0
  - C: 0 / 0 / 10%
  - Custom: any mix
- **Plan A net to the hotel:**
  - Conservative: **+$1,857**
  - Base: **+$4,834** (+$4,835 unrounded)
  - Upside: **+$8,698**
  - Tests lock these numbers.

### 3.3 Operator (Staylift) economics
- Messaging cost by market, at Meta WhatsApp rates (utility / marketing):
  - US: $0.004 / $0.025
  - UK: $0.0171 / $0.0592
  - DE: utility $0.055
  - NL: marketing $0.1597
- **From 1 Oct 2026** Meta also charges for utility templates and in-window replies. Messaging cost is modelled as an expense.
- Also modelled: gross margin, support cost, churn → LTV, CAC payback, portfolio ARR.

### 3.4 Measuring lift
- Lift per completed stay = treatment mean − holdout mean, with a **Welch 95% confidence interval**.
- Evidence level:
  - **too few**: under 50 holdout stays
  - **directional**: under 300
  - **solid**: 300 or more
- Desk sales are logged for *all* guests, so the holdout baseline is real rather than zero.
- Funnel steps are nested: bookings ⊇ reached ⊇ viewed ⊇ bought. No step can exceed 100%.

---

## 4. What's built (app state)

### 4.1 Stack
- **App:** TanStack Start/Router (file routes, `createServerFn` + zod), React 19, Tailwind v4, Vite 8, nitro, Vercel.
- **Database:** PGLite in memory for dev (resets on every restart); Neon (`DATABASE_URL`) in prod.
- **Migrations:** applied when `db.ts` loads.
- Grok App Builder conventions: `AGENTS.md`, `startup.sh`, `grok-pwa` plugin.

### 4.2 Screens
| Route | Purpose |
|---|---|
| `/` | Landing page: the journey loop and an ROI teaser |
| `/roi` | ROI calculator, with every input synced to the URL (shareable links) and an operator-economics tab |
| `/hotel` | Overview: KPIs, nested funnel, **Guest journey** panel (OTA bookings → emailed → opened → booked → email revenue) |
| `/hotel/reservations` | Ingest a pasted confirmation; history toggle; holdout and purge badges; Email / Guest page / WhatsApp link buttons |
| `/hotel/email/$reservationId` | Booking-email preview (desktop or phone, HTML or text), the signals behind the picks, Send now |
| `/hotel/roi` | Measured ROI: lift and CI, hotel net, guarantee status, contract editor, "Project a full year" |
| `/hotel/fulfillment` | Orders and the desk-sale logger |
| `/hotel/offers`, `/hotel/automation` | Offer catalogue; recipes (each flags whether it sends a message) |
| `/stay/$token` | Guest landing page: personalised picks, "More for your stay", deep link `?src=email&offer=…`, check-in |

### 4.3 Booking email: three modes
- **Full:** sent to the guest's own address. Offer cards with prices and one-tap links.
- **Light:** sent to an OTA relay address (e.g. `@guest.booking.com`). The picks and their reasons, no prices, one link. Everything stays about this reservation.
- **Service:** for holdout bookings. Confirmation and check-in only.

The email sends automatically on ingest, and duplicate sends are refused. Links use the page origin, or `PUBLIC_APP_URL` when it is set.

### 4.4 Personalisation, level 1 (`personalize.ts`)
- Transparent rules over party size, nights, weekend nights, room type, lead time, booking channel, and keywords in the booking notes (quiet, anniversary or birthday, flight, driving, early).
- Each pick carries a plain-words reason, e.g. "For two, all three mornings" or "You asked for quiet: the … faces the courtyard".
- Staff see the signals behind the picks; the guest never does.

### 4.5 Attribution
- `events.source` and `orders.source` record `email`, `whatsapp` or `sms`.
- A journey step counts only when the step before it happened (visit came from the email link; purchase happened on that visit).
- Holdout bookings are excluded.

### 4.6 Guard rails already in code
- **Upgrades:** request only; approvable from 72 h before arrival.
- **Phone:** at most 2 messages per booking; each message stores its billed cost.
- **Consent:** a captured email does **not** grant marketing consent.
- **Retention:** Booking.com contact data gets a purge date of departure + 30 days.
- **Parser:**
  - needs a labelled reference containing a digit
  - rejects departure ≤ arrival
  - rejects duplicate references
  - detects masked emails and placeholder phones
- **Pricing:** client and server share `computeAmount`.

### 4.7 Key files
- **`src/lib/staylift/`**
  - `roi.ts` (+ tests), `roi-url.ts`
  - `queries.ts`: all SQL; testable
  - `server.ts`: thin validated wrappers
  - `types.ts`, `pricing.ts`
  - `personalize.ts` (+ tests), `email-template.ts` (+ tests), `parse-email.ts`
- **Migrations:**
  - `0005_measured_lift.sql`: economics, holdout, channels, message costs, and a deterministic 720-stay pilot
  - `0006_guest_journey.sql`: source columns; backfill of booking emails and visit sources
- **Components:** `roi-calculator.tsx`, `roi-page.tsx` (custom SVG chart), `pending-card.tsx`, `hotel-shell.tsx`.
- **Docs and launcher:** `STAYLIFT_CHANGES.md` (change log), `RUN_LOCALLY.md`, `start-staylift.command`.

### 4.8 Where things live
- **Mac:** `~/Desktop/AI Tools/Hotelier/staylift` (with darwin `node_modules` and `logs/`).
- **Zip:** `Hotelier/staylift-workspace.zip`. The original Grok zip is untouched in `Hotelier/reso/`.
- **Run locally:** double-click `start-staylift.command`. It finds Node via Homebrew, nvm, fnm or Volta, runs `npm install` and `npm run dev`, and opens http://localhost:8080. Logs go to `logs/`.

---

## 5. Verification status

**Checked and passing**
- `tsc --noEmit` passes on the Mac. Node 24.14.0 and Vite 8.3.2 run the dev server.
- Browser walkthrough on the Mac:
  1. The email preview renders.
  2. `/stay/maya?src=email&offer=off_breakfast` opens the breakfast sheet.
  3. Paying $72 moved the journey funnel: booked 20 → 21, email revenue $914 → $986.
- 27 unit tests pass (ROI, personalisation, email template), plus the query and journey test suites.

**Known and not yet done**
- `npm run build` (production build) has **never been run**.
- Emails are recorded but **not delivered**: no email provider is wired in.
- Restarting the dev server **resets the demo data** (PGLite runs in memory).
- 9 `npm test` failures are **pre-existing template tests** (grok-pwa plugin, migration-plan "auth schema"), not regressions. They expect a blank project.
- `routeTree.gen.ts` was edited by hand. The router plugin regenerates it on dev or build.

---

## 6. Compliance facts the plan relies on

**OTA terms**
- **Booking.com:** the General Delivery Terms (clause 2.9.3) ban unsolicited messages.
  - Guest data is available until 30 days after the stay.
  - Messaging is allowed until 7 days after check-out.
  - Service messages about the stay are fine; marketing is not.
- **Airbnb:** the off-platform policy prohibits marketing use of guest data.
- **Agoda, Trip.com:** terms **unverified**; treat as unknown until a lawyer confirms.

**Capturing real contact details**
- Mews reports about 96% capture of real emails at check-in for masked OTA guests. Check-in is the lawful moment to collect a real contact and consent.

**Messaging law and channel rules**
- **WhatsApp:** needs opt-in. Meta pricing changes on 1 Oct 2026 (see §3.3).
- **US SMS:** 10DLC registration is required. TCPA applies.
- **CAN-SPAM** (US email). **GDPR**, where religion-linked occasions (Eid, Christmas, …) are **Art. 9 special-category data**, so they must be self-selected and need explicit consent.
- **EU DMA:** parity considerations.

---

## 7. Plan v3: OTA reach, guest profiles, occasion retargeting (approved direction)

### 7.1 Principles
1. **Reach legally before marketing.**
   - Before arrival, send service-only content through the OTA relay or WhatsApp (the Light email).
   - Capture the real contact and consent at check-in.
   - Market only to guests who opted in, with a verified contact.
2. **Never infer sensitive traits.** Holidays come from guests' own selections, never from name, nationality or language.
3. **Every campaign carries its own holdout,** so occasion revenue is measured the same way as stay revenue.

### 7.2 Phases and gates
| Phase | Scope | Gate to move on |
|---|---|---|
| **A: Foundations** | Auth and roles; tenancy with Postgres RLS; encryption of contact data; audit log; guest data export and delete | Security review passes |
| **B: Capture step** | Check-in flow: a celebration question first, verified contact last, 3 consents (all unticked by default); desk tablet mode; QR code; purge clocks per OTA | ≥40% contact capture, ≥10% marketable, ≤3-point drop in check-in completion |
| **C: Guest profiles** | Matching on verified contact; merge; occasions stored as month/day only (no birth year); self-selected holidays; companions, with rules for children; consent ledger | Data-quality checks |
| **D: Occasion campaigns** | Personal occasions sent 5 weeks ahead; holidays 6–8 weeks ahead; caps of 1 per 30 days and 4 per year; **packages, not discounts**; guest's language and time zone; send at 10:00 local; SPF/DKIM/DMARC; suppression lists; 15% campaign holdout | ≥1.5× bookings vs holdout **and** complaints <0.1% |
| **E: Companion opt-in** | Companions are contacted only after they opt in themselves | — |

**Occasions in scope:**
- Personal: birthday, wedding anniversary, achievements.
- Seasonal and festive: Eid, Christmas, New Year, local festivals (e.g. Chinese New Year).
- Friends and family: companions' occasions, after they opt in.

### 7.3 Business case (80 rooms, base)
- Base: ~**698** marketable guests a year → **42** direct rebookings → **$15.1k** room revenue, plus **$2.7k** OTA commission saved.
- Low: 281 marketable guests → $3.0k.
- High: 1,533 marketable guests → $55.1k.

---

## 8. Decisions needed before building (open)
1. **Launch markets:** which countries first. This sets the law, messaging prices and holidays.
2. **Booking engine:** integrate one for direct rebookings, or use a request-form fallback.
3. **Companions:** how far to go (store names only vs. invite companions to opt in).
4. **Approve phase A** (auth and security) as the first build.
5. **Email provider and sending domain** (e.g. Postmark, SES or Resend; a subdomain such as `mail.<hotel>.com`).

When these are answered, implementation starts with **phase A**.

---

## 9. Lessons from the build (troubleshooting reference)
- **npm registry:** blocked in the cloud container. Verification there used Postgres, a psql shim and tsx; real installs happen on the Mac.
- **Mac mount:** `unzip -o` can't overwrite files in the mounted folder ("Operation not permitted"). Extract elsewhere, then `cp` the changed files.
- **New migration not applied** (e.g. "column e.source does not exist"): PGLite applies migrations when `db.ts` loads. Restart the dev server, or touch `db.ts` to trigger HMR.
- **Test files using top-level await:** must be `.mts` to run under tsx.
- **Desk-sale demo draws:** need their own hash salt (`counter-`), or the holdout gets almost no desk sales.
- **Starting the app:** the macOS launcher must be double-clicked by the user. Background clicks don't open Terminal.
