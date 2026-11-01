import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportLiftRows, getMeasuredRoi, updateEconomics } from "@/lib/staylift/server";
import {
  PLANS,
  clampInputs,
  customPlan,
  measureLift,
  measuredEconomics,
  type Evidence,
  type Plan,
} from "@/lib/staylift/roi";
import { DEFAULT_STATE, encodeState } from "@/lib/staylift/roi-url";
import { count, formatDateLong, pctOf, usd } from "@/lib/staylift/format";
import type { Economics } from "@/lib/staylift/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hotel/roi")({
  loader: () => getMeasuredRoi(),
  component: MeasuredRoiPage,
});

const GUARANTEE_DAYS = 90;

function planFrom(e: Economics): Plan {
  if (e.planId === "A" || e.planId === "B" || e.planId === "C") return PLANS[e.planId];
  return customPlan(e.perRoomMonthly, e.baseMonthly, e.revSharePct);
}

const EVIDENCE: Record<Evidence, { label: string; tone: "rose" | "amber" | "pine"; body: string }> = {
  too_few: {
    label: "Too early",
    tone: "rose",
    body: "Fewer than 50 completed stays in one group. Treat every number below as noise.",
  },
  directional: {
    label: "Directional",
    tone: "amber",
    body: "Enough to see the direction, not the size. The interval tightens once the holdout passes ~300 completed stays.",
  },
  solid: {
    label: "Solid",
    tone: "pine",
    body: "300+ completed holdout stays. The interval is narrow enough to price on.",
  },
};

function MeasuredRoiPage() {
  const m = Route.useLoaderData();
  const router = useRouter();
  const e = m.property.economics;
  const plan = planFrom(e);

  const lift = useMemo(() => measureLift(m.treatmentRevenue, m.holdoutRevenue), [m]);
  const months = m.daysLive / (365 / 12);
  const econ = measuredEconomics({
    lift,
    pageRevenue: m.pageRevenueCents / 100,
    pageOrders: m.pageOrders,
    rooms: m.property.rooms,
    months,
    plan,
    marginPct: e.marginPct,
    cardPct: e.cardPct,
    cardFixed: e.cardFixedCents / 100,
  });
  const evidence = EVIDENCE[lift.evidence];
  const annual = 365 / m.daysLive;

  const projection = encodeState({
    ...DEFAULT_STATE,
    plan,
    inputs: clampInputs({
      rooms: m.property.rooms,
      occupancyPct: m.property.occupancyPct,
      avgStayNights: m.property.avgStayNights,
      reachablePct: Math.round(m.rates.reachablePct),
      viewPct: Math.round(m.rates.viewPct),
      buyPct: Math.round(m.rates.buyPct * 2) / 2,
      avgSpend: Math.round(m.rates.avgSpend),
      ordersPerBuyer: Math.round(m.rates.ordersPerBuyer * 10) / 10,
      marginPct: e.marginPct,
      incrementalityPct: Math.round(econ.incrementality * 100),
      cardPct: e.cardPct,
      cardFixed: e.cardFixedCents / 100,
    }),
  });

  const day = Math.min(m.daysLive, GUARANTEE_DAYS);
  const guaranteeCopy =
    m.daysLive < GUARANTEE_DAYS
      ? econ.guarantee.passes
        ? `On track: day ${day} of ${GUARANTEE_DAYS}.`
        : `At risk: day ${day} of ${GUARANTEE_DAYS}.`
      : econ.guarantee.passes
        ? "Met at day 90 — fees stand."
        : "Missed at day 90 — fees are waived.";

  const maxBar = Math.max(lift.meanTreatment, lift.meanHoldout, 0.01);

  async function downloadCsv() {
    try {
      const res = await exportLiftRows();
      const blob = new Blob([res.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `staylift-stay-level-numbers-since-${res.launched}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.rows} stays — the rows behind the lift.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-stone">Measured, not modeled</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            What Staylift actually added
          </h1>
          <p className="mt-2 max-w-2xl text-stone">
            Completed stays since {formatDateLong(e.launchedOn)} ({m.daysLive} days).{" "}
            {count(lift.nTreatment)} stays saw offers; {count(lift.nHoldout)} were a random{" "}
            {e.holdoutPct}% holdout that got check-in only. The difference is the lift. Desk sales
            count in both groups.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link to="/roi" search={{ ...projection, from: "pilot" }}>
            <Button variant="secondary">Project a full year</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => void downloadCsv()}>
            Export stay-level numbers (.csv)
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-stone">
        The export is the audit trail for the guarantee: one row per stay since launch — booking
        reference, dates, holdout flag, page and desk revenue — nothing identifying beyond the
        reference the hotel issued.
      </p>

      <div className="mt-6 flex flex-wrap items-start gap-3 rounded-lg bg-paper px-4 py-3 shadow-[var(--shadow-border)]">
        <Badge tone={evidence.tone}>{evidence.label}</Badge>
        <p className="min-w-0 flex-1 text-sm text-stone">{evidence.body}</p>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tile
          label="Lift per completed stay"
          value={usd(lift.liftPerBooking, { sign: true, cents: true })}
          hint={`95% interval ${usd(lift.ci95[0], { cents: true })} to ${usd(lift.ci95[1], { cents: true })}`}
        />
        <Tile
          label="Incremental revenue"
          value={usd(econ.incrementalRevenue)}
          hint={`${pctOf(econ.incrementality, 0)} of page sales · range ${usd(econ.incrementalLow)}–${usd(econ.incrementalHigh)}`}
        />
        <Tile
          label="Hotel net after fees"
          value={usd(econ.hotelNet, { sign: true })}
          hint={`range ${usd(econ.netLow, { sign: true })} to ${usd(econ.netHigh, { sign: true })}`}
          emphasis={econ.hotelNet >= 0 ? "good" : "bad"}
        />
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
          <h2 className="font-display text-xl font-medium">Revenue per completed stay</h2>
          <p className="mt-1 text-sm text-stone">All paid ancillaries — stay page and front desk.</p>
          <div className="mt-6 space-y-5">
            <Bar
              label="Saw offers"
              n={lift.nTreatment}
              value={lift.meanTreatment}
              width={lift.meanTreatment / maxBar}
              className="bg-pine"
            />
            <Bar
              label="Holdout"
              n={lift.nHoldout}
              value={lift.meanHoldout}
              width={lift.meanHoldout / maxBar}
              className="bg-mist"
            />
          </div>
          <p className="mt-6 text-sm text-stone">
            Difference {usd(lift.liftPerBooking, { sign: true, cents: true })} ± {usd(1.96 * lift.standardError, { cents: true })} per stay.
            {lift.ci95[0] > 0
              ? " The interval stays above zero, so the lift is real; its size is still uncertain."
              : " The interval crosses zero — not yet distinguishable from no effect."}
          </p>
        </section>

        <section className="rounded-xl bg-pine p-5 text-pine-fg sm:p-6">
          <h2 className="font-display text-xl font-medium">The hotel’s P&amp;L line</h2>
          <dl className="mt-5 space-y-2 text-sm">
            <Row k="Sold through the stay page" v={usd(m.pageRevenueCents / 100)} />
            <Row k="Measured incremental" v={usd(econ.incrementalRevenue)} strong />
            <Row k={`× ${e.marginPct}% contribution margin`} v={usd(econ.incrementalRevenue * (e.marginPct / 100))} />
            <Row
              k={`Staylift fees · ${plan.id === "custom" ? "custom" : `plan ${plan.id}`} · ${months.toFixed(1)} mo`}
              v={`−${usd(econ.platformFees)}`}
            />
            <Row k={`Card processing ${e.cardPct}%`} v={`−${usd(econ.cardFees)}`} />
            <div className="my-2 border-t border-pine-fg/20" />
            <Row k="Net to the hotel" v={usd(econ.hotelNet, { sign: true })} strong />
            <Row k="Annualized" v={usd(econ.hotelNet * annual, { sign: true })} muted />
          </dl>
          <div className="mt-5 rounded-md bg-pine-fg/10 px-3 py-2.5 text-sm">
            <p className="font-medium">Guarantee · {guaranteeCopy}</p>
            <p className="mt-1 text-pine-fg/80">
              Incremental revenue {usd(econ.guarantee.lift)} vs 2× fees {usd(econ.guarantee.threshold)}.
            </p>
          </div>
          <p className="mt-4 text-xs text-pine-fg/70">
            Messaging is Staylift’s cost, not yours: {count(m.messagesSent)} messages,{" "}
            {usd(m.messagingCostCents / 100, { cents: true })} so far.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-medium">Measured funnel</h2>
          <p className="text-sm text-stone">Completed stays that saw offers</p>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Rate label="Reachable" value={pctOf(m.rates.reachablePct / 100, 0)} note="of bookings" />
          <Rate label="Opened page" value={pctOf(m.rates.viewPct / 100, 0)} note="of reachable" />
          <Rate label="Bought" value={pctOf(m.rates.buyPct / 100, 1)} note="of viewers" />
          <Rate label="Spend" value={usd(m.rates.avgSpend)} note="per buying stay" />
          <Rate label="Desk sales" value={usd(m.deskRevenueCents / 100)} note="both groups" />
        </dl>
        <p className="mt-5 text-sm text-stone">
          “Project a full year” opens the calculator with these rates and the measured{" "}
          {pctOf(econ.incrementality, 0)} incrementality instead of the 70% planning assumption.
        </p>
      </section>

      {m.canEditContract ? (
        <EconomicsForm key={JSON.stringify(e)} economics={e} onSaved={() => router.invalidate()} />
      ) : (
        <p className="mt-8 rounded-lg border border-line bg-cream px-4 py-3 text-sm text-stone">
          The contract and margin settings are owner-only.
        </p>
      )}
    </div>
  );
}

function EconomicsForm({ economics, onSaved }: { economics: Economics; onSaved: () => void }) {
  const [planId, setPlanId] = useState<Economics["planId"]>(economics.planId);
  const [custom, setCustom] = useState({
    perRoomMonthly: economics.perRoomMonthly,
    baseMonthly: economics.baseMonthly,
    revSharePct: economics.revSharePct,
  });
  const [margin, setMargin] = useState(economics.marginPct);
  const [card, setCard] = useState(economics.cardPct);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const p = planId === "custom" ? custom : PLANS[planId];
    try {
      await updateEconomics({
        data: {
          planId,
          perRoomMonthly: p.perRoomMonthly,
          baseMonthly: p.baseMonthly,
          revSharePct: p.revSharePct,
          marginPct: margin,
          cardPct: card,
        },
      });
      toast.success("Economics saved. Numbers above are recalculated.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
      <h2 className="font-display text-xl font-medium">Contract and margin</h2>
      <p className="mt-1 text-sm text-stone">
        The plan this hotel pays and its own margin on add-ons. Everything above uses these.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Plan">
        {(["A", "B", "C", "custom"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={planId === id}
            onClick={() => setPlanId(id)}
            className={cn(
              "rounded-md px-3 py-2.5 text-left text-sm",
              planId === id ? "bg-pine text-pine-fg" : "bg-cream shadow-[var(--shadow-border)]",
            )}
          >
            <span className="block font-medium">{id === "custom" ? "Custom" : `Plan ${id}`}</span>
            <span className={cn("block text-xs", planId === id ? "text-pine-fg/80" : "text-stone")}>
              {id === "custom" ? "Negotiated" : PLANS[id].note.split(".")[0]}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-5">
        {planId === "custom" ? (
          <>
            <Num label="$ / room / month" value={custom.perRoomMonthly} onChange={(v) => setCustom({ ...custom, perRoomMonthly: v })} />
            <Num label="$ base / month" value={custom.baseMonthly} onChange={(v) => setCustom({ ...custom, baseMonthly: v })} />
            <Num label="Revenue share %" value={custom.revSharePct} onChange={(v) => setCustom({ ...custom, revSharePct: v })} />
          </>
        ) : null}
        <Num label="Contribution margin %" value={margin} onChange={setMargin} />
        <Num label="Card processing %" value={card} onChange={setCard} />
      </div>
      <Button className="mt-5" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </section>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm text-stone">
      {label}
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 tabular-nums text-ink outline-none focus:border-pine"
      />
    </label>
  );
}

function Tile({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint: string;
  emphasis?: "good" | "bad";
}) {
  return (
    <div className="rounded-lg bg-paper px-4 py-4 shadow-[var(--shadow-border)]">
      <dt className="text-xs uppercase tracking-[0.14em] text-stone">{label}</dt>
      <dd
        className={cn(
          "mt-2 font-display text-3xl font-medium tabular-nums tracking-tight",
          emphasis === "bad" && "text-rose",
        )}
      >
        {value}
      </dd>
      <p className="mt-1 text-xs text-stone">{hint}</p>
    </div>
  );
}

function Bar({
  label,
  n,
  value,
  width,
  className,
}: {
  label: string;
  n: number;
  value: number;
  width: number;
  className: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>
          {label} <span className="text-stone">· {count(n)} stays</span>
        </span>
        <span className="tabular-nums">{usd(value, { cents: true })}</span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-cream">
        <div className={cn("h-3 rounded-full", className)} style={{ width: `${Math.max(2, width * 100)}%` }} />
      </div>
    </div>
  );
}

function Row({ k, v, strong, muted }: { k: string; v: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={muted ? "text-pine-fg/60" : "text-pine-fg/80"}>{k}</dt>
      <dd className={cn("tabular-nums", strong && "font-medium", muted && "text-pine-fg/60")}>{v}</dd>
    </div>
  );
}

function Rate({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-stone">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums">{value}</dd>
      <p className="text-xs text-stone">{note}</p>
    </div>
  );
}
