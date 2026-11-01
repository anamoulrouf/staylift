# Staylift Commercial Addendum — DRAFT for lawyer review

> **Status:** working draft prepared for the design-partner conversations. This is a product
> team's plain-English draft, **not legal advice**. Every bracketed value is a decision point.
> Take this to a lawyer in the launch market before signature. Companion to the business plan
> ("Trust wave, weeks 1–2").

**Between:** Staylift Ltd. ("Staylift") and ______________________ ("the Hotel")
**Product:** Staylift ancillary-revenue automation (booking email, stay page, desk tools, measurement)
**Plan:** ☐ A — $[1]/room/mo + [7]% rev-share ☐ B — $[4]/room/mo flat ☐ Custom: ____________

---

## 1. Definitions

**1.1 Ancillary revenue** — all amounts guests pay for offers presented through Staylift, whether
paid through the stay page, captured by Staylift, or logged by the Hotel as a desk sale.

**1.2 Incremental revenue** — Ancillary revenue measured against a randomised **holdout**: a
percentage of the Hotel's bookings (the "Holdout Share", Clause 4) that is shown no offers.
Incremental revenue per stay = average ancillary revenue of offered stays − average ancillary
revenue of holdout stays (including desk sales logged at the holdout, which form the baseline).

**1.3 Measured lift** — Incremental revenue per stay, reported with a 95% confidence interval
(Welch method) and an evidence grade: *too few* (<50 completed holdout stays), *directional*
(<300), *solid* (≥300).

**1.4 Logging compliance** — the Hotel's desk sales are recorded in Staylift for **all** guests,
holdout included, within [24] hours of sale.

## 2. Performance guarantee and remedy

2.1 Over each consecutive [90]-day period from first live booking ("Guarantee Period"), Staylift
guarantees that **Incremental revenue ≥ 2× the Staylift fees payable for that period**, as measured
by the holdout method in Clause 1 and reported in the product ("Measured ROI").

2.2 **Remedy.** If the guarantee is not met for a Guarantee Period, the Hotel may elect, within 30
days of the Measured ROI report: (a) a refund of [100]% of the fees paid for that period; or
(b) [one month] of free service. This is the sole performance remedy and does not limit other
rights under the Agreement.

2.3 **Condition.** The guarantee applies only while Logging compliance (1.4) is maintained. If the
Hotel's desk-sale logging falls below [80]% same-day logging in any month (sampled against the
Hotel's folio/POS), the Guarantee Period restarts once logging is restored. The parties
acknowledge the holdout baseline is only as honest as the desk log.

2.4 **Audit right.** The Hotel may export the stay-level measurement rows (reference, dates,
holdout flag, page and desk revenue) at any time from the product, and Staylift will provide them
within [5] business days of request.

## 3. Data ownership, portability and exit

3.1 **Ownership.** All Hotel and guest data (bookings, orders, profiles, consents, audit log)
belongs to the Hotel. Staylift uses it only to operate the service for the Hotel.

3.2 **Portability.** The Hotel can export guests, consents, orders and stay-level measurement rows
as CSV at any time from the product. On termination, Staylift will deliver a complete export
within [10] business days and delete Hotel-identifying data within [30] days, retaining only
suppression hashes required by law (see 3.3).

3.3 **Suppression records.** Hashed markers of erased/unsubscribed contacts are kept after
deletion solely to honour the guest's erasure/opt-out if the same contact returns. These cannot be
reversed into personal data.

3.4 **No sale, no ads.** Staylift will never sell Hotel or guest data, use it to train models for
other customers, or market to the Hotel's guests on its own behalf.

## 4. Holdout share and shrink schedule

4.1 Default **Holdout Share: [20]%** of bookings, assigned randomly, shown no offers.

4.2 **Shrink schedule:** after *solid* evidence (≥300 completed holdout stays, Clause 1.3) the
Holdout Share drops to **[10]%**; after [6] months of sustained solid evidence the parties will
negotiate in good faith toward [5]%, balanced against the Hotel's interest in a defensible lift
number. The current Holdout Share is always shown in Settings.

## 5. Channels and OTA compliance

5.1 **Service messaging.** Bookings arriving through online travel agencies (OTA relay inboxes,
e.g. `@guest.booking.com`) receive **service-only** messages about the stay (confirmation, check-in,
stay-specific offers without prices under the "Light" format). Staylift enforces this in code:
relay addresses cannot receive marketing, and their contact data is purged [30] days after
departure.

5.2 **Marketing.** Marketing (priced offers, occasion campaigns) is sent only to contacts the
guest verified and consented to at check-in or later, with per-channel consent records and
frequency caps ([2] messages per booking). Every consent event stores its wording version.

5.3 **Liability allocation.** Staylift owns the compliance of the message templates, formats,
timing rules and enforcement logic it supplies, and will maintain them against published OTA
policies (including Booking.com General Delivery Terms [2.9.3] and Airbnb off-platform policy).
The Hotel owns the accuracy and lawful basis of content it authors itself and the facts about its
own services. If a channel operator takes action against the Hotel arising from Staylift's
standard templates or logic, Staylift will [refund the fees paid for the trailing 3 months and
work remediation at no cost].

5.4 **Messaging law.** WhatsApp messaging requires the guest opt-in captured in product; US SMS
requires 10DLC registration before first send; occasion content that could relate to religion or
similar sensitive categories is only ever **self-selected by the guest** (GDPR Art. 9 posture),
never inferred.

## 6. Security posture (summary — full report printable in-product)

- Per-hotel row-level security in Postgres; staff roles (owner/manager/front desk) enforced server-side.
- Guest contact details encrypted (AES-256-GCM) with a keyed blind index; key rotation supported.
- Append-only audit log of reveals, exports, erasures, consents, money decisions and settings.
- Guest export and erasure self-service via the preference centre; OTA data purge clocks.

---

**Staylift Ltd.** — Name/Title/Date
**The Hotel** — Name/Title/Date

> Open decision points for the lawyer: [refund %], [notice/exit notice period], [logging-compliance
> threshold], [holdout shrink percentages], [liability cap], which entity signs in the launch
> market, and consumer-law review of the remedy in UK/EU deals.
