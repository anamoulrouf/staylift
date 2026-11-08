# Staylift — precision rebuild + ROI calculator

## Landing redesign — Foundation direction (latest)

The public landing (`/`) is rebuilt in the visual language of
thefoundation.house: dark full-bleed hero with masked uppercase display lines
("Upsell / Revenue / You can prove."), flat violet CTA bar, color-blocked
stat cards, three full-bleed product pillars with spec cards, a violet
manifesto band, the interactive ROI teaser restyled sharp (same math,
deep-links into /roi), hover-invert demo index, and a giant-wordmark footer.

- **Scoped theming:** everything lives in a `.landing-scope` wrapper
  (styles.css) that re-points the same custom properties — font-display →
  Inter Tight (Google-hosted stand-in for licensed Helvetica Now Display),
  pine → violet #A459FF, concrete surfaces, radius 0, shadows none. The
  dashboard (coral), guest pages and /roi keep their existing brands.
- **Motion:** dependency-free IntersectionObserver reveals (masked line
  reveals, fade/slide-up, count-up stats) — SSR/no-JS render fully visible;
  `prefers-reduced-motion` disables everything and shows final strings.
- **Imagery:** five property renders self-hosted in
  `public/img/foundation/` — placeholder marketing renders owned by
  Foundation; swap for the operator's own photography before commercial use
  (noted in the footer fine print).
- Buttons on the landing are landing-local (`.fd-pill`/`.fd-bar`); the
  shared Button component is untouched for the rest of the app.

## Desk round: request metrics, service editor, overview symmetry

## Desk round: request metrics, service editor, overview symmetry (latest)

- **Booking requests period metrics:** the Overview card gains This week /
  Month / Fiscal (calendar quarter) toggles — received (+$ asked), approval
  rate, captured revenue, still-open, and per-day volume bars in the week
  view. One aggregate (`overviewExtras.requestStats`), holdout excluded,
  client-side switching.
- **Service library add/edit:** "New service" opens an inline editor; each
  card gains Edit. Name, category, description, price + unit, inventory,
  cutoff, Instant vs Needs approval, and room-type picks for upgrades.
  Server: `saveOffer` (`editOffers` role, audited, RLS-tenant-scoped, ids
  minted server-side). No delete — Pause covers it.
- **Overview symmetry:** the card columns now lay out as two height-matched
  bands (hero/chart/live-book over desk-queue/reference cards), so all three
  columns end on the same line.
- **Header de-dup:** removed the second Staylift mark beside the hotel crest
  on desktop — the icon rail carries the brand link.

## Open access — the dashboard no longer requires sign-in

## Open access — the dashboard no longer requires sign-in (latest)

The deployed app blocked visitors behind a login wall (the platform injects
`VITE_AUTH_ENABLED=true`, so every `/hotel/*`, `/desk` and `/onboarding` visit
redirected to `/login`). Now:

- **`STAYLIFT_OPEN_ACCESS` (default on)**: with no session, every authed server
  function resolves the caller to one shared identity, **Demo Visitor**
  (`src/lib/auth/demo-identity*.ts`), idempotently bootstrapped (once per
  serverless instance) as an **owner** member of the demo hotel The Marlowe —
  so every dashboard screen, including Team/Settings/Audit, works signed-out.
  All visitors edit the same demo data; audit rows are attributed to Demo
  Visitor.
- Real sign-in is untouched and always wins over the demo identity: staff who
  sign in (email/password or OAuth) get their own workspace, onboarding and
  invitations exactly as before.
- The `/login` page stays fully functional and gains a "Just exploring? Open
  the demo hotel desk" link; the landing nav's "Sign in" button is now "Open
  the dashboard"; the account menu shows a demo note instead of Sign out for
  the shared identity.
- **Kill switch:** set `STAYLIFT_OPEN_ACCESS=off` (locally or as a Vercel env
  var) to restore the exact previous 401 → `/login` wall. The route-level
  redirect guards were left in place as that safety net.
- Deliberately not `VITE_AUTH_ENABLED=false`: on a real database that mode
  fail-closes (`verify.server.ts`) and would 401 everyone, including signed-in
  staff.

## Phases A–C: accounts, data protection, check-in capture, guest profiles

Decisions applied: markets are a per-hotel setting (US, UK, EU, UAE presets); occasion
bookings will use a request form (phase D); companions are guest-entered and never
contacted; Postmark with a per-hotel sending subdomain.

### A — Sign-in, roles, hotel separation, encryption, audit
- **Staff accounts:** email + password sign-in (`/login`). New users create a hotel
  (`/onboarding`) or open the demo. Invitations go by link (`/invite/<token>`): they're
  bound to the invited email, single-use and expire after 7 days.
- **Roles:** owner, manager and front desk (`roles.ts`).
  - Every server function checks the role.
  - The navigation only shows what the role can use.
  - Contacts are masked for the front desk; managers can reveal one, giving a reason, and the reveal is logged.
- **Hotel separation:**
  - Every hotel-owned table has `property_id` and Postgres row-level security.
  - App queries run in a transaction that sets `app.property_id` and switches to the
    non-owner role `staylift_app` (`tenant-db.ts`). A query that forgets the setting sees nothing.
  - Composite foreign keys stop a row pointing at another hotel's data.
  - Booking references are unique per hotel.
  - Verified on Postgres 16 (running as a non-superuser owner, as on Neon) and on PGLite.
- **Encryption:**
  - Guest contacts are stored with AES-256-GCM (`vault.ts`, `STAYLIFT_DATA_KEY`, key rotation supported).
  - Matching uses a keyed hash (HMAC blind index), so contacts aren't decrypted to find a guest.
  - With a real database and no key, storing contacts is refused.
- **Audit log** (`/hotel/audit`): append-only for the app role. Covers:
  - contact reveals, exports, erasures and merges
  - consent changes and team changes
  - orders, settings, retention runs
  - offer and recipe toggles, stay links, new bookings
- **Export and erase:**
  - Staff can export or erase from the guest profile; the guest can do the same from their preference page.
  - Erasing keeps a hashed suppression marker and the consent history, and anonymises the guest's stays.
  - Bookings without a profile can be erased from Reservations.
- **Stay links** are now 144-bit random tokens, and row ids are 96-bit.

### B — Check-in capture step
- **New check-in flow** (`components/checkin-flow.tsx`):
  1. Arrival time and "celebrating anything?" (month and day only).
  2. Who's travelling with you. Never contacted; children are stored by age band, without a name.
  3. The guest's own email or WhatsApp, confirmed by a 6-digit code.
  4. Three consents, none ticked by default.
- **Code safeguards:**
  - 5 tries per code; wrong tries are counted.
  - 5 codes per booking per hour, plus a per-device limit.
  - OTA relay addresses are refused.
- **Consent ticket:** consents need a short-lived ticket that only the person who entered the code gets. Holding the stay link isn't enough to opt someone in.
- **Same flow in three places:**
  - the guest's phone
  - the **desk tablet** (`/desk`)
  - the **desk QR** (`/c/<code>`, printable from Settings; the guest finds their booking by last name + reference)
- **Retention clocks** (daily, plus `/api/cron/retention`):
  - OTA booking data: 30 days after departure (Booking.com verified; others conservative).
  - Stay-only details: per hotel setting.
  - Verification codes: 7 days.
  - Profiles with every consent withdrawn: erased after 30 days.
- **Gate panel on Overview:**
  - Own contact ≥ 40% of OTA check-ins.
  - Marketable ≥ 10%.
  - Check-in completion drop ≤ 3 points.
  - Also shows step-by-step drop-off and an evidence level.

### C — Guest profiles
- **Profiles exist only with a verified contact plus a consent.** They're matched on the verified email or phone (never the name). A returning guest is recognised.
- **Occasions:** month and day only.
- **Holidays:** chosen by the guest. In GDPR markets the wording calls out religion and culture.
- **Companions:** with the rules above.
- **Consent ledger:** append-only, storing the exact wording and its version. Only the guest can opt in; staff can record a withdrawal.
- **Merge:** manual. It moves stays and history, and the latest memory decision wins. Possible duplicates are flagged.
- **Staff screens:**
  - `/hotel/guests`: search by name, or exact email or phone; filters; occasions coming up.
  - `/hotel/guests/<id>`.
- **Guest preference centre** (`/p/<token>`):
  - Turn consents on or off.
  - Edit dates and holidays, remove companions.
  - Download your data, delete everything.
  - The link is emailed to the verified address, and each new link retires the old one.

### Data and code
- **Migrations:**
  - `0001_auth.sql`: Better Auth schema.
  - `0007_tenancy_security.sql`: tenancy, roles, RLS, audit.
  - `0008_capture_profiles.sql`: capture, profiles, consent, suppressions.
- **New modules:** `access.ts`, `guests.ts`, `vault.ts`, `contact.ts`, `markets.ts`, `roles.ts`, `audit.ts`, `mailer.ts`, `qr.ts` (dependency-free QR encoder, checked by decoding), `tenant-db.ts`.
- **Tests:**
  - `privacy.test.ts` (36 unit tests pass in total).
  - A Postgres suite for every phase and for the security-review fixes.
  - The ROI and journey suites still pass.

## Guest journey (latest)
The product now runs the journey end to end:
**OTA booking → personalised booking email → personalised stay page → offer booked → hotelier dashboard.**

1. **Booking lands:** a pasted confirmation or a CSV row. Ingesting a booking sends the booking email automatically.
2. **Booking email** (`email-template.ts`): confirmation, online check-in, and the 3 offers picked for this stay, each with its reason. The version depends on the recipient:
   - **Full** — the guest's own address gets offer cards with prices and one-tap links (`?src=email&offer=…`).
   - **Light** — an OTA relay address (e.g. @guest.booking.com) gets the picks and their reasons only: no prices, one link to the stay page. Everything in it stays about this reservation.
   - **Service** — holdout bookings get confirmation and check-in only.

   Preview any booking's email at `/hotel/email/<reservationId>` (Reservations → Email).
3. **Personalised stay page:** leads with the same picks under a headline written for the booking ("Picked for the two of you: 3 nights in Austin"). An email offer link opens that offer directly.
4. **Offer booked:** the order records which message brought the guest (`orders.source`), and the page visit does too (`events.source`).
5. **Dashboard:** Overview shows the journey funnel: OTA bookings → emailed → opened page → booked offer → email revenue. Each step counts only bookings that completed the step before it.

How offers are picked (`personalize.ts`): transparent rules over party size, nights, weekend nights, room type, lead time, booking channel and booking notes. Each pick carries a reason in plain words, and staff see the signals behind it on the email preview.

Data: `migrations/0006_guest_journey.sql` adds the source columns and backfills booking emails and visit sources for the pilot history.

Links in emails use the page's own address, or `PUBLIC_APP_URL` if you set it (you need it once the app is deployed).

## New
- `/roi` — ROI calculator. Two tabs:
  - **Hotel ROI:** inputs, three scenarios, plans A/B/C/custom, a P&L waterfall, the pricing rule and guarantee checks, break-even, a plan × scenario table, and a sensitivity chart with a table view.
  - **Staylift unit economics:** messaging cost by market, gross margin, LTV, CAC payback and portfolio ARR.
  - The URL carries every input, so a model can be shared as a link.
- `/hotel/roi` — Measured ROI. Lift per completed stay compares treatment with a random holdout, using a Welch 95% interval and an evidence level. Also shows:
  - incremental revenue, and the hotel's net after fees and card costs
  - status against the 90-day guarantee
  - the measured funnel
  - "Project a full year", which opens `/roi` seeded with the measured rates
  - a contract and margin editor
- Holdout: new bookings are assigned to it at random (`properties.holdout_pct`, default 20%). Holdout guests get check-in only — no offers, no views logged, and purchases are rejected.
- Desk sales: logged in Fulfillment (`orders.channel = 'desk'`) for every guest, so the holdout baseline is real.

## Precision fixes
- **Funnel:** the steps are nested (bookings ⊇ reached ⊇ opened ⊇ bought), so a step can no longer pass 100%. This replaces 0004's "insert a view for everyone" workaround.
- **Metric definitions:**
  - attach rate = bought ÷ bookings
  - conversion = bought ÷ opened
  - pending orders are no longer counted as purchases
  - "Today" means captured today (`paid_at`), not "ordered or served today"
  - every pilot KPI is scoped to treatment bookings since `launched_on`
- **Prices:** the guest page and the server use the same `computeAmount` (`pricing.ts`). The page previously mispriced `person_night` items.
- **Upgrades:** request only. Staff can approve from 72 h before arrival.
- **Messaging:** at most 2 phone messages per booking, and every message stores its billed cost (WhatsApp utility rate + provider fee). Message subjects carry service content, not offers.
- **Consent:** a captured email no longer grants marketing consent.
- **Email parser:**
  - no longer reads "confirmation" as a booking reference
  - rejects departure ≤ arrival
  - rejects duplicate references
- **Data retention:** Booking.com contact data shows a purge date (departure + 30 days).

## Data
`migrations/0005_measured_lift.sql` is additive (`alter … add column if not exists`). It adds a deterministic 60-day pilot history: 720 completed stays with a ~20% holdout, desk sales, messages and check-ins.

## Code
- `src/lib/staylift/roi.ts` — the ROI engine (pure). `roi.test.ts` checks it against the v6 plan's numbers: conservative +$1,857, base +$4,834 (+$4,835 unrounded), upside +$8,698.
- `src/lib/staylift/queries.ts` — the SQL, which can be tested without the framework. `server.ts` is now thin validated wrappers around it.
- `src/routeTree.gen.ts` — updated by hand for `/roi` and `/hotel/roi`. The router plugin regenerates it on the next dev or build run.
