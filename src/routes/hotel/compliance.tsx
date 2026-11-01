import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getComplianceReport } from "@/lib/staylift/server";
import { formatDateLong } from "@/lib/staylift/format";
import { MARKETS } from "@/lib/staylift/markets";

export const Route = createFileRoute("/hotel/compliance")({
  loader: () => getComplianceReport(),
  component: CompliancePage,
});

function CompliancePage() {
  const r = Route.useLoaderData();
  const law = MARKETS[r.market.id]?.law ?? "";
  const allRls = r.security.rowLevelSecurity.every((t) => t.enabled);

  return (
    <div className="mx-auto max-w-3xl stagger-in">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-stone">For security & privacy reviews</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Compliance report</h1>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="size-4" /> Print / save PDF
        </Button>
      </div>
      <p className="mt-3 max-w-2xl text-sm text-stone print:mt-1">
        Everything on this page is generated from ledgers that already exist — the consent ledger,
        audit log, purge clocks and live database checks. Nothing is asserted that the product
        cannot show.
      </p>

      <section className="mt-6 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] print:mt-4 print:shadow-none sm:p-6">
        <h2 className="font-display text-xl font-semibold">Programme</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Fact label="Hotel" value={`${r.property.name}, ${r.property.city}`} />
          <Fact label="Rooms" value={String(r.property.rooms)} />
          <Fact label="Market" value={`${r.market.label}`} />
          <Fact label="Live since" value={formatDateLong(r.property.economics.launchedOn)} />
          <Fact label="Plan" value={r.property.economics.planId ?? "custom"} />
          <Fact label="Holdout share" value={`${r.property.economics.holdoutPct}% of bookings`} />
          <Fact label="Generated" value={`${r.generatedAt.slice(0, 16).replace("T", " ")} UTC`} />
          <Fact label="Sign-in" value="Email + password, per-hotel roles" />
          <Fact label="Guest accounts" value="None — tokenised stay links" />
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-stone">{law}</p>
      </section>

      <section className="mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] print:shadow-none sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Security</h2>
          <Badge tone={allRls ? "good" : "rose"}>
            {allRls ? "Row-level security verified live" : "RLS gap detected"}
          </Badge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Fact
            label="Guest contact encryption"
            value={
              r.security.encryption.mode === "configured"
                ? "AES-256-GCM, customer key"
                : r.security.encryption.mode === "dev"
                  ? "AES-256-GCM, dev key"
                  : "Not configured"
            }
          />
          <Fact label="Email channel" value={r.security.email.mode} />
          <Fact label="Roles" value="Owner · manager · front desk" />
        </dl>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {r.security.rowLevelSecurity.map((t) => (
            <li key={t.table} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="font-mono text-xs">{t.table}</span>
              <Badge tone={t.enabled ? "good" : "rose"}>{t.enabled ? "RLS on" : "RLS off"}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-stone">
          Verified live against this database at the moment this report was generated — every query
          in the product runs inside a transaction that sets the hotel scope and switches to the
          restricted role.
        </p>
      </section>

      <section className="mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] print:shadow-none sm:p-6">
        <h2 className="font-display text-xl font-semibold">Consent & privacy ledger</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Fact label="Consent events (total)" value={r.counts.consents.total.toLocaleString()} />
          <Fact label="Consent events (90 days)" value={r.counts.consents.last90.toLocaleString()} />
          <Fact label="Suppression markers" value={r.counts.suppressions.toLocaleString()} />
          <Fact label="Guest profiles (active)" value={r.counts.profilesActive.toLocaleString()} />
          <Fact label="Profiles erased" value={r.counts.profilesErased.toLocaleString()} />
          <Fact label="Stays anonymised" value={r.counts.staysAnonymized.toLocaleString()} />
        </dl>
        {r.counts.consents.byPurpose.length > 0 ? (
          <>
            <p className="mt-4 text-xs uppercase tracking-[0.12em] text-stone">Granted consents by purpose</p>
            <ul className="mt-2 space-y-1.5">
              {r.counts.consents.byPurpose.map((p) => (
                <li key={p.purpose} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">{p.purpose}</span>
                  <span className="tabular-nums">{p.n.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-stone">
              Every consent event stores the exact wording version the guest saw. Only the guest can
              opt in; staff can record a withdrawal. Profiles exist only with a verified contact plus
              a consent.
            </p>
          </>
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] print:shadow-none sm:p-6">
        <h2 className="font-display text-xl font-semibold">Retention</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Fact label="Last retention run" value={r.lastPurgeOn ? formatDateLong(r.lastPurgeOn) : "not yet run"} />
          <Fact label="Stay-detail retention" value={`${r.property.settings.serviceRetentionDays} days`} />
          <Fact label="OTA contact data" value="Purged 30 days after departure" />
        </dl>
        <p className="mt-2 text-xs text-stone">
          Verification codes expire after 7 days. OTA relay addresses are refused at check-in and
          their booking data is purged on the clock above. Erased guests keep only a hashed
          suppression marker so an erasure survives a re-booking.
        </p>
      </section>

      <section className="mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] print:shadow-none sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Measured programme</h2>
          <Link to="/hotel/roi" className="text-sm text-stone hover:text-ink print:hidden">
            Measured ROI →
          </Link>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Fact label="Offered stays" value={r.counts.treatmentStays.toLocaleString()} />
          <Fact label="Holdout stays" value={r.counts.holdoutStays.toLocaleString()} />
          <Fact label="Audit log entries" value={`${r.counts.auditEntries.toLocaleString()} (${r.counts.auditLast30} in 30 days)`} />
        </dl>
        <p className="mt-2 text-xs text-stone">
          Revenue lift is measured against the random holdout with a 95% confidence interval. The
          stay-level rows behind the lift can be exported from the Measured ROI page, and every
          contact reveal, export, erasure and consent change is in the append-only audit log.
        </p>
      </section>

      <p className="mt-6 text-center text-xs text-stone print:mt-2">
        Generated by Staylift · {r.property.name} · {r.generatedAt.slice(0, 16).replace("T", " ")} UTC
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-stone">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
